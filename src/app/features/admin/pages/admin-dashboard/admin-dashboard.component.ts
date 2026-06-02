import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { httpResource } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { ApiResponse, DashboardMetrics } from '../../../../core/models';
import { StatCardComponent } from '../../../../shared/components/ui/stat-card/stat-card.component';

@Component({
  selector: 'app-admin-analytics',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIconModule, MatButtonModule, MatCardModule,
    RouterLink, StatCardComponent,
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminAnalyticsComponent {
  readonly metrics = httpResource<ApiResponse<DashboardMetrics>>(
    () => ({ url: `${environment.apiUrl}/admin/analytics` })
  );

  studentsTrend(): number | undefined {
    const data = this.metrics.value()?.data;
    if (!data?.periodComparison) return undefined;
    const prev = data.periodComparison.previous.students;
    if (!prev) return undefined;
    return Math.round(((data.totalStudents - prev) / prev) * 100);
  }

  companiesTrend(): number | undefined {
    const data = this.metrics.value()?.data;
    if (!data?.periodComparison) return undefined;
    const prev = data.periodComparison.previous.projects;
    if (!prev) return undefined;
    return Math.round(((data.verifiedCompanies - prev) / prev) * 100);
  }

  acceptanceRateDisplay(): string {
    const rate = this.metrics.value()?.data?.acceptanceRate;
    return rate != null ? `${rate}%` : '—';
  }
}
