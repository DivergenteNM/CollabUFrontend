import {
  Component, ChangeDetectionStrategy, inject, computed,
} from '@angular/core';
import { Router } from '@angular/router';
import { httpResource } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { environment } from '../../../../../environments/environment';
import { ApiResponse, PaginatedResponse, StudentProfile, Recommendation, Application } from '../../../../core/models';
import { NotificationsStore } from '../../../../state/notifications.store';
import { StatCardComponent } from '../../../../shared/components/ui/stat-card/stat-card.component';
import { ProjectCardComponent } from '../../../../shared/components/cards/project-card/project-card.component';
import { StatusBadgeComponent } from '../../../../shared/components/ui/status-badge/status-badge.component';
import { MatchScoreBarComponent } from '../../../../shared/components/ui/match-score-bar/match-score-bar.component';
import { SkeletonComponent } from '../../../../shared/components/ui/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state.component';
import { RelativeTimePipe } from '../../../../shared/pipes';

@Component({
  selector: 'app-student-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule, MatIconModule, MatButtonModule,
    StatCardComponent, ProjectCardComponent, StatusBadgeComponent,
    MatchScoreBarComponent, SkeletonComponent, EmptyStateComponent,
    RelativeTimePipe,
  ],
  template: `
    <!-- Stat Cards -->
    <section class="dashboard__stats">
      @if (profileResource.isLoading()) {
        @for (_ of [1,2,3,4]; track $index) {
          <app-skeleton width="100%" height="120px" />
        }
      } @else {
        <app-stat-card
          icon="person"
          [value]="profileCompleteness() + '%'"
          label="Perfil Completo"
          color="primary"
          [clickable]="true"
          (clicked)="router.navigate(['/profile'])" />
        <app-stat-card
          icon="description"
          [value]="activeApplicationsCount()"
          label="Aplicaciones Activas"
          color="accent"
          [clickable]="true"
          (clicked)="router.navigate(['/my-applications'])" />
        <app-stat-card
          icon="recommend"
          [value]="recommendationsCount()"
          label="Recomendaciones"
          color="primary" />
        <app-stat-card
          icon="schedule"
          [value]="practiceHoursLabel()"
          label="Horas de Práctica"
          color="warn" />
      }
    </section>

    <!-- Two-column: Recommendations + Notifications -->
    <section class="dashboard__grid">
      <!-- Recommended Projects -->
      <mat-card class="dashboard__section">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>auto_awesome</mat-icon> Proyectos Recomendados
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          @if (recommendationsResource.isLoading()) {
            @for (_ of [1,2,3]; track $index) {
              <app-skeleton width="100%" height="180px" />
            }
          } @else if (recommendations().length === 0) {
            <app-empty-state
              icon="search"
              title="Sin recomendaciones"
              message="Completa tu perfil para recibir proyectos recomendados."
              actionLabel="Completar Perfil"
              (actionClicked)="router.navigate(['/profile'])" />
          } @else {
            <div class="dashboard__recommendations">
              @for (rec of recommendations(); track rec.id) {
                <app-project-card
                  [project]="rec.project"
                  [matchScore]="rec.matchScore"
                  (viewDetail)="router.navigate(['/projects', $event])"
                  (apply)="router.navigate(['/projects', $event])" />
              }
            </div>
          }
        </mat-card-content>
      </mat-card>

      <!-- Recent Notifications -->
      @defer (on viewport) {
        <mat-card class="dashboard__section">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>notifications</mat-icon> Notificaciones Recientes
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @if (notificationsStore.recentNotifications().length === 0) {
              <app-empty-state
                icon="notifications_none"
                title="Sin notificaciones"
                message="No tienes notificaciones recientes." />
            } @else {
              <div class="dashboard__notifications-list">
                @for (n of notificationsStore.recentNotifications(); track n.id) {
                  <div class="notification-item" [class.unread]="!n.isRead">
                    <mat-icon class="notification-item__icon">
                      {{ n.isRead ? 'notifications_none' : 'notifications_active' }}
                    </mat-icon>
                    <div class="notification-item__content">
                      <span class="notification-item__title">{{ n.title }}</span>
                      <span class="notification-item__message">{{ n.message }}</span>
                      <span class="notification-item__time">{{ n.createdAt | relativeTime }}</span>
                    </div>
                  </div>
                }
              </div>
              <button mat-button class="dashboard__view-all"
                      (click)="router.navigate(['/notifications'])">
                Ver todas las notificaciones
              </button>
            }
          </mat-card-content>
        </mat-card>
      } @placeholder {
        <app-skeleton width="100%" height="300px" />
      }
    </section>

    <!-- Active Applications Table -->
    @defer (on viewport) {
      <section class="dashboard__applications">
        <mat-card>
          <mat-card-header>
            <mat-card-title>
              <mat-icon>assignment</mat-icon> Mis Aplicaciones Activas
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @if (applicationsResource.isLoading()) {
              @for (_ of [1,2,3]; track $index) {
                <app-skeleton width="100%" height="48px" />
              }
            } @else if (applications().length === 0) {
              <app-empty-state
                icon="assignment"
                title="Sin aplicaciones activas"
                message="Explora proyectos y envía tu primera aplicación."
                actionLabel="Ver Proyectos"
                (actionClicked)="router.navigate(['/projects'])" />
            } @else {
              <div class="dashboard__table">
                <div class="dashboard__table-header">
                  <span>Proyecto</span>
                  <span>Empresa</span>
                  <span>Estado</span>
                  <span>Match</span>
                </div>
                @for (app of applications(); track app.id) {
                  <div class="dashboard__table-row"
                       (click)="router.navigate(['/my-applications', app.id])"
                       (keydown.enter)="router.navigate(['/my-applications', app.id])"
                       tabindex="0"
                       role="button">
                    <span class="truncate">{{ app.project?.title || 'Proyecto' }}</span>
                    <span class="truncate">{{ app.project?.companyName || '—' }}</span>
                    <span><app-status-badge [status]="app.status" size="sm" /></span>
                    <span>
                      @if (app.matchScore) {
                        <app-match-score-bar [score]="app.matchScore" size="sm" />
                      } @else {
                        —
                      }
                    </span>
                  </div>
                }
              </div>
              <button mat-button class="dashboard__view-all"
                      (click)="router.navigate(['/my-applications'])">
                Ver todas las aplicaciones
              </button>
            }
          </mat-card-content>
        </mat-card>
      </section>
    } @placeholder {
      <app-skeleton width="100%" height="250px" />
    }
  `,
  styles: `
    :host {
      display: block;
      padding: 24px;
      max-width: 1280px;
      margin: 0 auto;
    }

    .dashboard__stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .dashboard__grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 24px;
      margin-bottom: 24px;

      @media (max-width: 960px) {
        grid-template-columns: 1fr;
      }
    }

    .dashboard__section {
      height: fit-content;

      mat-card-header {
        margin-bottom: 16px;
      }

      mat-card-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 1.125rem;
      }
    }

    .dashboard__recommendations {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .dashboard__notifications-list {
      display: flex;
      flex-direction: column;
    }

    .notification-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 0;
      border-bottom: 1px solid var(--mat-sys-outline-variant);

      &:last-child {
        border-bottom: none;
      }

      &.unread {
        .notification-item__title {
          font-weight: 600;
        }
        .notification-item__icon {
          color: var(--mat-sys-primary);
        }
      }
    }

    .notification-item__icon {
      color: var(--mat-sys-on-surface-variant);
      margin-top: 2px;
    }

    .notification-item__content {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .notification-item__title {
      font-size: 0.875rem;
      color: var(--mat-sys-on-surface);
    }

    .notification-item__message {
      font-size: 0.8125rem;
      color: var(--mat-sys-on-surface-variant);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .notification-item__time {
      font-size: 0.75rem;
      color: var(--mat-sys-outline);
    }

    .dashboard__view-all {
      width: 100%;
      margin-top: 8px;
    }

    .dashboard__applications {
      margin-bottom: 24px;

      mat-card-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 1.125rem;
      }
    }

    .dashboard__table {
      width: 100%;
    }

    .dashboard__table-header {
      display: grid;
      grid-template-columns: 2fr 1.5fr 1fr 1fr;
      gap: 12px;
      padding: 8px 12px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--mat-sys-on-surface-variant);
      border-bottom: 2px solid var(--mat-sys-outline-variant);
    }

    .dashboard__table-row {
      display: grid;
      grid-template-columns: 2fr 1.5fr 1fr 1fr;
      gap: 12px;
      padding: 12px;
      align-items: center;
      font-size: 0.875rem;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
      cursor: pointer;
      transition: background-color 150ms ease;
      border-radius: 4px;

      &:hover {
        background-color: var(--mat-sys-surface-variant);
      }

      &:focus-visible {
        outline: 2px solid var(--mat-sys-primary);
        outline-offset: -2px;
      }
    }

    .truncate {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `,
})
export class StudentDashboardComponent {
  readonly router = inject(Router);
  readonly notificationsStore = inject(NotificationsStore);

