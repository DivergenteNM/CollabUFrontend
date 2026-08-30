import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { SlicePipe, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { Conversation } from '../../../../core/models';
import { InitialsPipe } from '../../../../shared/pipes/initials.pipe';
import { RelativeTimePipe } from '../../../../shared/pipes/relative-time.pipe';

/** Conversation puede llegar sin `type` desde APIs viejas; fallback a 'direct'. */
type ConvKind = 'direct' | 'group' | 'project';

@Component({
  selector: 'app-conversation-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SlicePipe, DatePipe, MatIconModule, MatBadgeModule, InitialsPipe, RelativeTimePipe],
  host: { 'class': 'conversation-list' },
  templateUrl: './conversation-list.component.html',
  styleUrl: './conversation-list.component.scss',
})
export class ConversationListComponent {
  readonly conversations = input.required<Conversation[]>();
  readonly activeId = input<string>('');
  readonly currentUserId = input<string>('');
  readonly select = output<string>();

  kind(conv: Conversation): ConvKind {
    return ((conv as any).type ?? 'direct') as ConvKind;
  }

  /** Título mostrado: para grupos y proyectos usa el nombre; para directos, el otro participante. */
  displayName(conv: Conversation): string {
    const type = this.kind(conv);
    if (type !== 'direct') {
      const name = (conv as any).name?.trim();
      if (name) return name;
      // Fallback: unir los primeros nombres de los otros participantes
      const others = (conv.participants ?? []).filter((p) => p.userId !== this.currentUserId());
      return others.map((p) => p.displayName).join(', ') || 'Grupo';
    }
    return this.getOtherParticipant(conv)?.displayName ?? 'Sin nombre';
  }

  avatarUrl(conv: Conversation): string | undefined {
    if (this.kind(conv) !== 'direct') return undefined;
    return this.getOtherParticipant(conv)?.avatarUrl;
  }

  avatarIcon(conv: Conversation): string {
    switch (this.kind(conv)) {
      case 'group':   return 'groups';
      case 'project': return 'work';
      default:        return 'person';
    }
  }

  /** Solo tiene sentido para directos; en grupos no dibujamos el punto de online. */
  isOnline(conv: Conversation): boolean {
    if (this.kind(conv) !== 'direct') return false;
    return this.getOtherParticipant(conv)?.isOnline ?? false;
  }

  formatTime(dateStr?: string): string {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      const now = new Date();
      const isToday = d.getDate() === now.getDate() &&
                      d.getMonth() === now.getMonth() &&
                      d.getFullYear() === now.getFullYear();
      if (isToday) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      }
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  }

  private getOtherParticipant(conv: Conversation) {
    return conv.participants.find((p) => p.userId !== this.currentUserId()) ?? conv.participants[0];
  }

  participantsSummary(conv: Conversation): string {
    const count = (conv.participants ?? []).length;
    return `${count} participante${count === 1 ? '' : 's'}`;
  }
}

