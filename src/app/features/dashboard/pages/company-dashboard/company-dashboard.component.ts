import {
  Component, ChangeDetectionStrategy, inject, computed,
} from '@angular/core';
import { Router } from '@angular/router';
import { httpResource } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { environment } from '../../../../../environments/environment';
import { PaginatedResponse, Project, Application } from '../../../../core/models';
import { NotificationsStore } from '../../../../state/notifications.store';
import { StatCardComponent } from '../../../../shared/components/ui/stat-card/stat-card.component';
import { ApplicationCardComponent } from '../../../../shared/components/cards/application-card/application-card.component';
import { StatusBadgeComponent } from '../../../../shared/components/ui/status-badge/status-badge.component';
import { SkeletonComponent } from '../../../../shared/components/ui/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state.component';
import { RelativeTimePipe } from '../../../../shared/pipes';

@Component({
  selector: 'app-company-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule, MatIconModule, MatButtonModule,
    StatCardComponent, ApplicationCardComponent, StatusBadgeComponent,
    SkeletonComponent, EmptyStateComponent, RelativeTimePipe,
  ],
  template: `
    <!-- Stat Cards -->
    <section class="dashboard__stats">
      @if (projectsResource.isLoading()) {
        @for (_ of [1,2,3,4]; track $index) {
          <app-skeleton width="100%" height="120px" />
        }
      } @else {
        <app-stat-card
          icon="work"
          [value]="activeProjectsCount()"
          label="Proyectos Activos"
          color="primary"
          [clickable]="true"
          (clicked)="router.navigate(['/my-projects'])" />
        <app-stat-card
          icon="pending_actions"
          [value]="pendingApplicationsCount()"
          label="Aplicaciones Pendientes"
          color="accent"
          [clickable]="true"
          (clicked)="router.navigate(['/received-applications'])" />
        <app-stat-card
          icon="school"
          [value]="activeStudentsCount()"
          label="Estudiantes Activos"
          color="primary" />
        <app-stat-card
          icon="star"
          [value]="avgRating()"
          label="Rating Promedio"
          color="warn" />
      }
    </section>

    <!-- Two-column: Pending Applications + My Projects -->
    <section class="dashboard__grid">
      <!-- Pending Applications -->
      <mat-card class="dashboard__section">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>assignment_ind</mat-icon> Aplicaciones Pendientes
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          @if (applicationsResource.isLoading()) {
            @for (_ of [1,2,3]; track $index) {
              <app-skeleton width="100%" height="160px" />
            }
          } @else if (pendingApplications().length === 0) {
            <app-empty-state
              icon="inbox"
              title="Sin aplicaciones pendientes"
              message="No tienes aplicaciones por revisar en este momento." />
          } @else {
            <div class="dashboard__application-list">
              @for (app of pendingApplications(); track app.id) {
                <app-application-card
                  [application]="app"
                  viewMode="company"
                  (viewDetail)="router.navigate(['/received-applications', $event])"
                  (changeStatus)="onChangeApplicationStatus($event)" />
              }
            </div>
            <button mat-button class="dashboard__view-all"
                    (click)="router.navigate(['/received-applications'])">
              Ver todas las aplicaciones
            </button>
          }
        </mat-card-content>
      </mat-card>

      <!-- My Projects -->
      @defer (on viewport) {
        <mat-card class="dashboard__section">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>folder_open</mat-icon> Mis Proyectos
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @if (projectsResource.isLoading()) {
              @for (_ of [1,2,3]; track $index) {
                <app-skeleton width="100%" height="80px" />
              }
            } @else if (projects().length === 0) {
              <app-empty-state
                icon="create_new_folder"
                title="Sin proyectos"
                message="Publica tu primer proyecto para recibir aplicaciones."
                actionLabel="Crear Proyecto"
                (actionClicked)="router.navigate(['/my-projects', 'new'])" />
            } @else {
              <div class="dashboard__project-list">
                @for (proj of projects(); track proj.id) {
                  <div class="project-summary"
                       (click)="router.navigate(['/my-projects', proj.id])"
                       (keydown.enter)="router.navigate(['/my-projects', proj.id])"
                       tabindex="0"
                       role="button">
                    <div class="project-summary__info">
                      <span class="project-summary__title">{{ proj.title }}</span>
                      <span class="project-summary__meta">
                        <app-status-badge [status]="proj.status" size="sm" />
                        <span>{{ proj.positionsFilled }}/{{ proj.positionsAvailable }} posiciones</span>
                      </span>
                    </div>
                    <div class="project-summary__apps">
                      <mat-icon>people</mat-icon>
                      {{ proj.applicationsCount }}
                    </div>
                  </div>
                }
              </div>
              <button mat-button class="dashboard__view-all"
                      (click)="router.navigate(['/my-projects'])">
                Ver todos los proyectos
              </button>
            }
          </mat-card-content>
        </mat-card>
      } @placeholder {
        <app-skeleton width="100%" height="300px" />
      }
    </section>

    <!-- Recent Activity -->
    @defer (on viewport) {
      <section class="dashboard__activity">
        <mat-card>
          <mat-card-header>
            <mat-card-title>
              <mat-icon>history</mat-icon> Actividad Reciente
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @if (notificationsStore.recentNotifications().length === 0) {
              <app-empty-state
                icon="notifications_none"
                title="Sin actividad reciente"
                message="La actividad de tus proyectos aparecerá aquí." />
            } @else {
              <div class="dashboard__activity-list">
                @for (n of notificationsStore.recentNotifications(); track n.id) {
                  <div class="activity-item" [class.unread]="!n.isRead">
                    <mat-icon class="activity-item__icon">
                      {{ n.isRead ? 'radio_button_unchecked' : 'circle' }}
                    </mat-icon>
                    <div class="activity-item__content">
                      <span class="activity-item__title">{{ n.title }}</span>
                      <span class="activity-item__message">{{ n.message }}</span>
                      <span class="activity-item__time">{{ n.createdAt | relativeTime }}</span>
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
      </section>
    } @placeholder {
      <app-skeleton width="100%" height="200px" />
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
      grid-template-columns: 1.5fr 1fr;
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

    .dashboard__application-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .dashboard__project-list {
      display: flex;
      flex-direction: column;
    }

    .project-summary {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
      cursor: pointer;
      transition: background-color 150ms ease;
      border-radius: 4px;

      &:last-child {
        border-bottom: none;
      }

      &:hover {
        background-color: var(--mat-sys-surface-variant);
      }

      &:focus-visible {
        outline: 2px solid var(--mat-sys-primary);
        outline-offset: -2px;
      }
    }

    .project-summary__info {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    .project-summary__title {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .project-summary__meta {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.8125rem;
      color: var(--mat-sys-on-surface-variant);
    }

    .project-summary__apps {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.875rem;
      color: var(--mat-sys-on-surface-variant);

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    .dashboard__view-all {
      width: 100%;
      margin-top: 8px;
    }

    .dashboard__activity {
      margin-bottom: 24px;

      mat-card-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 1.125rem;
      }
    }

    .dashboard__activity-list {
      display: flex;
      flex-direction: column;
    }

    .activity-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 0;
      border-bottom: 1px solid var(--mat-sys-outline-variant);

      &:last-child {
        border-bottom: none;
      }

      &.unread .activity-item__title {
        font-weight: 600;
      }
    }

    .activity-item__icon {
      color: var(--mat-sys-on-surface-variant);
      font-size: 12px;
      width: 12px;
      height: 12px;
      margin-top: 4px;
    }

    .activity-item__content {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .activity-item__title {
      font-size: 0.875rem;
      color: var(--mat-sys-on-surface);
    }

    .activity-item__message {
      font-size: 0.8125rem;
      color: var(--mat-sys-on-surface-variant);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .activity-item__time {
      font-size: 0.75rem;
      color: var(--mat-sys-outline);
    }
  `,
})
export class CompanyDashboardComponent {
  readonly router = inject(Router);
  readonly notificationsStore = inject(NotificationsStore);

