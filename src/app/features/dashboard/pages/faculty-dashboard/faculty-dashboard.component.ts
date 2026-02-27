import {
  Component, ChangeDetectionStrategy, inject, computed,
} from '@angular/core';
import { Router } from '@angular/router';
import { httpResource } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { environment } from '../../../../../environments/environment';
import { PaginatedResponse } from '../../../../core/models';
import { ApplicationStatus } from '../../../../core/enums';
import { NotificationsStore } from '../../../../state/notifications.store';
import { StatCardComponent } from '../../../../shared/components/ui/stat-card/stat-card.component';
import { StatusBadgeComponent } from '../../../../shared/components/ui/status-badge/status-badge.component';
import { SkeletonComponent } from '../../../../shared/components/ui/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state.component';
import { RelativeTimePipe } from '../../../../shared/pipes';

/** Represents a supervised student as returned by the faculty endpoint */
export interface AssignedStudentSummary {
  applicationId: string;
  studentName: string;
  studentCode: string;
  program: string;
  companyName: string;
  projectTitle: string;
  status: ApplicationStatus;
  progressPercent: number;
  practiceHoursCompleted: number;
  practiceHoursRequired: number;
  pendingEvaluation: boolean;
}

@Component({
  selector: 'app-faculty-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule, MatIconModule, MatButtonModule, MatProgressBarModule,
    StatCardComponent, StatusBadgeComponent, SkeletonComponent,
    EmptyStateComponent, RelativeTimePipe,
  ],
  template: `
    <!-- Stat Cards -->
    <section class="dashboard__stats">
      @if (studentsResource.isLoading()) {
        @for (_ of [1,2,3]; track $index) {
          <app-skeleton width="100%" height="120px" />
        }
      } @else {
        <app-stat-card
          icon="groups"
          [value]="assignedCount()"
          label="Estudiantes Asignados"
          color="primary"
          [clickable]="true"
          (clicked)="router.navigate(['/my-students'])" />
        <app-stat-card
          icon="rate_review"
          [value]="pendingEvaluationsCount()"
          label="Evaluaciones Pendientes"
          color="accent"
          [clickable]="true"
          (clicked)="router.navigate(['/my-evaluations'])" />
        <app-stat-card
          icon="trending_up"
          [value]="avgProgress() + '%'"
          label="Avance Promedio"
          color="primary" />
      }
    </section>

    <!-- Assigned Students Table -->
    <section class="dashboard__students">
      <mat-card>
        <mat-card-header>
          <mat-card-title>
            <mat-icon>school</mat-icon> Estudiantes Asignados
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          @if (studentsResource.isLoading()) {
            @for (_ of [1,2,3,4]; track $index) {
              <app-skeleton width="100%" height="56px" />
            }
          } @else if (students().length === 0) {
            <app-empty-state
              icon="people_outline"
              title="Sin estudiantes asignados"
              message="Aún no tienes estudiantes bajo tu supervisión." />
          } @else {
            <div class="students-table">
              <div class="students-table__header">
                <span>Estudiante</span>
                <span>Empresa</span>
                <span>Avance</span>
                <span>Estado</span>
              </div>
              @for (s of students(); track s.applicationId) {
                <div class="students-table__row"
                     (click)="router.navigate(['/my-students', s.applicationId])"
                     (keydown.enter)="router.navigate(['/my-students', s.applicationId])"
                     tabindex="0"
                     role="button">
                  <div class="students-table__student">
                    <span class="students-table__name">{{ s.studentName }}</span>
                    <span class="students-table__code">{{ s.studentCode }} · {{ s.program }}</span>
                  </div>
                  <div class="students-table__company">
                    <span class="truncate">{{ s.companyName }}</span>
                    <span class="students-table__project truncate">{{ s.projectTitle }}</span>
                  </div>
                  <div class="students-table__progress">
                    <mat-progress-bar
                      mode="determinate"
                      [value]="s.progressPercent"
                      [color]="s.progressPercent >= 75 ? 'primary' : s.progressPercent >= 50 ? 'accent' : 'warn'" />
                    <span class="students-table__progress-label">
                      {{ s.progressPercent }}% ({{ s.practiceHoursCompleted }}/{{ s.practiceHoursRequired }}h)
                    </span>
                  </div>
                  <div class="students-table__status">
                    <app-status-badge [status]="s.status" size="sm" />
                    @if (s.pendingEvaluation) {
                      <mat-icon class="students-table__eval-badge">rate_review</mat-icon>
                    }
                  </div>
                </div>
              }
            </div>
            <button mat-button class="dashboard__view-all"
                    (click)="router.navigate(['/my-students'])">
              Ver todos los estudiantes
            </button>
          }
        </mat-card-content>
      </mat-card>
    </section>

    <!-- Recent Notifications -->
    @defer (on viewport) {
      <section class="dashboard__activity">
        <mat-card>
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

    .dashboard__students {
      margin-bottom: 24px;

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

    .students-table {
      width: 100%;
    }

    .students-table__header {
      display: grid;
      grid-template-columns: 2fr 1.5fr 1.5fr 1fr;
      gap: 12px;
      padding: 8px 12px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--mat-sys-on-surface-variant);
      border-bottom: 2px solid var(--mat-sys-outline-variant);
    }

    .students-table__row {
      display: grid;
      grid-template-columns: 2fr 1.5fr 1.5fr 1fr;
      gap: 12px;
      padding: 12px;
      align-items: center;
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

    .students-table__student {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .students-table__name {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface);
    }

    .students-table__code {
      font-size: 0.75rem;
      color: var(--mat-sys-on-surface-variant);
    }

    .students-table__company {
      display: flex;
      flex-direction: column;
      min-width: 0;
      font-size: 0.875rem;
    }

    .students-table__project {
      font-size: 0.75rem;
      color: var(--mat-sys-on-surface-variant);
    }

    .students-table__progress {
      display: flex;
      flex-direction: column;
      gap: 4px;

      mat-progress-bar {
        border-radius: 4px;
      }
    }

    .students-table__progress-label {
      font-size: 0.75rem;
      color: var(--mat-sys-on-surface-variant);
    }

    .students-table__status {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .students-table__eval-badge {
      color: var(--mat-sys-tertiary);
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .truncate {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
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
  `,
})
export class FacultyDashboardComponent {
  readonly router = inject(Router);
  readonly notificationsStore = inject(NotificationsStore);

  // --- httpResource data loading ---
  readonly studentsResource = httpResource<PaginatedResponse<AssignedStudentSummary>>(
    () => ({ url: `${environment.apiUrl}/faculty/assigned-students` }),
  );

  // --- Computed signals from resources ---
  readonly students = computed(() =>
    this.studentsResource.value()?.data ?? []
  );

  readonly assignedCount = computed(() =>
    this.studentsResource.value()?.meta?.total ?? 0
  );

  readonly pendingEvaluationsCount = computed(() =>
    this.students().filter(s => s.pendingEvaluation).length
  );

  readonly avgProgress = computed(() => {
    const list = this.students();
    if (list.length === 0) return 0;
    const total = list.reduce((sum, s) => sum + s.progressPercent, 0);
    return Math.round(total / list.length);
  });
}
