import {
  Component, ChangeDetectionStrategy, inject, input, computed, signal,
  OnInit, OnDestroy, effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ChatService } from '../../../../features/chat/services/chat.service';
import { ChatRealtimeService, ConnectionStatus } from '../../../../core/services/chat-realtime.service';
import { StorageService } from '../../../../core/services/storage.service';
import { ChatUnreadStore } from '../../../../state/chat-unread.store';
import { AuthStore } from '../../../../state/auth.store';
import { RelativeTimePipe } from '../../../pipes/relative-time.pipe';
import { ChatMessageAttachment } from '../../../../core/models';
import { environment } from '../../../../../environments/environment';

interface PendingMessage {
  tempId: string;
  content: string;
  files: File[];
  status: 'sending' | 'failed';
  createdAt: string;
}

interface DisplayMessage {
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
 * Panel de chat integrado en el workspace. Reutiliza la conversación de tipo
 * `project` que agrupa a los participantes principales (estudiante, empresa,
 * asesor) y muestra los últimos mensajes con envío inline. Reintento local
 * ante fallo. Los mensajes se persisten vía HTTP; el socket solo entrega
 * las notificaciones de nuevos mensajes.
 */
@Component({
  selector: 'app-project-chat-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule,
    MatProgressSpinnerModule, MatChipsModule,
    MatBadgeModule, MatTooltipModule,
    RelativeTimePipe,
  ],
  template: `
    <mat-card class="pcp">
      <mat-card-header class="pcp__header">
        <mat-card-title>
          <mat-icon>forum</mat-icon>
          Chat del proyecto
        </mat-card-title>
        <div class="pcp__status" [class]="'pcp__status--' + connectionStatus()"
          [matTooltip]="connectionTooltip()">
          <span class="pcp__status-dot"></span>
          <span class="pcp__status-label">{{ connectionLabel() }}</span>
        </div>
      </mat-card-header>

      <mat-card-content class="pcp__body">
        @if (loadingConversation()) {
          <div class="pcp__center">
            <mat-spinner diameter="24" />
            <span>Abriendo conversación…</span>
          </div>
        } @else if (loadError()) {
          <div class="pcp__center pcp__center--error">
            <mat-icon>error_outline</mat-icon>
            <span>No se pudo abrir el chat.</span>
            <button mat-stroked-button (click)="initConversation()">Reintentar</button>
          </div>
        } @else if (!conversationId()) {
          <div class="pcp__center">
            <mat-icon>chat_bubble_outline</mat-icon>
            <span>El chat aún no está disponible para este proyecto.</span>
          </div>
        } @else {
          <div class="pcp__messages" #scroll>
            @if (displayMessages().length === 0) {
              <p class="pcp__empty">
                <mat-icon>waving_hand</mat-icon>
                Todavía no hay mensajes. Rompe el hielo con un saludo.
              </p>
            } @else {
              @for (m of displayMessages(); track m.id) {
                <div class="pcp__msg"
                  [class.pcp__msg--own]="m.senderId === currentUserId()"
                  [class.pcp__msg--pending]="m.isPending"
                  [class.pcp__msg--failed]="m.isFailed">
                  <div class="pcp__msg-head">
                    <strong>{{ m.senderName }}</strong>
                    <span>{{ m.createdAt | relativeTime }}</span>
                  </div>
                  @if (m.content) {
                    <div class="pcp__msg-body">{{ m.content }}</div>
                  }
                  @if (m.attachments && m.attachments.length > 0) {
                    <div class="pcp__attachments">
                      @for (att of m.attachments; track att.id ?? att.fileUrl) {
                        <a class="pcp__attachment"
                          [href]="downloadUrlFor(att)"
                          target="_blank" rel="noopener">
                          <mat-icon>{{ iconForMime(att.mimeType) }}</mat-icon>
                          <span class="pcp__attachment-name">{{ att.fileName }}</span>
                          @if (att.fileSizeBytes) {
                            <span class="pcp__attachment-size">{{ formatSize(att.fileSizeBytes) }}</span>
                          }
                        </a>
                      }
                    </div>
                  }
                  @if (m.isFailed) {
                    <div class="pcp__msg-actions">
                      <button mat-button color="warn" (click)="retryMessage(m.tempId!)">
                        <mat-icon>refresh</mat-icon> Reintentar
                      </button>
                      <button mat-button (click)="discardMessage(m.tempId!)">Descartar</button>
                    </div>
                  }
                </div>
              }
            }
          </div>

          @if (selectedFiles().length > 0) {
            <div class="pcp__staged">
              @for (f of selectedFiles(); track f.name + f.size) {
                <span class="pcp__staged-chip">
                  <mat-icon>{{ iconForMime(f.type) }}</mat-icon>
                  {{ f.name }} <span class="pcp__attachment-size">{{ formatSize(f.size) }}</span>
                  <button mat-icon-button type="button" aria-label="Quitar adjunto"
                    (click)="removeStagedFile(f)">
                    <mat-icon>close</mat-icon>
                  </button>
                </span>
              }
            </div>
          }

          <form class="pcp__composer" (submit)="$event.preventDefault(); send()">
            <input #fileInput type="file" hidden multiple
              (change)="onFilesPicked($event)" />
            <button mat-icon-button type="button" [disabled]="sending()"
              (click)="fileInput.click()"
              matTooltip="Adjuntar archivo">
              <mat-icon>attach_file</mat-icon>
            </button>
            <mat-form-field appearance="outline" class="pcp__field">
              <mat-label>Escribe un mensaje…</mat-label>
              <input matInput [(ngModel)]="draft" name="draft"
                [disabled]="sending()" (keyup.enter)="send()"
                autocomplete="off" />
            </mat-form-field>
            <button mat-flat-button color="primary" type="submit"
              [disabled]="sending() || (!draft.trim() && selectedFiles().length === 0)">
              @if (sending()) {
                <mat-spinner diameter="18" />
              } @else {
                <mat-icon>send</mat-icon>
              }
            </button>
          </form>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .pcp { display: flex; flex-direction: column; }
    .pcp__header {
      display: flex; justify-content: space-between; align-items: center;
      padding-bottom: 8px;
      mat-card-title { display: flex; align-items: center; gap: 8px; font-size: 1rem; }
    }
    .pcp__status {
      display: flex; align-items: center; gap: 6px;
      font-size: 0.75rem;
      padding: 4px 10px; border-radius: 12px;
      background: var(--mat-sys-surface-variant, #eee);
    }
    .pcp__status-dot {
      width: 8px; height: 8px; border-radius: 50%; background: var(--text-disabled);
    }
    .pcp__status--connected .pcp__status-dot { background: var(--color-success); }
    .pcp__status--connecting .pcp__status-dot { background: var(--color-warning); animation: pulse 1s infinite; }
    .pcp__status--disconnected .pcp__status-dot,
    .pcp__status--error .pcp__status-dot { background: var(--color-error); }

    .pcp__body { display: flex; flex-direction: column; gap: 12px; min-height: 240px; }
    .pcp__center {
      display: flex; flex-direction: column; align-items: center;
      gap: 8px; padding: 32px 16px; color: var(--mat-sys-on-surface-variant);
      text-align: center;
      mat-icon { font-size: 32px; width: 32px; height: 32px; }
      button { margin-top: 8px; }
    }
    .pcp__center--error mat-icon { color: var(--color-error); }

    .pcp__messages {
      display: flex; flex-direction: column; gap: 10px;
      max-height: 380px; overflow-y: auto;
      padding: 4px 4px 8px;
    }
    .pcp__empty {
      display: flex; flex-direction: column; align-items: center;
      gap: 8px; color: var(--mat-sys-on-surface-variant); padding: 32px 8px;
      text-align: center;
    }

    .pcp__msg {
      background: var(--mat-sys-surface-container, #f5f5f5);
      border-radius: 10px; padding: 8px 12px; max-width: 90%;
      align-self: flex-start;
    }
    .pcp__msg--own {
      background: var(--mat-sys-primary-container, #dbeafe);
      align-self: flex-end;
    }
    .pcp__msg--pending { opacity: 0.7; }
    .pcp__msg--failed { border-left: 3px solid #c62828; }

    .pcp__msg-head {
      display: flex; justify-content: space-between; gap: 12px;
      font-size: 0.75rem; color: var(--mat-sys-on-surface-variant);
      margin-bottom: 2px;
    }
    .pcp__msg-body { font-size: 0.875rem; white-space: pre-wrap; word-break: break-word; }
    .pcp__msg-actions { margin-top: 4px; display: flex; gap: 4px; }

    .pcp__attachments {
      margin-top: 6px; display: flex; flex-direction: column; gap: 4px;
    }
    .pcp__attachment {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 4px 8px; border-radius: 6px;
      background: rgba(0,0,0,0.05);
      color: inherit; text-decoration: none;
      font-size: 0.8125rem;
    }
    .pcp__attachment:hover { background: rgba(0,0,0,0.10); }
    .pcp__attachment mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .pcp__attachment-name { font-weight: 500; }
    .pcp__attachment-size { font-size: 0.7rem; color: var(--mat-sys-on-surface-variant); }

    .pcp__staged {
      display: flex; gap: 6px; flex-wrap: wrap;
      padding: 6px 0;
    }
    .pcp__staged-chip {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 2px 4px 2px 10px; border-radius: 16px;
      background: var(--mat-sys-secondary-container, #e0e0e0);
      font-size: 0.8125rem;
    }
    .pcp__staged-chip mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .pcp__staged-chip button { width: 24px; height: 24px; line-height: 24px; }
    .pcp__staged-chip button mat-icon { font-size: 16px; }

    .pcp__composer { display: flex; gap: 8px; align-items: flex-start; }
    .pcp__field { flex: 1; }
    .pcp__field ::ng-deep .mat-mdc-form-field-subscript-wrapper { display: none; }

    @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
  `],
})
export class ProjectChatPanelComponent implements OnInit, OnDestroy {
  readonly applicationId = input.required<string>();
  readonly projectId = input<string | null>(null);
  readonly participantIds = input<string[]>([]);

