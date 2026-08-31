import {
  signalStore, withState, withMethods, withComputed, withHooks, patchState
} from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { Notification } from '../core/models';
import { NotificationRealtimeService } from '../core/services/notification-realtime.service';
import {
  notificationConfig, NotificationCategory,
} from '../core/notifications/notification-registry';

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
}

/**
 * Deriva conteos por categoría desde las notificaciones cargadas. El total
 * "oficial" del backend se mantiene en `unreadCount`; los conteos por
 * categoría son estimaciones basadas en las notificaciones ya en el store,
 * suficiente para pintar badges de sidebar sin llamadas extra.
 */
function categorizeUnread(
  notifications: Notification[],
): Record<NotificationCategory, number> {
  const counts: Record<NotificationCategory, number> = {
    applications: 0, academic: 0, chat: 0,
    evaluations: 0, system: 0, projects: 0,
  };
  for (const n of notifications) {
    if (n.isRead) continue;
    const cat = notificationConfig(n.type).category;
    counts[cat]++;
  }
  return counts;
}

export const NotificationsStore = signalStore(
  { providedIn: 'root' },
  withState<NotificationsState>({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
  }),

  withComputed((store) => ({
    hasUnread: computed(() => store.unreadCount() > 0),
    recentNotifications: computed(() => store.notifications().slice(0, 5)),
    unreadByCategory: computed(() => categorizeUnread(store.notifications())),
  })),

  withMethods((store) => ({
    addNotification(notification: Notification): void {
      patchState(store, {
        notifications: [notification, ...store.notifications()],
        unreadCount: store.unreadCount() + 1,
      });
    },

    setNotifications(notifications: Notification[], unreadCount: number): void {
      patchState(store, { notifications, unreadCount, isLoading: false });
    },

    markAsRead(id: string): void {
      const updated = store.notifications().map(n =>
        n.id === id ? { ...n, isRead: true } : n
      );
      patchState(store, {
        notifications: updated,
        unreadCount: Math.max(0, store.unreadCount() - 1),
      });
    },

    markAsUnread(id: string): void {
      const updated = store.notifications().map(n =>
        n.id === id ? { ...n, isRead: false } : n
      );
      patchState(store, {
        notifications: updated,
        unreadCount: store.unreadCount() + 1,
      });
    },

    markAllAsRead(): void {
      const updated = store.notifications().map(n => ({ ...n, isRead: true }));
      patchState(store, { notifications: updated, unreadCount: 0 });
    },
  })),

  withHooks({
    onInit(store) {
      const realtimeService = inject(NotificationRealtimeService);
      realtimeService.connect();

      realtimeService.onNotification().subscribe(notification => {
        store.addNotification(notification);
      });

      realtimeService.onUnreadCount().subscribe(count => {
        patchState(store, { unreadCount: count });
      });
    },
  })
);
