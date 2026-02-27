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
  template: `
    <div class="admin-analytics">
      <div class="admin-analytics__header">
        <h1>Panel de Administración</h1>
      </div>

      <!-- Stat Cards -->
      <div class="admin-analytics__stats">
        <app-stat-card
          icon="school"
          [value]="metrics.value()?.data?.totalStudents ?? '—'"
          label="Estudiantes activos"
          color="primary"
          [trend]="studentsTrend()"
          trendLabel="vs periodo anterior" />
        <app-stat-card
          icon="business"
          [value]="metrics.value()?.data?.verifiedCompanies ?? '—'"
          label="Empresas verificadas"
          color="accent"
          [trend]="companiesTrend()"
          trendLabel="vs periodo anterior" />
        <app-stat-card
          icon="folder_open"
          [value]="metrics.value()?.data?.activeProjects ?? '—'"
          label="Proyectos activos"
          color="primary" />
        <app-stat-card
          icon="mail"
          [value]="metrics.value()?.data?.totalApplications ?? '—'"
          label="Aplicaciones este periodo"
          color="accent" />
        <app-stat-card
          icon="check_circle"
          [value]="acceptanceRateDisplay()"
          label="Tasa de aceptación"
          color="primary" />
      </div>

      <!-- Charts Section -->
      <div class="admin-analytics__charts">
        <mat-card class="admin-analytics__chart-card">
          <mat-card-header>
            <mat-card-title>Actividad del Periodo</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @defer (on viewport) {
              <div class="chart-placeholder">
                <mat-icon>show_chart</mat-icon>
                <p>Gráfico de actividad por semana</p>
                <p class="chart-hint">Integrar Chart.js cuando el backend esté disponible</p>
              </div>
            } @placeholder {
              <div class="chart-placeholder loading">
                <mat-icon>hourglass_empty</mat-icon>
                <p>Cargando gráfico...</p>
              </div>
            }
          </mat-card-content>
        </mat-card>

        <mat-card class="admin-analytics__chart-card">
          <mat-card-header>
            <mat-card-title>Distribución por Tipo</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @defer (on viewport) {
              <div class="chart-placeholder">
                <mat-icon>pie_chart</mat-icon>
                <p>Distribución por tipo de proyecto</p>
                <p class="chart-hint">Integrar Chart.js cuando el backend esté disponible</p>
              </div>
            } @placeholder {
              <div class="chart-placeholder loading">
                <mat-icon>hourglass_empty</mat-icon>
                <p>Cargando gráfico...</p>
              </div>
            }
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Actions & Skills -->
      <div class="admin-analytics__bottom">
        <mat-card>
          <mat-card-header>
            <mat-card-title>
              <mat-icon>warning</mat-icon>
              Acciones Pendientes
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="action-list">
              <a routerLink="/admin/verifications" class="action-item">
                <mat-icon color="warn">verified</mat-icon>
                <span>Empresas por verificar</span>
                <mat-icon class="action-arrow">chevron_right</mat-icon>
              </a>
              <a routerLink="/admin/supervisors" class="action-item">
                <mat-icon color="primary">supervisor_account</mat-icon>
                <span>Supervisores por asignar</span>
                <mat-icon class="action-arrow">chevron_right</mat-icon>
              </a>
              <a routerLink="/admin/periods" class="action-item">
                <mat-icon color="accent">calendar_month</mat-icon>
                <span>Gestionar periodos académicos</span>
                <mat-icon class="action-arrow">chevron_right</mat-icon>
              </a>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <mat-card-title>
              <mat-icon>bar_chart</mat-icon>
              Top Skills Demandadas
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @defer (on viewport) {
              <div class="chart-placeholder">
                <mat-icon>stacked_bar_chart</mat-icon>
                <p>Habilidades más solicitadas</p>
                <p class="chart-hint">Integrar Chart.js cuando el backend esté disponible</p>
              </div>
            } @placeholder {
              <div class="chart-placeholder loading">
                <mat-icon>hourglass_empty</mat-icon>
                <p>Cargando...</p>
              </div>
            }
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: `
    .admin-analytics {
      max-width: 1200px;
      margin: 0 auto;

      &__header {
        margin-bottom: 24px;

        h1 {
          font-size: 1.75rem;
          font-weight: 500;
          color: var(--mat-sys-on-surface);
        }
      }

      &__stats {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 16px;
        margin-bottom: 24px;
      }

      &__charts {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        margin-bottom: 24px;

        @media (max-width: 959px) {
          grid-template-columns: 1fr;
        }
      }

      &__chart-card mat-card-content {
        min-height: 200px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      &__bottom {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;

        @media (max-width: 959px) {
          grid-template-columns: 1fr;
        }
      }
    }

    .chart-placeholder {
      text-align: center;
      padding: 32px;
      color: var(--mat-sys-on-surface-variant);

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        margin-bottom: 8px;
      }

      p {
        margin: 4px 0;
      }

      .chart-hint {
        font-size: 0.8125rem;
        opacity: 0.7;
      }
    }

    .action-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .action-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border-radius: 8px;
      text-decoration: none;
      color: var(--mat-sys-on-surface);
      transition: background-color 200ms;

      &:hover {
        background-color: color-mix(in srgb, var(--mat-sys-primary) 8%, transparent);
      }

      span {
        flex: 1;
        font-size: 0.9375rem;
      }

      .action-arrow {
        color: var(--mat-sys-on-surface-variant);
      }
    }

    mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `,
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