  // --- httpResource data loading ---
  readonly projectsResource = httpResource<PaginatedResponse<Project>>(
    () => ({ url: `${environment.apiUrl}/projects/my-projects`, params: { status: 'published' } }),
  );

  readonly applicationsResource = httpResource<PaginatedResponse<Application>>(
    () => ({ url: `${environment.apiUrl}/applications/received`, params: { status: 'pending', limit: '5' } }),
  );

  // --- Computed signals from resources ---
  readonly projects = computed(() =>
    this.projectsResource.value()?.data ?? []
  );

  readonly activeProjectsCount = computed(() =>
    this.projectsResource.value()?.meta?.total ?? 0
  );

  readonly pendingApplications = computed(() =>
    this.applicationsResource.value()?.data ?? []
  );

  readonly pendingApplicationsCount = computed(() =>
    this.applicationsResource.value()?.meta?.total ?? 0
  );

  readonly activeStudentsCount = computed(() => {
    const projects = this.projects();
    return projects.reduce((sum, p) => sum + p.positionsFilled, 0);
  });

  readonly avgRating = computed(() => {
    // Placeholder — computed from project data or separate endpoint
    return '—';
  });

  onChangeApplicationStatus(event: { id: string; status: string }): void {
    // Will be wired to ApplicationService in applications feature
    console.log('Change application status:', event);
  }
}