  private readonly chatService = inject(ChatService);
  private readonly realtime = inject(ChatRealtimeService);
  private readonly storageService = inject(StorageService);
  private readonly chatUnreadStore = inject(ChatUnreadStore);
  private readonly authStore = inject(AuthStore);

  readonly selectedFiles = signal<File[]>([]);

  private readonly destroy$ = new Subject<void>();

  readonly loadingConversation = signal(false);
  readonly loadError = signal(false);
  readonly conversationId = signal<string | null>(null);
  readonly sending = signal(false);

  readonly messages = signal<DisplayMessage[]>([]);
  readonly pending = signal<PendingMessage[]>([]);

  draft = '';

  readonly connectionStatus = this.realtime.connectionStatus;
  readonly currentUserId = computed(() => this.authStore.user()?.id ?? null);

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
    // Garantiza orden cronológico ASC (más antiguos arriba, nuevos abajo).
    // No confiamos en el orden del backend ni en el orden de llegada por socket.
    return [...server, ...pendingItems].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  });

  readonly connectionLabel = computed(() => {
    switch (this.connectionStatus()) {
      case 'connected': return 'En línea';
      case 'connecting': return 'Conectando…';
      case 'disconnected': return 'Sin conexión';
      case 'error': return 'Error';
      default: return 'Inactivo';
    }
  });

  readonly connectionTooltip = computed(() => {
    switch (this.connectionStatus()) {
      case 'connected': return 'Los mensajes se sincronizan en tiempo real.';
      case 'connecting': return 'Restableciendo la conexión con el servidor.';
      case 'disconnected': return 'El envío HTTP sigue funcionando, pero no recibirás mensajes en tiempo real hasta que se restablezca la conexión.';
      case 'error': return 'No se pudo establecer conexión con el servidor de chat.';
      default: return 'Conexión inactiva.';
    }
  });

  constructor() {
    effect(() => {
      const id = this.applicationId();
      if (!id) return;
      // El componente puede recibir applicationId sin projectId aún si el
      // contexto todavía carga; se difiere la inicialización a ngOnInit.
    });
  }

  ngOnInit(): void {
    this.initConversation();

    this.realtime.onMessage().pipe(takeUntil(this.destroy$)).subscribe((msg: any) => {
      if (!this.conversationId() || msg.conversationId !== this.conversationId()) return;
      // Deduplicación: el envío HTTP ya insertó el mensaje en el signal antes
      // de que el socket lo replicara. Ignoramos IDs que ya están.
      if (this.messages().some((m) => m.id === msg.id)) return;
      const isMine = msg.senderId === this.currentUserId();
      const display: DisplayMessage = {
        id: msg.id,
        senderId: msg.senderId,
        // El backend puede devolver "Tú" en senderName porque lo mapea
        // desde el punto de vista del remitente; cuando el socket entrega
        // el mensaje al receptor, hay que sobrescribirlo con el nombre real
        // (o "Tú" si soy yo mismo el remitente).
        senderName: isMine ? 'Tú' : (msg.senderName && msg.senderName !== 'Tú' ? msg.senderName : 'Participante'),
        content: msg.content,
        attachments: msg.attachments,
        createdAt: msg.createdAt,
      };
      this.messages.update((prev) => [...prev, display]);
      // Los mensajes recibidos por el socket ya no cuentan como no leídos
      // porque el panel los está mostrando; el store lo compensa.
      this.chatUnreadStore.clearConversation(this.conversationId()!, this.projectId());
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

    // Si no hay participantes o projectId, no podemos abrir conversación
    // de proyecto; se muestra estado vacío que invita a abrir el chat 1-1.
    const participantIds = this.participantIds();
    const projectId = this.projectId();
    if (!projectId || participantIds.length === 0) {
      this.loadingConversation.set(false);
      return;
    }

    this.chatService.createConversation(participantIds, 'project', projectId, undefined, this.applicationId()).subscribe({
      next: (res: any) => {
        const conv = res?.data ?? res;
        if (!conv?.id) {
          this.loadError.set(true);
          this.loadingConversation.set(false);
          return;
        }
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
    this.chatService.getMessages(conversationId, { page: 1, limit: 30 }).subscribe({
      next: (res: any) => {
        const items: any[] = res?.data ?? [];
        const display: DisplayMessage[] = items
          .slice()
          .reverse()
          .map((m) => ({
            id: m.id,
            senderId: m.senderId,
            senderName: m.senderName ?? 'Participante',
            content: m.content,
            createdAt: m.createdAt,
          }));
        this.messages.set(display);
        // Al abrir el panel marcamos la conversación como leída para el
        // usuario actual — es una vista activa.
        this.chatService.markAsRead(conversationId).subscribe({
          next: () => this.chatUnreadStore.clearConversation(conversationId, this.projectId()),
          error: () => { /* no bloquear la UI por fallo de read-receipt */ },
        });
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
    this.sending.set(true);

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
          // Race condition: el socket puede haber entregado ya este mensaje
          // (el gateway difunde a la sala apenas se persiste). Sin este
          // guard, HTTP-response añade el mismo ID una segunda vez y Angular
          // dispara NG0955 por duplicate track key.
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

  discardMessage(tempId: string): void {
    this.pending.update((prev) => prev.filter((p) => p.tempId !== tempId));
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
    // `fileUrl` almacena el fileId del Storage Service; el endpoint de descarga
    // exige token, pero para adjuntos públicos y previsualización rápida se
    // usa el bloburl que StorageService construye en demanda. Como fallback,
    // devolvemos el fileId directo para que el navegador dispare el intercept.
    if (!att.fileUrl) return '#';
    // Enlace a la ruta de descarga; el interceptor añadirá el bearer.
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
}
