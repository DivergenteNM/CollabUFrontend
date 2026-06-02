import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../core/services/base-api.service';
import {
  ApiResponse,
  DashboardMetrics,
  TimelineEvent,
} from '../../../core/models';

@Injectable({ providedIn: 'root' })
export class AnalyticsService extends BaseApiService {
  protected readonly basePath = '/analytics';

  getDashboardMetrics(): Observable<ApiResponse<DashboardMetrics>> {
    return this.http.get<ApiResponse<DashboardMetrics>>(`${this.apiUrl}/dashboard`);
  }

  getTimeline(params: { startDate: string; endDate: string; type: string }): Observable<ApiResponse<TimelineEvent[]>> {
    return this.http.get<ApiResponse<TimelineEvent[]>>(`${this.apiUrl}/timeline`, {
      params: this.buildParams(params)
    });
  }

  exportReport(format: 'json' | 'csv', params: Record<string, any>): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/reports/export`, {
      params: this.buildParams({ ...params, format }),
      responseType: 'blob'
    });
  }
}
