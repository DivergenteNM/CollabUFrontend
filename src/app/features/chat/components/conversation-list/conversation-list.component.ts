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
  template: `
    <mat-nav-list>
      @for (conv of conversations(); track conv.id) {
        <a mat-list-item
          [class.active]="conv.id === activeId()"
          [class.unread]="conv.unreadCount > 0"
          (click)="select.emit(conv.id)">

          <div class="conv-item">
            <div class="conv-item__avatar"
              [class.online]="getOtherParticipant(conv).isOnline">
              <mat-icon>person</mat-icon>
            </div>

            <div class="conv-item__info">
              <div class="conv-item__top">
                <span class="conv-item__name">{{ getOtherParticipant(conv).displayName }}</span>
                @if (conv.lastMessage) {
                  <span class="conv-item__time">{{ conv.lastMessage.createdAt | relativeTime }}</span>
                }
              </div>
              <div class="conv-item__bottom">
                <span class="conv-item__preview">
                  @if (conv.lastMessage) {
                    {{ conv.lastMessage.content | slice:0:50 }}{{ conv.lastMessage.content.length > 50 ? '...' : '' }}
                  } @else {
                    Sin mensajes aún
                  }
                </span>
                @if (conv.unreadCount > 0) {
                  <span class="conv-item__badge" [matBadge]="conv.unreadCount" matBadgeSize="small" matBadgeColor="primary"></span>
                }
              </div>
            </div>
          </div>
        </a>
      } @empty {
        <div class="conv-empty">
          <mat-icon>forum</mat-icon>
          <p>No hay conversaciones</p>
        </div>
      }
    </mat-nav-list>
  `,
  styles: `
    :host {
      display: block;
      overflow-y: auto;
      flex: 1;
    }

    .conv-item {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
    }

    .conv-item__avatar {
      position: relative;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      &.online::after {
        content: '';
        position: absolute;
        bottom: 0;
        right: 0;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #4caf50;
        border: 2px solid var(--mat-sys-surface);
      }
    }

    .conv-item__info {
      flex: 1;
      min-width: 0;
    }

    .conv-item__top {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 8px;
    }

    .conv-item__name {
      font-weight: 500;
      font-size: 0.9375rem;
      color: var(--mat-sys-on-surface);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .conv-item__time {
      flex-shrink: 0;
      font-size: 0.75rem;
      color: var(--mat-sys-on-surface-variant);
    }

    .conv-item__bottom {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      margin-top: 2px;
    }

    .conv-item__preview {
      font-size: 0.8125rem;
      color: var(--mat-sys-on-surface-variant);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .conv-item__badge {
      flex-shrink: 0;
      width: 8px;
      height: 8px;
    }

    a.active {
      background: var(--mat-sys-secondary-container);
    }

    a.unread .conv-item__name {
      font-weight: 700;
    }

    a.unread .conv-item__preview {
      color: var(--mat-sys-on-surface);
      font-weight: 500;
    }

    .conv-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px 16px;
      color: var(--mat-sys-on-surface-variant);
      mat-icon { font-size: 40px; width: 40px; height: 40px; margin-bottom: 8px; opacity: 0.5; }
      p { margin: 0; font-size: 0.875rem; }
    }
  `,
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
