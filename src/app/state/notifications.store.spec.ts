import { TestBed } from '@angular/core/testing';
import { NotificationsStore } from './notifications.store';
import { Notification } from '../core/models';
import { NotificationRealtimeService } from '../core/services/notification-realtime.service';
import { NEVER } from 'rxjs';

const mockNotification: Notification = {
  id: 'n1',
  userId: 'u1',
  type: 'application_received' as any,
  title: 'Nueva aplicación',
  message: 'Juan Pérez aplicó a tu proyecto',
  isRead: false,
  createdAt: new Date().toISOString(),
};

describe('NotificationsStore', () => {
  let store: InstanceType<typeof NotificationsStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: NotificationRealtimeService,
          useValue: { connect: () => {}, onNotification: () => NEVER, onUnreadCount: () => NEVER },
        },
      ],
    });
    store = TestBed.inject(NotificationsStore);
  });

  it('should start with empty notifications', () => {
    expect(store.notifications()).toEqual([]);
    expect(store.unreadCount()).toBe(0);
    expect(store.hasUnread()).toBe(false);
  });

  it('should add notification and increment unread', () => {
    store.addNotification(mockNotification);

    expect(store.notifications().length).toBe(1);
    expect(store.unreadCount()).toBe(1);
    expect(store.hasUnread()).toBe(true);
  });

  it('should prepend new notifications', () => {
    const n2: Notification = { ...mockNotification, id: 'n2', title: 'Segunda' };
    store.addNotification(mockNotification);
    store.addNotification(n2);

    expect(store.notifications()[0].id).toBe('n2');
    expect(store.notifications()[1].id).toBe('n1');
  });

  it('should mark as read and decrement unread', () => {
    store.addNotification(mockNotification);
    expect(store.unreadCount()).toBe(1);

    store.markAsRead('n1');

    expect(store.unreadCount()).toBe(0);
    expect(store.notifications()[0].isRead).toBe(true);
  });

  it('should mark all as read', () => {
    const n2: Notification = { ...mockNotification, id: 'n2' };
    store.addNotification(mockNotification);
    store.addNotification(n2);
    expect(store.unreadCount()).toBe(2);

    store.markAllAsRead();

    expect(store.unreadCount()).toBe(0);
    expect(store.notifications().every(n => n.isRead)).toBe(true);
  });

  it('should compute recentNotifications (max 5)', () => {
    for (let i = 0; i < 8; i++) {
      store.addNotification({ ...mockNotification, id: `n${i}` });
    }

    expect(store.recentNotifications().length).toBe(5);
  });

  it('should set notifications in bulk', () => {
    const list = [mockNotification, { ...mockNotification, id: 'n2' }];
    store.setNotifications(list, 1);

    expect(store.notifications().length).toBe(2);
    expect(store.unreadCount()).toBe(1);
  });

  it('should not go below 0 unread count', () => {
    store.markAsRead('nonexistent');
    expect(store.unreadCount()).toBe(0);
  });
});
