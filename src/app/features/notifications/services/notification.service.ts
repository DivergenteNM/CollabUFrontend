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

  getUnreadCount(): Observable<ApiResponse<{ count: number }>> {
    return this.http.get<ApiResponse<{ count: number }>>(`${this.apiUrl}/unread-count`);
  }

  markAsRead(id: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/read`, {});
  }

  markAllAsRead(): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/read-all`, {});
  }

  getPreferences(): Observable<ApiResponse<NotificationPreferences>> {
    return this.http.get<ApiResponse<NotificationPreferences>>(`${this.apiUrl}/preferences`);
  }

  updatePreferences(prefs: Partial<NotificationPreferences>): Observable<ApiResponse<NotificationPreferences>> {
    return this.http.put<ApiResponse<NotificationPreferences>>(`${this.apiUrl}/preferences`, prefs);
  }
}
