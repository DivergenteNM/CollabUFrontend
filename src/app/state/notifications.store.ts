import {
  signalStore, withState, withMethods, withComputed, withHooks, patchState
} from '@ngrx/signals';
import { computed, inject, effect } from '@angular/core';
import { Notification } from '../core/models';
import { NotificationRealtimeService } from '../core/services/notification-realtime.service';

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
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
    },
  })
);
