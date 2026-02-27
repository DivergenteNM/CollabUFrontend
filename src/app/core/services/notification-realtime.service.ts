import { Injectable, inject } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { Socket } from 'socket.io-client';
import { WebSocketService } from './websocket.service';
import { TokenService } from './token.service';
import { Notification } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NotificationRealtimeService {
  private socket: Socket | null = null;
  private notifications$ = new Subject<Notification>();

  private readonly wsService = inject(WebSocketService);
  private readonly tokenService = inject(TokenService);

  connect(): void {
    const token = this.tokenService.getAccessToken();
    if (!token) return;

    this.socket = this.wsService.connect(environment.wsNotificationsPath, token);

    this.socket.on('notification', (notification: Notification) => {
      this.notifications$.next(notification);
    });
  }

  onNotification(): Observable<Notification> {
    return this.notifications$.asObservable();
  }

  disconnect(): void {
    this.wsService.disconnect(environment.wsNotificationsPath);
    this.socket = null;
  }
}
