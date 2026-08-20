import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../core/services/base-api.service';
import {
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  Notification,
  NotificationPreferences,
} from '../../../core/models';

@Injectable({ providedIn: 'root' })
export class NotificationService extends BaseApiService {
  protected readonly basePath = '/notifications';

  getAll(params: PaginationParams): Observable<PaginatedResponse<Notification>> {
    return this.http.get<PaginatedResponse<Notification>>(this.apiUrl, {
      params: this.buildParams(params)
    });
  }

  getUnreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/unread-count`);
  }

  markAsRead(id: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/read`, {});
  }

  /**
   * El backend expone `PATCH /read` con `notificationIds` opcional; cuando el
   * arreglo se omite, marca todas las no leídas del usuario. Se envía cuerpo
   * vacío para preservar semántica y evitar 400 por content-type ausente.
   */
  markAllAsRead(): Observable<{ updated: number }> {
    return this.http.patch<{ updated: number }>(`${this.apiUrl}/read`, {});
  }

  markManyAsRead(notificationIds: string[]): Observable<{ updated: number }> {
    return this.http.patch<{ updated: number }>(`${this.apiUrl}/read`, { notificationIds });
  }

  deleteNotification(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getPreferences(): Observable<NotificationPreferences> {
    return this.http.get<NotificationPreferences>(`${this.apiUrl}/preferences`);
  }

  updatePreferences(prefs: Partial<NotificationPreferences>): Observable<NotificationPreferences> {
    return this.http.patch<NotificationPreferences>(`${this.apiUrl}/preferences`, prefs);
  }
}
