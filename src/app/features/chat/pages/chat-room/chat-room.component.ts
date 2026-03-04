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
  template: `
    <div class="room">
      <!-- Header -->
      <header class="room__header">
        @if (uiStore.isMobile()) {
          <button mat-icon-button aria-label="Volver" (click)="goBack()">
            <mat-icon>arrow_back</mat-icon>
          </button>
        }

        <div class="room__header-avatar" [class.online]="otherParticipantOnline()">
          <mat-icon>person</mat-icon>
        </div>
        <div class="room__header-info">
          <span class="room__header-name">{{ otherParticipantName() }}</span>
          <span class="room__header-status">
            {{ otherParticipantOnline() ? 'En línea' : 'Desconectado' }}
          </span>
        </div>
      </header>

      <!-- Messages -->
      <div class="room__messages" #messagesContainer>
        @if (messagesResource.isLoading() && allMessages().length === 0) {
          @for (_ of [1,2,3,4]; track $index) {
            <app-skeleton width="60%" height="48px" />
          }
        } @else {
          @if (hasMorePages()) {
            <div class="room__load-more">
              <button mat-button (click)="loadMore()" [disabled]="loadingMore()">
                @if (loadingMore()) {
                  <mat-spinner diameter="18" />
                } @else {
                  Cargar mensajes anteriores
                }
              </button>
            </div>
          }

          @for (msg of allMessages(); track msg.id) {
            <app-message-bubble
              [message]="msg"
              [currentUserId]="currentUserId()"
              [sending]="isSending(msg.id)" />
          }
        }

        @if (typingUserName()) {
          <app-typing-indicator [userName]="typingUserName()!" />
        }
      </div>

      <!-- Input -->
      <footer class="room__input">
        <div class="room__input-row">
          <mat-form-field appearance="outline" class="room__input-field">
            <mat-label>Mensaje</mat-label>
            <textarea
              matInput
              placeholder="Escribe un mensaje..."
              [ngModel]="messageText()"
              (ngModelChange)="onTextChange($event)"
              (keydown.enter)="onEnter($event)"
              cdkTextareaAutosize
              cdkAutosizeMinRows="1"
              cdkAutosizeMaxRows="4">
            </textarea>
          </mat-form-field>

          <button mat-icon-button class="room__send-btn" aria-label="Enviar mensaje"
            [disabled]="!messageText().trim()"
            (click)="sendMessage()">
            <mat-icon>send</mat-icon>
          </button>
        </div>
      </footer>
    </div>
  `,
  styles: `
    :host { display: flex; flex-direction: column; height: 100%; }

    .room {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .room__header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
      background: var(--mat-sys-surface);
      flex-shrink: 0;
    }

    .room__header-avatar {
      position: relative;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      &.online::after {
        content: '';
        position: absolute;
        bottom: 0;
        right: 0;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #4caf50;
        border: 2px solid var(--mat-sys-surface);
      }
    }

    .room__header-info {
      display: flex;
      flex-direction: column;
    }

    .room__header-name {
      font-weight: 600;
      font-size: 0.9375rem;
      color: var(--mat-sys-on-surface);
    }

    .room__header-status {
      font-size: 0.75rem;
      color: var(--mat-sys-on-surface-variant);
    }

    .room__messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      background: var(--mat-sys-surface-container-lowest);
    }

    .room__load-more {
      text-align: center;
      padding: 8px 0 16px;

      button {
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }
    }

    .room__input {
      padding: 12px 16px;
      border-top: 1px solid var(--mat-sys-outline-variant);
      background: var(--mat-sys-surface);
      flex-shrink: 0;
    }

    .room__input-row {
      display: flex;
      align-items: flex-end;
      gap: 8px;
    }

    .room__input-field {
      flex: 1;
      --mat-form-field-container-height: auto;

      textarea {
        resize: none;
        line-height: 1.4;
      }
    }

    .room__send-btn {
      margin-bottom: 8px;
      color: var(--mat-sys-primary);
    }
  `,
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
