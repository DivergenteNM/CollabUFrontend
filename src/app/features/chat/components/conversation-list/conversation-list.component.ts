import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { SlicePipe, NgTemplateOutlet } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatRippleModule } from '@angular/material/core';
import { Conversation } from '../../../../core/models';
import { RelativeTimePipe } from '../../../../shared/pipes/relative-time.pipe';
import {
  getConversationTitle, getConversationSubtitle, isGroupConversation,
} from '../../utils/conversation-display';

type ConvKind = 'direct' | 'group' | 'project';

@Component({
  selector: 'app-conversation-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SlicePipe, NgTemplateOutlet, MatIconModule, MatBadgeModule, MatRippleModule, RelativeTimePipe],
  host: { 'class': 'conversation-list' },
  templateUrl: './conversation-list.component.html',
  styleUrl: './conversation-list.component.scss',
})
export class ConversationListComponent {
  readonly conversations = input.required<Conversation[]>();
  readonly activeId = input<string>('');
  readonly currentUserId = input<string>('');
  /** Título del proyecto por `projectId`, resuelto por el contenedor (ver chat-container.component.ts). */
  readonly projectTitles = input<Map<string, string>>(new Map());
  readonly select = output<string>();

  /**
   * Separadas en dos secciones para que un chat grupal nunca se confunda con
   * uno individual: antes se mezclaban en una sola lista ordenada solo por
   * actividad reciente, distinguibles apenas por un ícono pequeño.
   */
  readonly individualConversations = computed(() =>
    this.conversations().filter((c) => !isGroupConversation(c)),
  );
  readonly groupConversations = computed(() =>
    this.conversations().filter((c) => isGroupConversation(c)),
  );

  kind(conv: Conversation): ConvKind {
    return (conv.type ?? 'direct') as ConvKind;
  }

  isGroup(conv: Conversation): boolean {
    return isGroupConversation(conv);
  }

  title(conv: Conversation): string {
    const projectTitle = conv.projectId ? this.projectTitles().get(conv.projectId) : undefined;
    return getConversationTitle(conv, this.currentUserId(), projectTitle);
  }

  subtitle(conv: Conversation): string {
    return getConversationSubtitle(conv, this.currentUserId());
  }

  avatarIcon(conv: Conversation): string {
    switch (this.kind(conv)) {
      case 'group':   return 'groups';
      case 'project': return 'work';
      default:        return conv.projectId ? 'work' : 'person';
    }
  }

  /** Solo tiene sentido para directos; en grupos no dibujamos el punto de online. */
  isOnline(conv: Conversation): boolean {
    if (this.isGroup(conv)) return false;
    return this.getOtherParticipant(conv)?.isOnline ?? false;
  }

  private getOtherParticipant(conv: Conversation) {
    return conv.participants.find((p) => p.userId !== this.currentUserId()) ?? conv.participants[0];
  }
}
