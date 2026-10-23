import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

import {
  Conversation,
  ConversationParticipant,
  ChatMessage,
  UserProfile,
} from '../../../../core/models';
import { InitialsPipe } from '../../../../shared/pipes/initials.pipe';

export interface SharedFileItem {
  name: string;
  url: string;
  isImage: boolean;
  date: string;
}

@Component({
  selector: 'app-chat-contact-info',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    InitialsPipe,
  ],
  templateUrl: './chat-contact-info.component.html',
  styleUrl: './chat-contact-info.component.scss',
})
export class ChatContactInfoComponent {
  readonly participant = input<ConversationParticipant | null>(null);
  readonly conversation = input<Conversation | null>(null);
  readonly messages = input<ChatMessage[]>([]);
  readonly project = input<any | null>(null);
  readonly userProfile = input<UserProfile | null>(null);

  readonly close = output<void>();
  readonly viewProfile = output<string>();

  readonly isMuted = signal(false);

  readonly isGroup = computed(() => {
    const type = this.conversation()?.type;
    return type === 'group' || type === 'project';
  });

  readonly groupTitle = computed(() => {
    return this.conversation()?.name || this.project()?.title || 'Chat del equipo';
  });

  readonly participants = computed(() => {
    return this.conversation()?.participants ?? [];
  });

  formatMemberRole(role?: string): string {
    switch (role) {
      case 'student': return 'Estudiante';
      case 'company': return 'Tutor Empresarial';
      case 'faculty': return 'Asesor Docente';
      case 'admin': return 'Coordinador';
      default: return 'Miembro';
    }
  }

  readonly roleLabel = computed(() => {
    const role = this.participant()?.role;
    switch (role) {
      case 'student':
        return 'Estudiante';
      case 'company':
        return 'Empresa';
      case 'faculty':
        return 'Docente / Tutor';
      case 'admin':
        return 'Administrador';
      default:
        return 'Contacto';
    }
  });

  readonly roleIcon = computed(() => {
    const role = this.participant()?.role;
    switch (role) {
      case 'student':
        return 'school';
      case 'company':
        return 'business';
      case 'faculty':
        return 'menu_book';
      default:
        return 'person';
    }
  });

  readonly sharedFiles = computed<SharedFileItem[]>(() => {
    const msgs = this.messages();
    const items: SharedFileItem[] = [];

    for (const msg of msgs) {
      if (msg.attachments && msg.attachments.length > 0) {
        for (const att of msg.attachments) {
          items.push({
            name: att.fileName || 'Archivo adjunto',
            url: att.fileUrl,
            isImage: !!att.mimeType?.startsWith('image/'),
            date: msg.createdAt,
          });
        }
      } else if (msg.messageType === 'file' || msg.messageType === 'image') {
        items.push({
          name: msg.fileName || (msg.messageType === 'image' ? 'Imagen' : 'Archivo adjunto'),
          url: msg.fileUrl || '',
          isImage: msg.messageType === 'image',
          date: msg.createdAt,
        });
      }
    }

    return items;
  });

  toggleMute(): void {
    this.isMuted.update(m => !m);
  }

  onViewProfileClick(): void {
    const id = this.participant()?.userId;
    if (id) {
      this.viewProfile.emit(id);
    }
  }
}
