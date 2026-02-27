import {
  Component, ChangeDetectionStrategy, inject, computed, signal, OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Notification } from '../../../../core/models';
import { NotificationType } from '../../../../core/enums';
import { NotificationsStore } from '../../../../state/notifications.store';
import { NotificationService } from '../../services/notification.service';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state.component';
import { RelativeTimePipe } from '../../../../shared/pipes/relative-time.pipe';

interface GroupedNotifications {
  label: string;
  items: Notification[];
}

@Component({
  selector: 'app-notification-center',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule, MatIconModule, MatDividerModule, MatProgressSpinnerModule,
    EmptyStateComponent, RelativeTimePipe,
  ],
  template: `
    <div class="notif-center">
      <header class="notif-center__header">
        <h1>Notificaciones</h1>
        @if (notificationsStore.hasUnread()) {
          <button mat-stroked-button (click)="markAllAsRead()">
            <mat-icon>done_all</mat-icon> Marcar todas como leídas
          </button>
        }
      </header>

      @if (notifications().length === 0) {
        <app-empty-state
          icon="notifications_none"
          title="Sin notificaciones"
          message="No tienes notificaciones por el momento." />
      } @else {
        @for (group of groupedNotifications(); track group.label) {
          <div class="notif-center__group">
            <h3 class="notif-center__group-label">{{ group.label }}</h3>
            <div class="notif-center__group-list">
              @for (notif of group.items; track notif.id) {
                <div class="notif-center__item"
                  [class.unread]="!notif.isRead"
                  (click)="onNotificationClick(notif)">
                  <div class="notif-center__indicator">
                    <span class="notif-center__dot" [class.read]="notif.isRead"></span>
                  </div>
                  <div class="notif-center__icon">
                    <mat-icon>{{ getNotificationIcon(notif.type) }}</mat-icon>
                  </div>
                  <div class="notif-center__content">
                    <span class="notif-center__title">{{ notif.title }}</span>
                    <span class="notif-center__message">{{ notif.message }}</span>
                  </div>
                  <span class="notif-center__time">{{ notif.createdAt | relativeTime }}</span>
                </div>
              }
            </div>
          </div>
        }

        @if (hasMore()) {
          <div class="notif-center__load-more">
            <button mat-button (click)="loadMore()" [disabled]="loadingMore()">
              @if (loadingMore()) {
                <mat-spinner diameter="18" />
              } @else {
                Cargar más
              }
            </button>
          </div>
        }
      }
    </div>
  `,
  styles: `
    :host { display: block; padding: 24px; max-width: 800px; margin: 0 auto; }

    .notif-center__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      h1 { font-size: 1.75rem; font-weight: 700; margin: 0; color: var(--mat-sys-on-surface); }
    }

    .notif-center__group {
      margin-bottom: 24px;
    }

    .notif-center__group-label {
      font-size: 0.8125rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--mat-sys-on-surface-variant);
      margin: 0 0 8px;
      padding: 0 0 8px;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
    }

    .notif-center__group-list {
      display: flex;
      flex-direction: column;
    }

    .notif-center__item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 12px;
      border-radius: 12px;
      cursor: pointer;
      transition: background 150ms;

      &:hover { background: var(--mat-sys-surface-container); }
      &.unread { background: var(--mat-sys-primary-container); }
      &.unread:hover { filter: brightness(0.97); }
    }

    .notif-center__indicator {
      flex-shrink: 0;
      padding-top: 6px;
    }

    .notif-center__dot {
      display: block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--mat-sys-primary);

      &.read {
        background: transparent;
        border: 1px solid var(--mat-sys-outline-variant);
      }
    }

    .notif-center__icon {
      flex-shrink: 0;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--mat-sys-surface-variant);
      color: var(--mat-sys-on-surface-variant);
    }

    .unread .notif-center__icon {
      background: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary);
    }

    .notif-center__content {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .notif-center__title {
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface);
    }

    .notif-center__message {
      font-size: 0.8125rem;
      color: var(--mat-sys-on-surface-variant);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .notif-center__time {
      flex-shrink: 0;
      font-size: 0.75rem;
      color: var(--mat-sys-on-surface-variant);
      padding-top: 2px;
    }

    .notif-center__load-more {
      text-align: center;
      padding: 16px 0;

      button { display: inline-flex; align-items: center; gap: 8px; }
    }

    @media (max-width: 600px) {
      :host { padding: 16px; }
      .notif-center__header { flex-direction: column; align-items: flex-start; gap: 12px; }
    }
  `,
})
export class NotificationCenterComponent implements OnInit {
  private readonly router = inject(Router);
  readonly notificationsStore = inject(NotificationsStore);
  private readonly notificationService = inject(NotificationService);

