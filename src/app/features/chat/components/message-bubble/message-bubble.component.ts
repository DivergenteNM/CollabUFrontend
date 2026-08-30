import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ChatMessage } from '../../../../core/models';

@Component({
  selector: 'app-message-bubble',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, MatIconModule, MatTooltipModule],
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
  /**
   * Un mensaje optimista que no fue confirmado por el servidor dentro del
   * tiempo esperado (ver `chat-room.component.ts`) — antes quedaba mostrando
   * el ícono de "enviando" indefinidamente, sin ninguna señal de que algo
   * falló (hallazgo H7, pruebas con usuarios finales — rol Estudiante).
   */
  readonly failed = input<boolean>(false);
  readonly retry = output<void>();

  readonly isMine = computed(() => this.message().senderId === this.currentUserId());
}
