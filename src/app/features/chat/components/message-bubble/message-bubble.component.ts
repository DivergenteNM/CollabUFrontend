import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ChatMessage } from '../../../../core/models';

@Component({
  selector: 'app-message-bubble',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, MatIconModule],
  host: {
    'class': 'message-bubble',
    '[class.message-bubble--sent]': 'isMine() && message().messageType !== "system"',
    '[class.message-bubble--received]': '!isMine() && message().messageType !== "system"',
    '[class.message-bubble--system]': 'message().messageType === "system"',
  },
  templateUrl: './message-bubble.component.html',
  styleUrl: './message-bubble.component.scss',
})
export class MessageBubbleComponent {
  readonly message = input.required<ChatMessage>();
  readonly currentUserId = input.required<string>();
  readonly sending = input<boolean>(false);

  readonly isMine = computed(() => this.message().senderId === this.currentUserId());
}
