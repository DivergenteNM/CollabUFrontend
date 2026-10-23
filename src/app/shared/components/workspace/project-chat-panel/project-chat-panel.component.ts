import {
  Component,
  ChangeDetectionStrategy,
  inject,
  input,
  computed,
  signal,
  viewChild,
  ElementRef,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ChatService } from '../../../../features/chat/services/chat.service';
import { ChatRealtimeService } from '../../../../core/services/chat-realtime.service';
import { StorageService } from '../../../../core/services/storage.service';
import { ChatUnreadStore } from '../../../../state/chat-unread.store';
import { AuthStore } from '../../../../state/auth.store';
import { RelativeTimePipe } from '../../../pipes/relative-time.pipe';
import { InitialsPipe } from '../../../pipes/initials.pipe';
import { EmojiPickerComponent } from '../../../../features/chat/components/emoji-picker/emoji-picker.component';
import { ChatMessageAttachment, Conversation } from '../../../../core/models';
import { environment } from '../../../../../environments/environment';

interface PendingMessage {
  tempId: string;
  content: string;
  files: File[];
  status: 'sending' | 'failed';
  createdAt: string;
}

export interface DisplayMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  attachments?: ChatMessageAttachment[];
  createdAt: string;
  isPending?: boolean;
  isFailed?: boolean;
  tempId?: string;
}

/**
 * Panel de chat grupal integrado en el workspace. Reutiliza la conversación de tipo
 * `project` que agrupa a los participantes principales (estudiante, empresa, asesor)
 * con diseño moderno estilo WhatsApp, selector de emojis, adjuntos y panel de participantes.
 */
@Component({
  selector: 'app-project-chat-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    RelativeTimePipe,
    InitialsPipe,
    EmojiPickerComponent,
  ],
  templateUrl: './project-chat-panel.component.html',
  styleUrl: './project-chat-panel.component.scss',
})
export class ProjectChatPanelComponent implements OnInit, OnDestroy {
  readonly applicationId = input.required<string>();
  readonly projectId = input<string | null>(null);
  readonly participantIds = input<string[]>([]);

  private readonly router = inject(Router);
  private readonly chatService = inject(ChatService);
  private readonly realtime = inject(ChatRealtimeService);
  private readonly storageService = inject(StorageService);
  private readonly chatUnreadStore = inject(ChatUnreadStore);
  private readonly authStore = inject(AuthStore);

  readonly scrollContainer = viewChild<ElementRef<HTMLElement>>('scrollContainer');
  readonly messageInput = viewChild<ElementRef<HTMLTextAreaElement>>('messageInput');

  readonly conversation = signal<Conversation | null>(null);
  readonly conversationId = signal<string | null>(null);
  readonly loadingConversation = signal(false);
  readonly loadError = signal(false);
  readonly sending = signal(false);

  readonly showEmojiPicker = signal(false);
  readonly showGroupInfo = signal(false);

  readonly messages = signal<DisplayMessage[]>([]);
  readonly pending = signal<PendingMessage[]>([]);
  readonly selectedFiles = signal<File[]>([]);

  draft = '';

  private readonly destroy$ = new Subject<void>();

  readonly connectionStatus = this.realtime.connectionStatus;
  readonly currentUserId = computed(() => this.authStore.user()?.id ?? null);
  readonly participants = computed(() => this.conversation()?.participants ?? []);

  readonly groupTitle = computed(() => {
    const conv = this.conversation();
    return conv?.name || 'Chat del equipo';
  });

  readonly subtitleText = computed(() => {
    const count = this.participants().length;
    const countStr = count > 0 ? `${count} participante${count === 1 ? '' : 's'}` : '';
    const status = this.connectionStatus();
    const connStr = status === 'connected' ? 'En línea' : status === 'connecting' ? 'Conectando…' : 'Sin conexión';
    return countStr ? `${countStr} • ${connStr}` : connStr;
  });

  readonly displayMessages = computed<DisplayMessage[]>(() => {
    const server = this.messages();
    const pendingItems = this.pending().map<DisplayMessage>((p) => ({
      id: p.tempId,
      senderId: this.currentUserId() ?? 'me',
      senderName: 'Tú',
      content: p.content,
      attachments: p.files.length > 0
        ? p.files.map((f) => ({ fileUrl: '', fileName: f.name, fileSizeBytes: f.size, mimeType: f.type }))
        : undefined,
      createdAt: p.createdAt,
      isPending: p.status === 'sending',
      isFailed: p.status === 'failed',
      tempId: p.tempId,
    }));

    return [...server, ...pendingItems].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  });

