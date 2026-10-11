import { Component, ChangeDetectionStrategy, inject, PLATFORM_ID, computed } from '@angular/core';
import { isPlatformBrowser, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRippleModule } from '@angular/material/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ChartData } from 'chart.js';
import { SkillTrend } from '../../../../core/models';
import { AnalyticsService } from '../../../analytics/services/analytics.service';
import { StatCardComponent } from '../../../../shared/components/ui/stat-card/stat-card.component';
import { LineChartComponent } from '../../../../shared/components/charts/line-chart/line-chart.component';
import { SkillGapChartComponent } from '../../../../shared/components/charts/skill-gap-chart/skill-gap-chart.component';
import { AuthStore } from '../../../../state/auth.store';
import { RelativeTimePipe, ImageUrlPipe } from '../../../../shared/pipes';

@Component({
  selector: 'app-admin-analytics',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatRippleModule,
    DatePipe,
    RouterLink,
    StatCardComponent,
    LineChartComponent,
    SkillGapChartComponent,
    RelativeTimePipe,
    ImageUrlPipe,
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminAnalyticsComponent {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly analyticsService = inject(AnalyticsService);
  readonly authStore = inject(AuthStore);

  private readonly browserReady = computed(() => (isPlatformBrowser(this.platformId) ? {} : undefined));

  readonly dashboard = rxResource({
    params: () => this.browserReady(),
    stream: () => this.analyticsService.getDashboard(),
  });

  readonly platformHistory = rxResource({
    params: () => this.browserReady(),
    stream: () => this.analyticsService.getPlatformMetrics(),
  });

  readonly academicKpis = rxResource({
    params: () => this.browserReady(),
    stream: () => this.analyticsService.getAcademicKpis(),
  });

  readonly avatarUrl = computed(() => {
    return this.authStore.profile()?.avatarUrl || null;
  });

  readonly userInitials = computed(() => {
    const p = this.authStore.profile();
    if (p?.firstName && p?.lastName) {
      return `${p.firstName[0]}${p.lastName[0]}`.toUpperCase();
    }
    if (p?.firstName) {
      return p.firstName.slice(0, 2).toUpperCase();
    }
    return 'AD';
  });

  readonly greetingTime = computed(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return '¡Buenos días';
    if (hour >= 12 && hour < 19) return '¡Buenas tardes';
    return '¡Buenas noches';
  });

  readonly currentDateFormatted = computed(() => {
    try {
      const formatted = new Intl.DateTimeFormat('es-CO', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(new Date());
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    } catch {
      return 'Fecha del sistema';
    }
  });

  readonly completionRate = computed(() => {
    const stats = this.academicKpis.value()?.academicStats;
    if (!stats || stats.totalRecords === 0) return null;
    return Math.round((stats.completedCount / stats.totalRecords) * 10000) / 100;
  });

  readonly topWorkload = computed(() => {
    const workload = this.academicKpis.value()?.assignmentStats?.supervisorWorkload ?? [];
    return [...workload].sort((a, b) => b.activeCount - a.activeCount).slice(0, 5);
  });

  readonly platformChartData = computed<ChartData<'line'>>(() => {
    const history = (this.platformHistory.value() ?? []).slice(0, 30).reverse();
    return {
      labels: history.map((h) => new Date(h.snapshotDate).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })),
      datasets: [
        {
          label: 'Usuarios Registrados',
          data: history.map((h) => h.totalUsers),
          borderColor: '#388E53',
          backgroundColor: 'rgba(56, 142, 83, 0.12)',
          tension: 0.35,
          fill: true,
          pointRadius: 3,
          pointHoverRadius: 6,
        },
        {
          label: 'Proyectos Publicados',
          data: history.map((h) => h.totalProjects),
          borderColor: '#276A93',
          backgroundColor: 'rgba(39, 106, 147, 0.12)',
          tension: 0.35,
          fill: true,
          pointRadius: 3,
          pointHoverRadius: 6,
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

  trendLabel(direction: string | null): string {
    if (direction === 'rising') return 'En alza';
    if (direction === 'declining') return 'A la baja';
    return 'Estable';
  }

  reportTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      period_summary: 'Resumen de Período',
      company_performance: 'Desempeño Empresa',
      student_outcomes: 'Resultados Estudiante',
      supervisor_report: 'Carga de Docente',
      skill_gap_analysis: 'Brecha de Skills',
      matching_effectiveness: 'Efectividad Matching',
      academic_process_summary: 'Resumen de Proceso Académico',
      supervisor_workload: 'Carga de Docentes (Plataforma)',
      project_completion_rates: 'Tasas de Completitud',
      custom: 'Reporte Personalizado',
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

  workloadWidth(activeCount: number): string {
    const maxReference = 15;
    const pct = Math.min(Math.round((activeCount / maxReference) * 100), 100);
    return `${Math.max(pct, 10)}%`;
  }
}
