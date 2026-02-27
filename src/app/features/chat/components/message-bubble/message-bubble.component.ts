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
    '[class.mine]': 'isMine()',
    '[class.system]': 'message().messageType === "system"',
  },
  template: `
    @if (message().messageType === 'system') {
      <div class="bubble__system">{{ message().content }}</div>
    } @else {
      <div class="bubble__wrapper">
        @if (!isMine()) {
          <div class="bubble__avatar">
            <mat-icon>person</mat-icon>
          </div>
        }

        <div class="bubble__content">
          @if (!isMine()) {
            <span class="bubble__sender">{{ message().senderName }}</span>
          }

          <div class="bubble__body">
            @if (message().messageType === 'file') {
              <a class="bubble__file" [href]="message().fileUrl" target="_blank" rel="noopener">
                <mat-icon>attach_file</mat-icon>
                {{ message().fileName ?? 'Archivo adjunto' }}
              </a>
            }
            @if (message().content) {
              <p class="bubble__text">{{ message().content }}</p>
            }
          </div>

          <div class="bubble__footer">
            <span class="bubble__time">{{ message().createdAt | date:'HH:mm' }}</span>
            @if (isMine()) {
              <mat-icon class="bubble__status" [class.read]="message().isRead">
                {{ message().isRead ? 'done_all' : 'done' }}
              </mat-icon>
            }
            @if (sending()) {
              <mat-icon class="bubble__sending">schedule</mat-icon>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    :host {
      display: flex;
      margin-bottom: 4px;
    }

    :host(.mine) {
      justify-content: flex-end;
    }

    :host(.system) {
      justify-content: center;
    }

    .bubble__system {
      font-size: 0.75rem;
      color: var(--mat-sys-on-surface-variant);
      background: var(--mat-sys-surface-variant);
      padding: 4px 12px;
      border-radius: 12px;
      text-align: center;
      margin: 8px 0;
    }

    .bubble__wrapper {
      display: flex;
      gap: 8px;
      max-width: 75%;
    }

    .bubble__avatar {
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
      display: flex;
      align-items: center;
      justify-content: center;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }

    .bubble__content {
      display: flex;
      flex-direction: column;
    }

    .bubble__sender {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--mat-sys-primary);
      margin-bottom: 2px;
    }

    .bubble__body {
      padding: 10px 14px;
      border-radius: 16px;
      background: var(--mat-sys-surface-container);
    }

    :host(.mine) .bubble__body {
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
    }

    .bubble__text {
      margin: 0;
      font-size: 0.875rem;
      line-height: 1.4;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .bubble__file {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.8125rem;
      color: var(--mat-sys-primary);
      text-decoration: none;
      margin-bottom: 4px;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      &:hover { text-decoration: underline; }
    }

    .bubble__footer {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 4px;
      justify-content: flex-end;
    }

    .bubble__time {
      font-size: 0.6875rem;
      color: var(--mat-sys-on-surface-variant);
    }

    .bubble__status {
      font-size: 14px;
      width: 14px;
      height: 14px;
      color: var(--mat-sys-on-surface-variant);
      &.read { color: #4caf50; }
    }

    .bubble__sending {
      font-size: 14px;
      width: 14px;
      height: 14px;
      color: var(--mat-sys-on-surface-variant);
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `,
})
export class MessageBubbleComponent {
  readonly message = input.required<ChatMessage>();
  readonly currentUserId = input.required<string>();
  readonly sending = input<boolean>(false);

  readonly isMine = computed(() => this.message().senderId === this.currentUserId());
}
