import { Component, ChangeDetectionStrategy, input, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { ApiResponse } from '../../../../core/models';
import { StarRatingComponent } from '../../../../shared/components/ui/star-rating/star-rating.component';

interface SupervisionDetail {
  applicationId: string;
  student: {
    id: string;
    name: string;
    program: string;
    semester: number;
    avatarUrl?: string;
  };
  company: {
    name: string;
    logoUrl?: string;
  };
  project: {
    title: string;
    type: string;
  };
  hoursCompleted: number;
  hoursRequired: number;
  status: string;
  deliverables: Deliverable[];
  evaluations: EvaluationSummary[];
}

interface Deliverable {
  id: string;
  title: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  submittedAt?: string;
  fileUrl?: string;
}

interface EvaluationSummary {
  id: string;
  evaluatorName: string;
  overallRating: number;
  comment: string;
  createdAt: string;
}

@Component({
  selector: 'app-student-supervision',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink, MatIconModule, MatButtonModule, MatCardModule,
    MatTabsModule, MatProgressBarModule, MatChipsModule,
    DatePipe, StarRatingComponent,
  ],
  template: `
    <div class="supervision">
      <button mat-button routerLink="/my-students">
        <mat-icon>arrow_back</mat-icon>
        Volver a mis estudiantes
      </button>

      @if (resource.isLoading()) {
        <mat-card>
          <mat-card-content>
            <p>Cargando información del estudiante...</p>
          </mat-card-content>
        </mat-card>
      }

      @if (resource.value()?.data; as detail) {
        <!-- Student Info Card -->
        <mat-card class="supervision__info">
          <mat-card-content>
            <div class="student-header">
              <div class="avatar">
                @if (detail.student.avatarUrl) {
                  <img [src]="detail.student.avatarUrl" [alt]="detail.student.name" />
                } @else {
                  <mat-icon>person</mat-icon>
                }
              </div>
              <div class="student-details">
                <h2>{{ detail.student.name }}</h2>
                <p>{{ detail.student.program }} · Semestre {{ detail.student.semester }}</p>
                <p class="project-info">
                  <mat-icon>business</mat-icon> {{ detail.company.name }} ·
                  <mat-icon>folder</mat-icon> {{ detail.project.title }}
                </p>
              </div>
              <div class="progress-section">
                <span class="hours">{{ detail.hoursCompleted }}/{{ detail.hoursRequired }}h</span>
                <mat-progress-bar mode="determinate"
                  [value]="(detail.hoursCompleted / detail.hoursRequired) * 100" />
                <mat-chip-set>
                  <mat-chip>{{ detail.status }}</mat-chip>
                </mat-chip-set>
              </div>
            </div>
          </mat-card-content>
          <mat-card-actions align="end">
            <a mat-flat-button color="primary"
              [routerLink]="['/my-evaluations/create']"
              [queryParams]="{ applicationId: detail.applicationId }">
              <mat-icon>rate_review</mat-icon>
              Evaluar Estudiante
            </a>
          </mat-card-actions>
        </mat-card>

        <!-- Tabs -->
        <mat-tab-group>
          <mat-tab label="Entregables">
            <div class="tab-content">
              @for (d of detail.deliverables; track d.id) {
                <mat-card class="deliverable-card">
                  <mat-card-content>
                    <div class="deliverable-row">
                      <div class="deliverable-info">
                        <strong>{{ d.title }}</strong>
                        <span class="deliverable-due">
                          <mat-icon>schedule</mat-icon>
                          Vence: {{ d.dueDate | date:'d MMM yyyy' }}
                        </span>
                      </div>
                      <mat-chip-set>
                        <mat-chip [class]="'status-' + d.status">
                          {{ deliverableStatusLabel(d.status) }}
                        </mat-chip>
                      </mat-chip-set>
                      @if (d.fileUrl) {
                        <a mat-icon-button aria-label="Descargar entregable" [href]="d.fileUrl" target="_blank">
                          <mat-icon>download</mat-icon>
                        </a>
                      }
                    </div>
                  </mat-card-content>
                </mat-card>
              } @empty {
                <div class="empty">
                  <mat-icon>assignment</mat-icon>
                  <p>No hay entregables registrados</p>
                </div>
              }
            </div>
          </mat-tab>

          <mat-tab label="Evaluaciones">
            <div class="tab-content">
              @for (ev of detail.evaluations; track ev.id) {
                <mat-card class="eval-card">
                  <mat-card-content>
                    <div class="eval-header">
                      <strong>{{ ev.evaluatorName }}</strong>
                      <span class="eval-date">{{ ev.createdAt | date:'d MMM yyyy' }}</span>
                    </div>
                    <app-star-rating [value]="ev.overallRating" [readonly]="true" size="sm" />
                    <p class="eval-comment">{{ ev.comment }}</p>
                  </mat-card-content>
                </mat-card>
              } @empty {
                <div class="empty">
                  <mat-icon>rate_review</mat-icon>
                  <p>No hay evaluaciones registradas</p>
                </div>
              }
            </div>
          </mat-tab>
        </mat-tab-group>
      }
    </div>
  `,
  styles: `
    .supervision {
      max-width: 900px;
      margin: 0 auto;

      > button:first-child {
        margin-bottom: 16px;
      }

      &__info {
        margin-bottom: 24px;
      }
    }

    .student-header {
      display: flex;
      gap: 20px;
      align-items: flex-start;

      @media (max-width: 599px) {
        flex-direction: column;
      }
    }

    .avatar {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      overflow: hidden;
      background: var(--mat-sys-surface-variant);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        color: var(--mat-sys-on-surface-variant);
      }
    }

    .student-details {
      flex: 1;

      h2 {
        margin: 0 0 4px;
        font-size: 1.25rem;
        font-weight: 500;
      }

      p {
        margin: 2px 0;
        color: var(--mat-sys-on-surface-variant);
        font-size: 0.9375rem;
      }

      .project-info {
        display: flex;
        align-items: center;
        gap: 4px;

        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }
    }

    .progress-section {
      text-align: right;
      min-width: 140px;

      .hours {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--mat-sys-primary);
      }

      mat-progress-bar {
        margin: 8px 0;
      }
    }

    .tab-content {
      padding: 16px 0;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .deliverable-row {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .deliverable-info {
      flex: 1;

      strong {
        display: block;
        margin-bottom: 4px;
      }

      .deliverable-due {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 0.8125rem;
        color: var(--mat-sys-on-surface-variant);

        mat-icon {
          font-size: 14px;
          width: 14px;
          height: 14px;
        }
      }
    }

    .status-pending { background-color: #fff3e0 !important; color: #e65100 !important; }
    .status-submitted { background-color: #e3f2fd !important; color: #1565c0 !important; }
    .status-approved { background-color: #e8f5e9 !important; color: #2e7d32 !important; }
    .status-rejected { background-color: #ffebee !important; color: #c62828 !important; }

    .eval-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .eval-date {
      font-size: 0.8125rem;
      color: var(--mat-sys-on-surface-variant);
    }

    .eval-comment {
      margin-top: 8px;
      font-size: 0.9375rem;
      color: var(--mat-sys-on-surface-variant);
    }

    .empty {
      text-align: center;
      padding: 32px;
      color: var(--mat-sys-on-surface-variant);

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        margin-bottom: 8px;
      }
    }
  `,
})
export class StudentSupervisionComponent {
  readonly applicationId = input.required<string>();
  private readonly router = inject(Router);

  readonly resource = httpResource<ApiResponse<SupervisionDetail>>(
    () => ({ url: `${environment.apiUrl}/faculty/students/${this.applicationId()}` })
  );

  deliverableStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      submitted: 'Entregado',
      approved: 'Aprobado',
      rejected: 'Rechazado',
    };
    return labels[status] ?? status;
  }
}
