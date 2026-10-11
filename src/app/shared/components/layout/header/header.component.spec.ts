import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { of, NEVER } from 'rxjs';
import { HeaderComponent } from './header.component';
import { NotificationsStore } from '../../../../state/notifications.store';
import { AuthStore } from '../../../../state/auth.store';
import { NotificationService } from '../../../../features/notifications/services/notification.service';
import { NotificationRealtimeService } from '../../../../core/services/notification-realtime.service';
import { Notification } from '../../../../core/models';
import { NotificationType, UserRole } from '../../../../core/enums';

const mockNotification: Notification = {
  id: 'n1',
  userId: 'u1',
  type: NotificationType.APPLICATION_RECEIVED,
  title: 'Nueva postulación',
  message: 'Juan Pérez se postuló al proyecto',
  isRead: false,
  createdAt: new Date().toISOString(),
  metadata: { applicationId: 'app-123' },
};

describe('HeaderComponent - Notification Dropdown', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let notifStore: InstanceType<typeof NotificationsStore>;
  let notifServiceMock: any;

  beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  beforeEach(async () => {
    notifServiceMock = {
      getAll: vi.fn().mockReturnValue(of({ data: [mockNotification], meta: { total: 1 } })),
      getUnreadCount: vi.fn().mockReturnValue(of({ count: 1 })),
      markAsRead: vi.fn().mockReturnValue(of(undefined)),
      markAllAsRead: vi.fn().mockReturnValue(of({ updated: 1 })),
    };

    const authStoreMock = {
      profile: signal(null),
      displayName: signal('Nicolas Test'),
      role: signal(UserRole.STUDENT),
      isAuthenticated: signal(true),
      user: signal({ email: 'nicolas@collabu.edu' }),
      clearAuth: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        {
          provide: NotificationRealtimeService,
          useValue: { connect: () => {}, onNotification: () => NEVER, onUnreadCount: () => NEVER },
        },
        { provide: NotificationService, useValue: notifServiceMock },
        { provide: AuthStore, useValue: authStoreMock },
      ],
    }).compileComponents();

    notifStore = TestBed.inject(NotificationsStore);
    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load initial notifications if authenticated', () => {
    expect(component).toBeTruthy();
    expect(notifServiceMock.getAll).toHaveBeenCalled();
  });

  it('should toggle filter between all and unread', () => {
    const mockEvent = new MouseEvent('click');
    const stopPropagationSpy = vi.spyOn(mockEvent, 'stopPropagation');
    const preventDefaultSpy = vi.spyOn(mockEvent, 'preventDefault');

    expect(component.activeFilter()).toBe('all');
    component.setFilter('unread', mockEvent);
    expect(component.activeFilter()).toBe('unread');
    expect(stopPropagationSpy).toHaveBeenCalled();
    expect(preventDefaultSpy).toHaveBeenCalled();

    component.setFilter('all', mockEvent);
    expect(component.activeFilter()).toBe('all');
  });

  it('should filter notifications correctly when unread filter is active', () => {
    const readNotification: Notification = {
      ...mockNotification,
      id: 'n2',
      isRead: true,
      title: 'Notificación leída',
    };

    notifStore.setNotifications([mockNotification, readNotification], 1);

    expect(component.filteredNotifications().length).toBe(2);

    const mockEvent = new MouseEvent('click');
    component.setFilter('unread', mockEvent);

    expect(component.filteredNotifications().length).toBe(1);
    expect(component.filteredNotifications()[0].id).toBe('n1');
  });

  it('should call markAllAsRead and update store', async () => {
    const mockEvent = new MouseEvent('click');
    const stopSpy = vi.spyOn(mockEvent, 'stopPropagation');

    notifStore.setNotifications([mockNotification], 1);
    expect(notifStore.unreadCount()).toBe(1);

    await component.markAllAsRead(mockEvent);

    expect(notifStore.unreadCount()).toBe(0);
    expect(notifServiceMock.markAllAsRead).toHaveBeenCalled();
    expect(stopSpy).toHaveBeenCalled();
  });

  it('should mark single notification as read on quick action click', async () => {
    const mockEvent = new MouseEvent('click');
    const stopSpy = vi.spyOn(mockEvent, 'stopPropagation');

    notifStore.setNotifications([mockNotification], 1);

    await component.markAsReadSingle('n1', mockEvent);

    expect(notifStore.unreadCount()).toBe(0);
    expect(notifServiceMock.markAsRead).toHaveBeenCalledWith('n1');
    expect(stopSpy).toHaveBeenCalled();
  });

  it('should return correct tone and icon for notification type', () => {
    const icon = component.getNotificationIcon(NotificationType.APPLICATION_RECEIVED);
    expect(icon).toBe('assignment_ind');

    const tone = component.getNotificationTone(NotificationType.APPLICATION_RECEIVED);
    expect(tone).toBe('info');

    const label = component.getCategoryLabel(NotificationType.APPLICATION_RECEIVED);
    expect(label).toBe('Postulaciones');
  });
});
