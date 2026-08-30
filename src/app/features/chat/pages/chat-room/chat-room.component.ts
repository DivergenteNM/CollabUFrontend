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
import { ProjectService } from '../../../projects/services/project.service';
import { MessageBubbleComponent } from '../../components/message-bubble/message-bubble.component';
import { TypingIndicatorComponent } from '../../components/typing-indicator/typing-indicator.component';
import { SkeletonComponent } from '../../../../shared/components/ui/skeleton/skeleton.component';
import { getConversationTitle, getConversationSubtitle, isGroupConversation } from '../../utils/conversation-display';

/** Tiempo de espera antes de marcar un mensaje optimista como fallido si el servidor nunca lo confirma. */
const MESSAGE_SEND_TIMEOUT_MS = 10000;

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
  private readonly projectService = inject(ProjectService);
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
  /**
   * Título/subtítulo mostrados en el encabezado, calculados con el mismo
   * criterio que la lista de conversaciones (ver conversation-display.ts):
   * si la conversación está vinculada a un proyecto, el título del proyecto
   * es el nombre principal, no la otra persona.
   */
  readonly roomTitle = signal('Usuario');
  readonly roomSubtitle = signal('');
  readonly isGroupChat = signal(false);

  // Optimistic: messages being sent (temporary ids)
  readonly pendingMessageIds = signal<Set<string>>(new Set());
  /**
   * Mensajes optimistas que no fueron confirmados por el servidor dentro de
   * `MESSAGE_SEND_TIMEOUT_MS`. Antes de este ajuste, un mensaje sin
   * confirmación quedaba mostrando el ícono de "enviando" para siempre, sin
   * ninguna señal de error (hallazgo H7, pruebas con usuarios finales — rol
   * Estudiante). No cambia el transporte ni el protocolo del chat: solo hace
   * visible al estudiante un estado que antes era indistinguible de "colgado".
   */
  readonly failedMessageIds = signal<Set<string>>(new Set());
  private readonly pendingTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

  // Accumulated messages from pages + realtime
  readonly historicalMessages = signal<ChatMessage[]>([]);
  readonly realtimeMessages = signal<ChatMessage[]>([]);

  readonly currentUserId = computed(() => this.authStore.user()?.id ?? '');
  /** Expuesto para que la plantilla muestre un aviso cuando el socket no está conectado. */
  readonly connectionStatus = this.chatRealtime.connectionStatus;

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
        const sorted = [...data];
        if (this.page() === 1) {
          this.historicalMessages.set(sorted);
        } else {
          this.historicalMessages.update(prev => [...sorted, ...prev]);
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
          const confirmedIds: string[] = [];
          this.pendingMessageIds.update(ids => {
            const next = new Set(ids);
            // Match by content for optimistic removal
            next.forEach(id => {
              const pending = this.realtimeMessages().find(m => m.id === id);
              if (pending && pending.content === msg.content && pending.senderId === msg.senderId) {
                next.delete(id);
                confirmedIds.push(id);
              }
            });
            return next;
          });
          // La confirmación llegó — ya no hace falta el timeout de fallo, y si
          // había llegado a marcarse como fallido (confirmación tardía), deja
          // de estarlo.
          if (confirmedIds.length > 0) {
            confirmedIds.forEach(id => {
              const timeout = this.pendingTimeouts.get(id);
              if (timeout) clearTimeout(timeout);
              this.pendingTimeouts.delete(id);
            });
            this.failedMessageIds.update(ids => {
              const next = new Set(ids);
              confirmedIds.forEach(id => next.delete(id));
              return next;
            });
          }

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
    this.pendingTimeouts.forEach(t => clearTimeout(t));
    this.pendingTimeouts.clear();
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
    this.messageText.set('');
    this.sendOptimistic(content);
  }

  /** Reintenta un mensaje que quedó marcado como fallido, con el mismo contenido. */
  retryMessage(failedId: string): void {
    const failedMsg = this.realtimeMessages().find(m => m.id === failedId);
    if (!failedMsg) return;

    this.realtimeMessages.update(msgs => msgs.filter(m => m.id !== failedId));
    this.failedMessageIds.update(ids => {
      const next = new Set(ids);
      next.delete(failedId);
      return next;
    });
    this.sendOptimistic(failedMsg.content);
  }

  isFailed(msgId: string): boolean {
    return this.failedMessageIds().has(msgId);
  }

  private sendOptimistic(content: string): void {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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

    // Send via WebSocket
    this.chatRealtime.sendMessage(this.conversationId(), content);
    this.chatRealtime.sendTyping(this.conversationId(), false);

    // Si el servidor nunca confirma este mensaje (socket caído, reconectando,
    // evento perdido), antes quedaba "enviando" para siempre sin ningún aviso.
    this.pendingTimeouts.set(tempId, setTimeout(() => {
      this.pendingTimeouts.delete(tempId);
      if (this.pendingMessageIds().has(tempId)) {
        this.failedMessageIds.update(ids => new Set([...ids, tempId]));
      }
    }, MESSAGE_SEND_TIMEOUT_MS));

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
      if (!conv) return;

      const other = conv.participants.find(p => p.userId !== this.currentUserId())
        ?? conv.participants[0];
      if (other) {
        this.otherParticipantName.set(other.displayName);
        this.otherParticipantOnline.set(other.isOnline);
      }

      this.isGroupChat.set(isGroupConversation(conv));
      this.roomTitle.set(getConversationTitle(conv, this.currentUserId()));
      this.roomSubtitle.set(getConversationSubtitle(conv, this.currentUserId()));

      if (conv.projectId) {
        this.projectService.getById(conv.projectId).subscribe({
          next: (res) => {
            const title = (res as any)?.data?.title ?? (res as any)?.title;
            if (!title) return;
            this.roomTitle.set(getConversationTitle(conv, this.currentUserId(), title));
          },
          error: () => {
            // Proyecto no accesible o eliminado — se conserva el nombre de la otra persona.
          },
        });
      }
    });
  }
}