  readonly page = signal(1);
  readonly loadingMore = signal(false);
  readonly totalFromHttp = signal(0);

  readonly notifications = computed(() => this.notificationsStore.notifications());

  readonly hasMore = computed(() =>
    this.notifications().length < this.totalFromHttp(),
  );

  readonly groupedNotifications = computed<GroupedNotifications[]>(() => {
    const notifs = this.notifications();
    const groups = new Map<string, Notification[]>();

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);

    for (const n of notifs) {
      const date = new Date(n.createdAt);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      let label: string;

      if (dayStart.getTime() === today.getTime()) {
        label = 'Hoy';
      } else if (dayStart.getTime() === yesterday.getTime()) {
        label = 'Ayer';
      } else {
        label = dayStart.toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' });
      }

      if (!groups.has(label)) groups.set(label, []);
      groups.get(label)!.push(n);
    }

    return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
  });

  ngOnInit(): void {
    // Load initial batch from HTTP into the store
    this.notificationService.getAll({ page: 1, limit: 30 }).subscribe(res => {
      this.notificationsStore.setNotifications(res.data ?? [], res.meta?.total ?? 0);
      this.totalFromHttp.set(res.meta?.total ?? 0);
    });
  }

  async onNotificationClick(notif: Notification): Promise<void> {
    if (!notif.isRead) {
      // Optimistic update
      this.notificationsStore.markAsRead(notif.id);
      try {
        await firstValueFrom(this.notificationService.markAsRead(notif.id));
      } catch {
        this.notificationsStore.markAsUnread(notif.id);
      }
    }

    if (notif.actionUrl) {
      this.router.navigateByUrl(notif.actionUrl);
    }
  }

  async markAllAsRead(): Promise<void> {
    this.notificationsStore.markAllAsRead();
    try {
      await firstValueFrom(this.notificationService.markAllAsRead());
    } catch {
      // Could revert, but for UX just leave as read
    }
  }

  loadMore(): void {
    this.loadingMore.set(true);
    const nextPage = this.page() + 1;
    this.page.set(nextPage);

    this.notificationService.getAll({ page: nextPage, limit: 30 }).subscribe({
      next: res => {
        const current = this.notifications();
        const existingIds = new Set(current.map(n => n.id));
        const newItems = (res.data ?? []).filter(n => !existingIds.has(n.id));
        this.notificationsStore.setNotifications(
          [...current, ...newItems],
          res.meta?.total ?? this.totalFromHttp(),
        );
        this.totalFromHttp.set(res.meta?.total ?? this.totalFromHttp());
        this.loadingMore.set(false);
      },
      error: () => this.loadingMore.set(false),
    });
  }

  getNotificationIcon(type: NotificationType): string {
    const icons: Record<string, string> = {
      [NotificationType.APPLICATION_RECEIVED]: 'description',
      [NotificationType.APPLICATION_STATUS_CHANGED]: 'update',
      [NotificationType.PROJECT_RECOMMENDATION]: 'recommend',
      [NotificationType.EVALUATION_RECEIVED]: 'star',
      [NotificationType.CHAT_MESSAGE]: 'chat',
      [NotificationType.COMPANY_VERIFIED]: 'verified',
      [NotificationType.SUPERVISOR_ASSIGNED]: 'person_add',
      [NotificationType.SYSTEM]: 'info',
    };
    return icons[type] || 'notifications';
  }
}
