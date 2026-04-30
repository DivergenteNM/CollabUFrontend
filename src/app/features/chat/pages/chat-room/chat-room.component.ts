import {
  Component, ChangeDetectionStrategy, inject, input, signal, computed,
  OnInit, OnDestroy, ElementRef, viewChild, effect,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { httpResource } from '@angular/common/http';
import { Subscription, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { environment } from '../../../../../environments/environment';
import {
  PaginatedResponse, Conversation, ChatMessage, ApiResponse,
} from '../../../../core/models';
import { AuthStore } from '../../../../state/auth.store';
import { UiStore } from '../../../../state/ui.store';
import { ChatRealtimeService } from '../../../../core/services/chat-realtime.service';
import { ChatService } from '../../services/chat.service';
import { MessageBubbleComponent } from '../../components/message-bubble/message-bubble.component';
import { TypingIndicatorComponent } from '../../components/typing-indicator/typing-indicator.component';
import { SkeletonComponent } from '../../../../shared/components/ui/skeleton/skeleton.component';

@Component({
  selector: 'app-chat-room',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule, ScrollingModule,
    MatButtonModule, MatIconModule, MatInputModule, MatFormFieldModule, MatProgressSpinnerModule,
    MessageBubbleComponent, TypingIndicatorComponent, SkeletonComponent,
  ],
  templateUrl: './chat-room.component.html',
  styleUrl: './chat-room.component.scss',
})
export class ChatRoomComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly chatRealtime = inject(ChatRealtimeService);
  private readonly chatService = inject(ChatService);
  readonly authStore = inject(AuthStore);
  readonly uiStore = inject(UiStore);

  readonly conversationId = input.required<string>();
  readonly messagesContainer = viewChild<ElementRef<HTMLElement>>('messagesContainer');

  readonly messageText = signal('');
  readonly page = signal(1);
  readonly loadingMore = signal(false);
  readonly typingUserName = signal<string | null>(null);
  readonly otherParticipantName = signal('Usuario');
  readonly otherParticipantOnline = signal(false);

  // Optimistic: messages being sent (temporary ids)
  readonly pendingMessageIds = signal<Set<string>>(new Set());

  // Accumulated messages from pages + realtime
  readonly historicalMessages = signal<ChatMessage[]>([]);
  readonly realtimeMessages = signal<ChatMessage[]>([]);

  readonly currentUserId = computed(() => this.authStore.user()?.id ?? '');

  readonly allMessages = computed(() => [
    ...this.historicalMessages(),
    ...this.realtimeMessages(),
  ]);

  readonly messagesResource = httpResource<PaginatedResponse<ChatMessage>>(
    () => ({
      url: `${environment.apiUrl}/chat/conversations/${this.conversationId()}/messages`,
      params: { page: this.page(), limit: 50 },
    }),
  );

  readonly totalMessages = computed(() =>
    this.messagesResource.value()?.meta?.total ?? 0,
  );

  readonly hasMorePages = computed(() => {
    const total = this.totalMessages();
    return this.historicalMessages().length < total;
  });

  // Conversation info resource
  readonly conversationResource = httpResource<ApiResponse<Conversation>>(
    () => ({
      url: `${environment.apiUrl}/chat/conversations`,
    }),
  );

  private subs: Subscription[] = [];
  private typingSubject = new Subject<string>();
  private typingTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // When messages resource loads, prepend to historical
    effect(() => {
      const data = this.messagesResource.value()?.data;
      if (data) {
        const reversed = [...data].reverse();
        if (this.page() === 1) {
          this.historicalMessages.set(reversed);
        } else {
          this.historicalMessages.update(prev => [...reversed, ...prev]);
        }
        this.loadingMore.set(false);
      }
    });
  }

  ngOnInit(): void {
    const convId = this.conversationId();

    // Join room & mark as read
    this.chatRealtime.joinConversation(convId);
    this.chatRealtime.markAsRead(convId);

    // Listen for new messages
    this.subs.push(
      this.chatRealtime.onMessage().subscribe(msg => {
        if (msg.conversationId === convId) {
          // Remove from pending if it was our optimistic message
          this.pendingMessageIds.update(ids => {
            const next = new Set(ids);
            // Match by content for optimistic removal
            next.forEach(id => {
              const pending = this.realtimeMessages().find(m => m.id === id);
              if (pending && pending.content === msg.content && pending.senderId === msg.senderId) {
                next.delete(id);
              }
            });
            return next;
          });

          // Replace optimistic or push real message
          this.realtimeMessages.update(msgs => {
            const optimisticIdx = msgs.findIndex(
              m => this.pendingMessageIds().has(m.id) === false
                && m.content === msg.content
                && m.senderId === msg.senderId
                && m.id.startsWith('temp-')
            );
            if (optimisticIdx >= 0) {
              const updated = [...msgs];
              updated[optimisticIdx] = msg;
              return updated;
            }
            return [...msgs, msg];
          });

          this.chatRealtime.markAsRead(convId);
          this.scrollToBottom();
        }
      }),
    );

    // Listen for typing
    this.subs.push(
      this.chatRealtime.onTyping().subscribe(data => {
        if (data.conversationId === convId && data.userId !== this.currentUserId()) {
          if (data.isTyping) {
            this.typingUserName.set(this.otherParticipantName());
            if (this.typingTimeout) clearTimeout(this.typingTimeout);
            this.typingTimeout = setTimeout(() => this.typingUserName.set(null), 3000);
          } else {
            this.typingUserName.set(null);
          }
        }
      }),
    );

    // Listen for user status
    this.subs.push(
      this.chatRealtime.onUserStatus().subscribe(data => {
        this.otherParticipantOnline.set(data.isOnline);
      }),
    );

    // Typing debounce
    this.subs.push(
      this.typingSubject.pipe(
        debounceTime(300),
        distinctUntilChanged(),
      ).subscribe(text => {
        this.chatRealtime.sendTyping(convId, text.length > 0);
      }),
    );

    // Load conversation info for header
    this.loadConversationInfo();
  }

  ngOnDestroy(): void {
    this.chatRealtime.leaveConversation(this.conversationId());
    this.subs.forEach(s => s.unsubscribe());
    if (this.typingTimeout) clearTimeout(this.typingTimeout);
  }

  onTextChange(text: string): void {
    this.messageText.set(text);
    this.typingSubject.next(text);
  }

  onEnter(event: Event): void {
    event.preventDefault();
    this.sendMessage();
  }

  sendMessage(): void {
    const content = this.messageText().trim();
    if (!content) return;

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: tempId,
      conversationId: this.conversationId(),
      senderId: this.currentUserId(),
      senderName: this.authStore.user()?.email ?? '',
      content,
      messageType: 'text',
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    this.realtimeMessages.update(msgs => [...msgs, optimisticMsg]);
    this.pendingMessageIds.update(ids => new Set([...ids, tempId]));
    this.messageText.set('');

    // Send via WebSocket
    this.chatRealtime.sendMessage(this.conversationId(), content);
    this.chatRealtime.sendTyping(this.conversationId(), false);

    this.scrollToBottom();
  }

  loadMore(): void {
    this.loadingMore.set(true);
    this.page.update(p => p + 1);
  }

  goBack(): void {
    this.router.navigate(['/chat']);
  }

  isSending(msgId: string): boolean {
    return this.pendingMessageIds().has(msgId);
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const el = this.messagesContainer()?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    }, 50);
  }

  private loadConversationInfo(): void {
    // Extract participant info from the conversations API
    this.chatService.getConversations().subscribe(res => {
      const conv = res.data?.find(c => c.id === this.conversationId());
      if (conv) {
        const other = conv.participants.find(p => p.userId !== this.currentUserId())
          ?? conv.participants[0];
        if (other) {
          this.otherParticipantName.set(other.displayName);
          this.otherParticipantOnline.set(other.isOnline);
        }
      }
    });
  }
}