  // --- httpResource data loading ---
  readonly profileResource = httpResource<ApiResponse<StudentProfile>>(
    () => ({ url: `${environment.apiUrl}/students/profile` }),
  );

  readonly recommendationsResource = httpResource<PaginatedResponse<Recommendation>>(
    () => ({ url: `${environment.apiUrl}/matching/recommendations`, params: { limit: '3' } }),
  );

  readonly applicationsResource = httpResource<PaginatedResponse<Application>>(
    () => ({ url: `${environment.apiUrl}/applications/my-applications`, params: { limit: '5', status: 'active' } }),
  );

  // --- Computed signals from resources ---
  readonly profile = computed(() => this.profileResource.value()?.data ?? null);

  readonly profileCompleteness = computed(() => this.profile()?.profileCompleteness ?? 0);

  readonly practiceHoursLabel = computed(() => {
    const p = this.profile();
    if (!p) return '0/0';
    return `${p.practiceHoursCompleted}/${p.practiceHoursRequired}`;
  });

  readonly recommendations = computed(() =>
    this.recommendationsResource.value()?.data ?? []
  );

  readonly recommendationsCount = computed(() =>
    this.recommendationsResource.value()?.meta?.total ?? 0
  );

  readonly applications = computed(() =>
    this.applicationsResource.value()?.data ?? []
  );

  readonly activeApplicationsCount = computed(() =>
    this.applicationsResource.value()?.meta?.total ?? 0
  );
}