  ngOnInit(): void {
    this.initConversation();

    this.realtime.onMessage().pipe(takeUntil(this.destroy$)).subscribe((msg: any) => {
      if (!this.conversationId() || msg.conversationId !== this.conversationId()) return;
      if (this.messages().some((m) => m.id === msg.id)) return;
      const isMine = msg.senderId === this.currentUserId();
      const matched = this.participants().find((p) => p.userId === msg.senderId);
      const senderName = isMine
        ? 'Tú'
        : (matched?.displayName || (msg.senderName && msg.senderName !== 'Tú' ? msg.senderName : 'Participante'));

      const display: DisplayMessage = {
        id: msg.id,
        senderId: msg.senderId,
        senderName,
        content: msg.content,
        attachments: msg.attachments,
        createdAt: msg.createdAt,
      };
      this.messages.update((prev) => [...prev, display]);
      this.chatUnreadStore.clearConversation(this.conversationId()!, this.projectId());
      this.scrollToBottom();
    });
  }

  ngOnDestroy(): void {
    const id = this.conversationId();
    if (id) this.realtime.leaveConversation(id);
    this.destroy$.next();
    this.destroy$.complete();
  }

  initConversation(): void {
    this.loadingConversation.set(true);
    this.loadError.set(false);

    const participantIds = this.participantIds();
    const projectId = this.projectId();
    if (!projectId || participantIds.length === 0) {
      this.loadingConversation.set(false);
      return;
    }

    this.chatService.createConversation(participantIds, 'project', projectId, undefined, this.applicationId()).subscribe({
      next: (res: any) => {
        const conv: Conversation = res?.data ?? res;
        if (!conv?.id) {
          this.loadError.set(true);
          this.loadingConversation.set(false);
          return;
        }
        this.conversation.set(conv);
        this.conversationId.set(conv.id);
        this.loadingConversation.set(false);
        this.realtime.joinConversation(conv.id);
        this.loadMessages(conv.id);
      },
      error: () => {
        this.loadError.set(true);
        this.loadingConversation.set(false);
      },
    });
  }

  private loadMessages(conversationId: string): void {
    this.chatService.getMessages(conversationId, { page: 1, limit: 40 }).subscribe({
      next: (res: any) => {
        const items: any[] = res?.data ?? [];
        const parts = this.participants();
        const display: DisplayMessage[] = items
          .slice()
          .reverse()
          .map((m) => {
            const isMine = m.senderId === this.currentUserId();
            const matched = parts.find((p) => p.userId === m.senderId);
            return {
              id: m.id,
              senderId: m.senderId,
              senderName: isMine ? 'Tú' : (matched?.displayName || m.senderName || 'Participante'),
              content: m.content,
              attachments: m.attachments,
              createdAt: m.createdAt,
            };
          });
        this.messages.set(display);
        this.chatService.markAsRead(conversationId).subscribe({
          next: () => this.chatUnreadStore.clearConversation(conversationId, this.projectId()),
          error: () => {},
        });
        this.scrollToBottom();
      },
      error: () => this.messages.set([]),
    });
  }

  send(): void {
    const content = this.draft.trim();
    const files = this.selectedFiles();
    const convId = this.conversationId();
    if ((!content && files.length === 0) || !convId || this.sending()) return;

    const tempId = 'tmp_' + Date.now().toString(36);
    const optimistic: PendingMessage = {
      tempId,
      content,
      files: files.slice(),
      status: 'sending',
      createdAt: new Date().toISOString(),
    };
    this.pending.update((prev) => [...prev, optimistic]);
    this.draft = '';
    this.selectedFiles.set([]);
    this.showEmojiPicker.set(false);
    this.sending.set(true);
    this.scrollToBottom();

    this.dispatchSend(convId, content, files, tempId);
  }

  private dispatchSend(convId: string, content: string, files: File[], tempId: string): void {
    const request$ = files.length > 0
      ? this.chatService.sendMessageWithFiles(convId, content, files)
      : this.chatService.sendMessage(convId, content);

    request$.subscribe({
      next: (res: any) => {
        this.sending.set(false);
        const saved = res?.data ?? res;
        this.pending.update((prev) => prev.filter((p) => p.tempId !== tempId));
        if (saved?.id) {
          this.messages.update((prev) =>
            prev.some((m) => m.id === saved.id)
              ? prev
              : [...prev, {
                id: saved.id,
                senderId: saved.senderId,
                senderName: 'Tú',
                content: saved.content ?? '',
                attachments: saved.attachments,
                createdAt: saved.createdAt,
              }],
          );
          this.scrollToBottom();
        }
      },
      error: () => {
        this.sending.set(false);
        this.pending.update((prev) =>
          prev.map((p) => p.tempId === tempId ? { ...p, status: 'failed' } : p),
        );
      },
    });
  }

