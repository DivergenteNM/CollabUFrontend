import { Component, ChangeDetectionStrategy, inject, PLATFORM_ID, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { ChartData } from 'chart.js';
import { environment } from '../../../../../environments/environment';
import { AnalyticsDashboard, PlatformMetrics, SkillTrend } from '../../../../core/models';
import { StatCardComponent } from '../../../../shared/components/ui/stat-card/stat-card.component';
import { LineChartComponent } from '../../../../shared/components/charts/line-chart/line-chart.component';
import { SkillGapChartComponent } from '../../../../shared/components/charts/skill-gap-chart/skill-gap-chart.component';

@Component({
  selector: 'app-admin-analytics',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIconModule, MatButtonModule, MatCardModule, MatProgressBarModule,
    DatePipe, RouterLink, StatCardComponent, LineChartComponent, SkillGapChartComponent,
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

  readonly platformHistory = httpResource<PlatformMetrics[]>(() => {
    if (!isPlatformBrowser(this.platformId)) return undefined;
    return { url: `${environment.apiUrl}/analytics/platform` };
  });

  readonly platformChartData = computed<ChartData<'line'>>(() => {
    const history = (this.platformHistory.value() ?? []).slice(0, 30).reverse();
    return {
      labels: history.map((h) => new Date(h.snapshotDate).toLocaleDateString('es')),
      datasets: [
        {
          label: 'Usuarios',
          data: history.map((h) => h.totalUsers),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.35,
          fill: true,
          pointRadius: 3,
        },
        {
          label: 'Proyectos',
          data: history.map((h) => h.totalProjects),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.35,
          fill: true,
          pointRadius: 3,
        },
      ],
    };
  });

  readonly topSkillsForChart = computed<SkillTrend[]>(() => {
    const dash = this.dashboard.value();
    if (!dash) return [];
    return dash.topSkills.map((s) => ({
      id: s.name,
      skillName: s.name,
      demandCount: s.demand,
      supplyCount: s.supply,
      gapIndex: s.gap,
      avgProficiencyLevel: null,
      trendDirection: s.trend,
      snapshotDate: '',
      createdAt: '',
    }));
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
