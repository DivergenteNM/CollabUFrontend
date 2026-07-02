import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { Conversation } from '../../../../core/models';
import { RelativeTimePipe } from '../../../../shared/pipes/relative-time.pipe';

@Component({
  selector: 'app-conversation-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SlicePipe, MatListModule, MatIconModule, MatBadgeModule, RelativeTimePipe],
  host: { 'class': 'conversation-list' },
  templateUrl: './conversation-list.component.html',
  styleUrl: './conversation-list.component.scss',
})
export class ConversationListComponent {
  readonly conversations = input.required<Conversation[]>();
  readonly activeId = input<string>('');
  readonly currentUserId = input<string>('');
  readonly select = output<string>();

  getOtherParticipant(conv: Conversation) {
    return conv.participants.find(p => p.userId !== this.currentUserId()) ?? conv.participants[0];
  }
}
