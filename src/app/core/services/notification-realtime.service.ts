import { Injectable, inject } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { Socket } from 'socket.io-client';
import { WebSocketService } from './websocket.service';
import { TokenService } from './token.service';
import { Notification } from '../models';
import { environment } from '../../../environments/environment';
import { AuthStore } from '../../state/auth.store';

@Injectable({ providedIn: 'root' })
export class NotificationRealtimeService {
  private socket: Socket | null = null;
  private notifications$ = new Subject<Notification>();
  private unreadCount$ = new Subject<number>();

  private readonly wsService = inject(WebSocketService);
  private readonly tokenService = inject(TokenService);
  private readonly authStore = inject(AuthStore);

  connect(): void {
    const token = this.tokenService.getAccessToken();
    if (!token) return;

    this.socket = this.wsService.connect(environment.wsNotificationsPath, token);

    // Escuchar notificaciones en tiempo real
    this.socket.on('notification', (notification: Notification) => {
      this.notifications$.next(notification);
    });

    // Escuchar conteo de no leídas en tiempo real
    this.socket.on('unread_count', (data: { count: number }) => {
      this.unreadCount$.next(data.count);
    });

    // Suscripción automática tras conectar
    const userId = this.authStore.user()?.id;
    if (userId) {
      this.socket.emit('subscribe', { userId });
    }
  }

  onNotification(): Observable<Notification> {
    return this.notifications$.asObservable();
  }

  onUnreadCount(): Observable<number> {
    return this.unreadCount$.asObservable();
  }

  disconnect(): void {
    this.wsService.disconnect(environment.wsNotificationsPath);
    this.socket = null;
  }
}
