import { Component, ChangeDetectionStrategy, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { AnalyticsDashboard } from '../../../../core/models';
import { StatCardComponent } from '../../../../shared/components/ui/stat-card/stat-card.component';

@Component({
  selector: 'app-admin-analytics',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIconModule, MatButtonModule, MatCardModule, MatProgressBarModule,
    DatePipe, RouterLink, StatCardComponent,
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminAnalyticsComponent {
  private readonly platformId = inject(PLATFORM_ID);

  readonly dashboard = httpResource<AnalyticsDashboard>(() => {
    if (!isPlatformBrowser(this.platformId)) return undefined;
    return { url: `${environment.apiUrl}/analytics/dashboard` };
  });

  trendIcon(direction: string | null): string {
    if (direction === 'rising') return 'trending_up';
    if (direction === 'declining') return 'trending_down';
    return 'trending_flat';
  }

  reportTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      period_summary: 'Resumen de Período',
      company_performance: 'Desempeño Empresa',
      student_outcomes: 'Resultados Estudiante',
      skill_gap_analysis: 'Brecha de Skills',
      matching_effectiveness: 'Efectividad Matching',
      custom: 'Personalizado',
    };
    return labels[type] ?? type;
  }

  reportStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      generating: 'Generando...',
      completed: 'Completado',
      failed: 'Fallido',
    };
    return labels[status] ?? status;
  }
}