  retryMessage(tempId: string): void {
    const failed = this.pending().find((p) => p.tempId === tempId);
    const convId = this.conversationId();
    if (!failed || !convId) return;

    this.pending.update((prev) =>
      prev.map((p) => p.tempId === tempId ? { ...p, status: 'sending' } : p),
    );
    this.dispatchSend(convId, failed.content, failed.files, tempId);
  }

  toggleEmojiPicker(): void {
    this.showEmojiPicker.update((v) => !v);
  }

  onEmojiSelected(emoji: string): void {
    const textarea = this.messageInput()?.nativeElement;
    const current = this.draft;
    if (textarea && document.activeElement === textarea) {
      const start = textarea.selectionStart ?? current.length;
      const end = textarea.selectionEnd ?? current.length;
      const next = current.slice(0, start) + emoji + current.slice(end);
      this.draft = next;
      setTimeout(() => {
        textarea.focus();
        const nextPos = start + emoji.length;
        textarea.setSelectionRange(nextPos, nextPos);
      }, 0);
    } else {
      this.draft += emoji;
    }
  }

  onEnterPressed(event: Event): void {
    const keyEvent = event as KeyboardEvent;
    if (!keyEvent.shiftKey) {
      keyEvent.preventDefault();
      this.send();
    }
  }

  toggleGroupInfo(): void {
    this.showGroupInfo.update((v) => !v);
  }

  openInFullChat(): void {
    const id = this.conversationId();
    if (id) {
      this.router.navigate(['/chat', id]);
    }
  }

  onFilesPicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const picked = Array.from(input.files);
    this.selectedFiles.update((prev) => [...prev, ...picked]);
    input.value = '';
  }

  removeStagedFile(target: File): void {
    this.selectedFiles.update((prev) =>
      prev.filter((f) => !(f.name === target.name && f.size === target.size)),
    );
  }

  downloadUrlFor(att: ChatMessageAttachment): string {
    if (!att.fileUrl) return '#';
    return `${environment.apiUrl}/storage/files/${att.fileUrl}/download`;
  }

  iconForMime(mime?: string | null): string {
    if (!mime) return 'insert_drive_file';
    if (mime.startsWith('image/')) return 'image';
    if (mime.startsWith('video/')) return 'movie';
    if (mime.startsWith('audio/')) return 'audio_file';
    if (mime === 'application/pdf') return 'picture_as_pdf';
    if (mime.includes('word')) return 'description';
    if (mime.includes('sheet') || mime.includes('excel')) return 'table_chart';
    if (mime.includes('zip') || mime.includes('rar') || mime.includes('7z')) return 'folder_zip';
    return 'insert_drive_file';
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  formatRole(role?: string): string {
    switch (role) {
      case 'student': return 'Estudiante';
      case 'company': return 'Tutor Empresarial';
      case 'faculty': return 'Asesor Docente';
      case 'admin': return 'Coordinador';
      default: return 'Miembro';
    }
  }

  getSenderColor(senderId: string): string {
    const colors = [
      '#059669', // Emerald
      '#2563EB', // Blue
      '#D97706', // Amber
      '#7C3AED', // Violet
      '#DC2626', // Red
      '#0891B2', // Cyan
      '#EA580C', // Orange
      '#DB2777', // Pink
    ];
    let hash = 0;
    for (let i = 0; i < senderId.length; i++) {
      hash = senderId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  getDateLabel(dateStr?: string): string {
    if (!dateStr) return 'Hoy';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Hoy';
      const now = new Date();
      const isToday = d.getDate() === now.getDate() &&
                      d.getMonth() === now.getMonth() &&
                      d.getFullYear() === now.getFullYear();
      if (isToday) return 'Hoy';
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const isYesterday = d.getDate() === yesterday.getDate() &&
                          d.getMonth() === yesterday.getMonth() &&
                          d.getFullYear() === yesterday.getFullYear();
      if (isYesterday) return 'Ayer';
      return d.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return 'Hoy';
    }
  }

  shouldShowDateDivider(curr: DisplayMessage, prev: DisplayMessage | null): boolean {
    if (!prev) return true;
    try {
      const d1 = new Date(curr.createdAt).toDateString();
      const d2 = new Date(prev.createdAt).toDateString();
      return d1 !== d2;
    } catch {
      return false;
    }
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const el = this.scrollContainer()?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    }, 40);
  }
}
