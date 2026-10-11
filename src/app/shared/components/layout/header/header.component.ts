import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
  signal,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UiStore } from '../../../../state/ui.store';
import { AuthStore } from '../../../../state/auth.store';
import { NotificationsStore } from '../../../../state/notifications.store';
import { NotificationService } from '../../../../features/notifications/services/notification.service';
import { Notification } from '../../../../core/models';
import { NotificationType, UserRole } from '../../../../core/enums';
import {
  notificationConfig,
  toneColor,
  CATEGORY_LABELS,
  NotificationTone,
} from '../../../../core/notifications/notification-registry';
import { RelativeTimePipe } from '../../../pipes/relative-time.pipe';

@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    RelativeTimePipe,
  ],
  host: {
    'class': 'app-header',
  },
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit {
  readonly uiStore = inject(UiStore);
  readonly authStore = inject(AuthStore);
  private readonly notificationsStore = inject(NotificationsStore);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  @ViewChild('notifTrigger') notifTrigger?: MatMenuTrigger;

  readonly avatarUrl = computed(() => this.authStore.profile()?.avatarUrl || null);
  readonly displayName = this.authStore.displayName;
  readonly unreadCount = this.notificationsStore.unreadCount;
  readonly allNotifications = this.notificationsStore.notifications;
  readonly isLoading = signal(false);
  readonly activeFilter = signal<'all' | 'unread'>('all');

  readonly allCount = computed(() => this.allNotifications().length);

  readonly filteredNotifications = computed<Notification[]>(() => {
    const list = this.allNotifications();
    if (this.activeFilter() === 'unread') {
      return list.filter((n) => !n.isRead).slice(0, 8);
    }
    return list.slice(0, 8);
  });

  readonly welcomeMessage = computed(() => {
    const role = this.authStore.role();
    if (!role) return '';
    switch (role) {
      case UserRole.STUDENT:
        return '🎓 ¡Bienvenido Estudiante!';
      case UserRole.COMPANY:
        return '💼 ¡Bienvenida Empresa!';
      case UserRole.FACULTY:
        return '🏫 ¡Bienvenido Docente!';
      case UserRole.ADMIN:
        return '🛡️ ¡Bienvenido Admin!';
      default:
        return '';
    }
  });

  ngOnInit(): void {
    if (this.authStore.isAuthenticated()) {
      this.loadNotifications();
    }
  }

  loadNotifications(): void {
    if (!this.authStore.isAuthenticated()) return;
    this.isLoading.set(true);
    this.notificationService.getAll({ page: 1, limit: 12 }).subscribe({
      next: (res) => {
        const items = res.data ?? [];
        this.notificationService.getUnreadCount().subscribe({
          next: (cntRes) => {
            this.notificationsStore.setNotifications(items, cntRes.count);
            this.isLoading.set(false);
          },
          error: () => {
            const derivedUnread = items.filter((n) => !n.isRead).length;
            this.notificationsStore.setNotifications(items, derivedUnread);
            this.isLoading.set(false);
          },
        });
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  onMenuOpened(): void {
    if (this.allNotifications().length === 0) {
      this.loadNotifications();
    }
  }

  setFilter(filter: 'all' | 'unread', event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    this.activeFilter.set(filter);
  }

  async markAllAsRead(event?: MouseEvent): Promise<void> {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.notificationsStore.markAllAsRead();
    try {
      await firstValueFrom(this.notificationService.markAllAsRead());
    } catch {
      // optimistic state is preserved
    }
  }

  async markAsReadSingle(notifId: string, event: MouseEvent): Promise<void> {
    event.stopPropagation();
    event.preventDefault();
    this.notificationsStore.markAsRead(notifId);
    try {
      await firstValueFrom(this.notificationService.markAsRead(notifId));
    } catch {
      this.notificationsStore.markAsUnread(notifId);
    }
  }

  async onNotificationClick(notif: Notification): Promise<void> {
    this.notifTrigger?.closeMenu();

    if (!notif.isRead) {
      this.notificationsStore.markAsRead(notif.id);
      try {
        await firstValueFrom(this.notificationService.markAsRead(notif.id));
      } catch {
        this.notificationsStore.markAsUnread(notif.id);
      }
    }

    const url = notificationConfig(notif.type).buildActionUrl(notif.metadata) ?? notif.actionUrl;
    if (url) {
      this.router.navigateByUrl(url);
    }
  }

  getNotificationIcon(type: NotificationType): string {
    return notificationConfig(type).icon;
  }

  getNotificationTone(type: NotificationType): NotificationTone {
    return notificationConfig(type).tone;
  }

  getNotificationToneStyle(type: NotificationType): { bg: string; color: string } {
    return toneColor(notificationConfig(type).tone);
  }

  getCategoryLabel(type: NotificationType): string {
    const cat = notificationConfig(type).category;
    return CATEGORY_LABELS[cat] ?? 'General';
  }

  closeMenu(): void {
    this.notifTrigger?.closeMenu();
  }

  logout(): void {
    this.authStore.clearAuth();
  }
}
