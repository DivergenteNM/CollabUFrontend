import {
  Component, ChangeDetectionStrategy, inject, computed, signal, OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

import { Notification } from '../../../../core/models';
import { NotificationType } from '../../../../core/enums';
import {
  notificationConfig, toneColor,
  NotificationCategory,
} from '../../../../core/notifications/notification-registry';
import { NotificationsStore } from '../../../../state/notifications.store';
import { NotificationService } from '../../services/notification.service';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state.component';
import { RelativeTimePipe } from '../../../../shared/pipes/relative-time.pipe';

interface GroupedNotifications {
  label: string;
  key: string;
  items: Notification[];
}

type GroupMode = 'day' | 'project';

@Component({
  selector: 'app-notification-center',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule, MatIconModule, MatDividerModule, MatProgressSpinnerModule,
    MatButtonToggleModule,
    EmptyStateComponent, RelativeTimePipe,
  ],
  templateUrl: './notification-center.component.html',
  styleUrl: './notification-center.component.scss',
})
export class NotificationCenterComponent implements OnInit {
  private readonly router = inject(Router);
  readonly notificationsStore = inject(NotificationsStore);
  private readonly notificationService = inject(NotificationService);

  readonly page = signal(1);
  readonly loadingMore = signal(false);
  readonly totalFromHttp = signal(0);
  readonly groupMode = signal<GroupMode>('day');

  readonly notifications = computed(() => this.notificationsStore.notifications());

  readonly hasMore = computed(() =>
    this.notifications().length < this.totalFromHttp(),
  );

  readonly groupedNotifications = computed<GroupedNotifications[]>(() =>
    this.groupMode() === 'day' ? this.groupByDay() : this.groupByProject(),
  );

  private groupByDay(): GroupedNotifications[] {
    const notifs = this.notifications();
    const groups = new Map<string, Notification[]>();

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);

    for (const n of notifs) {
      const date = new Date(n.createdAt);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      let label: string;

      if (dayStart.getTime() === today.getTime()) label = 'Hoy';
      else if (dayStart.getTime() === yesterday.getTime()) label = 'Ayer';
      else label = dayStart.toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' });

      if (!groups.has(label)) groups.set(label, []);
      groups.get(label)!.push(n);
    }

    return Array.from(groups.entries()).map(([label, items]) => ({ label, key: label, items }));
  }

  /**
   * Agrupa por proyecto usando `metadata.projectTitle` (fallback: projectId).
   * Las que no referencian proyecto caen a un grupo "General".
   */
  private groupByProject(): GroupedNotifications[] {
    const notifs = this.notifications();
    const groups = new Map<string, { label: string; items: Notification[] }>();

    for (const n of notifs) {
      const projectId = n.metadata?.['projectId'] ?? n.metadata?.['project_id'] ?? null;
      const projectTitle = n.metadata?.['projectTitle'] ?? n.metadata?.['project_title'] ?? null;
      const key = projectId ?? '__general__';
      const label = projectTitle ?? (projectId ? `Proyecto ${String(projectId).slice(0, 8)}` : 'General');

      if (!groups.has(key)) groups.set(key, { label, items: [] });
      groups.get(key)!.items.push(n);
    }

    return Array.from(groups.entries()).map(([key, { label, items }]) => ({ key, label, items }));
  }

  ngOnInit(): void {
    this.notificationService.getAll({ page: 1, limit: 30 }).subscribe(res => {
      this.notificationsStore.setNotifications(res.data ?? [], res.meta?.total ?? 0);
      this.totalFromHttp.set(res.meta?.total ?? 0);
    });
  }

  async onNotificationClick(notif: Notification): Promise<void> {
    if (!notif.isRead) {
      this.notificationsStore.markAsRead(notif.id);
      try {
        await firstValueFrom(this.notificationService.markAsRead(notif.id));
      } catch {
        this.notificationsStore.markAsUnread(notif.id);
      }
    }

    // El registry tiene prioridad sobre actionUrl del backend cuando pueda
    // construir un deep link con anclas y tabs; si no, cae al actionUrl.
    const url = notificationConfig(notif.type).buildActionUrl(notif.metadata) ?? notif.actionUrl;
    if (url) this.router.navigateByUrl(url);
  }

  async markAllAsRead(): Promise<void> {
    this.notificationsStore.markAllAsRead();
    try {
      await firstValueFrom(this.notificationService.markAllAsRead());
    } catch {
      // No revertir: UX mejor si queda leído localmente aunque falle el server
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
    return notificationConfig(type).icon;
  }

  getNotificationColor(type: NotificationType): { bg: string; color: string } {
    return toneColor(notificationConfig(type).tone);
  }

  getNotificationCategory(type: NotificationType): NotificationCategory {
    return notificationConfig(type).category;
  }
}
