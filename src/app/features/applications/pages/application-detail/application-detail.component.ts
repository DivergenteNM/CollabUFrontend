import {
  Component, ChangeDetectionStrategy, inject, input, computed, signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { httpResource } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DatePipe } from '@angular/common';

import { environment } from '../../../../../environments/environment';
import { ApiResponse, Application } from '../../../../core/models';
import { ApplicationStatus } from '../../../../core/enums';
import { ApplicationService } from '../../services/application.service';
import { ApplicationProgressStepperComponent } from '../../../../shared/components/ui/application-progress-stepper/application-progress-stepper.component';
import { TimelineComponent, TimelineEvent } from '../../../../shared/components/ui/timeline/timeline.component';
import { StatusBadgeComponent } from '../../../../shared/components/ui/status-badge/status-badge.component';
import { SkeletonComponent } from '../../../../shared/components/ui/skeleton/skeleton.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../shared/components/ui/confirm-dialog/confirm-dialog.component';
import { FileUploadComponent } from '../../../../shared/components/ui/file-upload/file-upload.component';

@Component({
  selector: 'app-application-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule, MatTabsModule, MatIconModule, MatButtonModule, MatDividerModule,
    MatDialogModule, MatSnackBarModule, DatePipe,
    ApplicationProgressStepperComponent, TimelineComponent, StatusBadgeComponent,
    SkeletonComponent, FileUploadComponent,
  ],
  template: `
    <div class="detail">
      <button mat-button class="detail__back" (click)="router.navigate(['/my-applications'])">
        <mat-icon>arrow_back</mat-icon> Mis Aplicaciones
      </button>

      @if (applicationResource.isLoading()) {
        <app-skeleton width="100%" height="200px" />
        <app-skeleton width="100%" height="400px" />
      } @else if (application(); as app) {
        <!-- Header -->
        <mat-card class="detail__header">
          <mat-card-content>
            <h1>{{ app.project?.title || 'Proyecto' }}</h1>
            <p class="detail__company">
              <mat-icon>business</mat-icon>
              {{ app.project?.companyName || 'Empresa' }}
            </p>
            <app-application-progress-stepper [currentStatus]="app.status" />
          </mat-card-content>
        </mat-card>

        <!-- Tabs -->
        <mat-tab-group class="detail__tabs" animationDuration="200ms">
          <!-- Resumen -->
          <mat-tab label="Resumen">
            <div class="detail__tab-content">
              <div class="detail__summary-grid">
                <mat-card>
                  <mat-card-content>
                    <h3>Información de la Aplicación</h3>
                    <div class="detail__info-row">
                      <span class="detail__label">Estado</span>
                      <app-status-badge [status]="app.status" />
                    </div>
                    <div class="detail__info-row">
                      <span class="detail__label">Fecha de aplicación</span>
                      <span>{{ app.appliedAt | date:'d MMMM yyyy' }}</span>
                    </div>
                    @if (app.matchScore) {
                      <div class="detail__info-row">
                        <span class="detail__label">Match Score</span>
                        <span class="detail__score">{{ app.matchScore }}%</span>
                      </div>
                    }
                    @if (app.reviewedAt) {
                      <div class="detail__info-row">
                        <span class="detail__label">Revisado el</span>
                        <span>{{ app.reviewedAt | date:'d MMMM yyyy' }}</span>
                      </div>
                    }
                    @if (app.acceptedAt) {
                      <div class="detail__info-row">
                        <span class="detail__label">Aceptado el</span>
                        <span>{{ app.acceptedAt | date:'d MMMM yyyy' }}</span>
                      </div>
                    }
                  </mat-card-content>
                </mat-card>

                <mat-card>
                  <mat-card-content>
                    <h3>Carta de Motivación</h3>
                    <p class="detail__cover-letter">{{ app.coverLetter || 'Sin carta de motivación' }}</p>
                  </mat-card-content>
                </mat-card>
              </div>

              <!-- Actions -->
              <div class="detail__actions">
                @if (canWithdraw()) {
                  <button mat-stroked-button color="warn" (click)="withdraw()">
                    <mat-icon>undo</mat-icon> Retirar Aplicación
                  </button>
                }
                <button mat-flat-button (click)="router.navigate(['/chat'])">
                  <mat-icon>chat</mat-icon> Iniciar Chat
                </button>
              </div>
            </div>
          </mat-tab>

          <!-- Timeline -->
          <mat-tab label="Timeline">
            <div class="detail__tab-content">
              @if (timelineEvents().length > 0) {
                <app-timeline [events]="timelineEvents()" />
              } @else {
                <p class="detail__empty">No hay eventos en la línea de tiempo.</p>
              }
            </div>
          </mat-tab>

          <!-- Entrevistas -->
          <mat-tab label="Entrevistas">
            <div class="detail__tab-content">
              @if (app.interviews && app.interviews.length > 0) {
                @for (interview of app.interviews; track interview.id) {
                  <mat-card class="detail__interview-card">
                    <mat-card-content>
                      <div class="detail__interview-header">
                        <div>
                          <h4>{{ interview.scheduledAt | date:'EEEE d MMMM yyyy, HH:mm' }}</h4>
                          <span class="detail__interview-duration">{{ interview.durationMinutes }} min</span>
                        </div>
                        <span class="detail__interview-status"
                              [class]="'status--' + interview.status">
                          {{ interviewStatusLabel(interview.status) }}
                        </span>
                      </div>
                      @if (interview.location) {
                        <p><mat-icon>location_on</mat-icon> {{ interview.location }}</p>
                      }
                      @if (interview.meetingUrl) {
                        <p>
                          <mat-icon>videocam</mat-icon>
                          <a [href]="interview.meetingUrl" target="_blank" rel="noopener">Unirse a la reunión</a>
                        </p>
                      }
                      @if (interview.notes) {
                        <p class="detail__interview-notes">{{ interview.notes }}</p>
                      }
                    </mat-card-content>
                  </mat-card>
                }
              } @else {
                <p class="detail__empty">No hay entrevistas programadas.</p>
              }
            </div>
          </mat-tab>

          <!-- Entregables (visible en in_progress) -->
          @if (app.status === ApplicationStatus.IN_PROGRESS || app.status === ApplicationStatus.COMPLETED) {
            <mat-tab label="Entregables">
              <div class="detail__tab-content">
                @if (app.deliverables && app.deliverables.length > 0) {
                  <div class="detail__deliverables">
                    @for (del of app.deliverables; track del.id; let i = $index) {
                      <mat-card class="detail__deliverable">
                        <mat-card-content>
                          <div class="detail__deliverable-header">
                            <div>
                              <h4>#{{ i + 1 }} — {{ del.title }}</h4>
                              <span class="detail__deliverable-due">
                                Fecha límite: {{ del.dueDate | date:'d MMM yyyy' }}
                              </span>
                            </div>
                            <div class="detail__deliverable-meta">
                              <span class="detail__deliverable-status"
                                    [class]="'del-status--' + del.status">
                                {{ deliverableStatusLabel(del.status) }}
                              </span>
                              @if (del.grade != null) {
                                <span class="detail__deliverable-grade">Nota: {{ del.grade }}/5</span>
                              }
                            </div>
                          </div>
                          @if (del.description) {
                            <p class="detail__deliverable-desc">{{ del.description }}</p>
                          }
                          @if (del.feedback) {
                            <p class="detail__deliverable-feedback">
                              <mat-icon>comment</mat-icon> {{ del.feedback }}
                            </p>
                          }
                          @if (del.status === 'pending' || del.status === 'revision_requested') {
                            <div class="detail__deliverable-upload">
                              <app-file-upload
                                accept=".pdf,.doc,.docx,.zip"
                                [maxSizeMB]="10"
                                label="Subir entregable"
                                (fileSelected)="submitDeliverable(app.id, del.id, $event)" />
                            </div>
                          }
                        </mat-card-content>
                      </mat-card>
                    }
                  </div>
                } @else {
                  <p class="detail__empty">No hay entregables asignados aún.</p>
                }
              </div>
            </mat-tab>
          }
        </mat-tab-group>
      }
    </div>
  `,
  styles: `
    :host { display: block; padding: 24px; max-width: 1000px; margin: 0 auto; }

    .detail__back {
      margin-bottom: 16px;
    }

    .detail__header {
      margin-bottom: 24px;

      h1 {
        font-size: 1.5rem;
        font-weight: 700;
        margin: 0 0 8px;
        color: var(--mat-sys-on-surface);
      }
    }

    .detail__company {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--mat-sys-on-surface-variant);
      font-size: 0.9375rem;
      margin: 0 0 16px;

      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }

    .detail__tabs { margin-top: 8px; }

    .detail__tab-content { padding: 24px 0; }

    .detail__summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 16px;

      h3 {
        font-size: 1rem;
        font-weight: 600;
        margin: 0 0 16px;
        color: var(--mat-sys-on-surface);
      }
    }

    .detail__info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
      font-size: 0.875rem;

      &:last-child { border-bottom: none; }
    }

    .detail__label {
      color: var(--mat-sys-on-surface-variant);
      font-weight: 500;
    }

    .detail__score {
      font-weight: 700;
      color: var(--mat-sys-primary);
    }

    .detail__cover-letter {
      font-size: 0.875rem;
      line-height: 1.6;
      color: var(--mat-sys-on-surface-variant);
      white-space: pre-line;
    }

    .detail__actions {
      display: flex;
      gap: 12px;
      margin-top: 24px;
    }

    .detail__empty {
      text-align: center;
      color: var(--mat-sys-on-surface-variant);
      padding: 32px;
      font-size: 0.9375rem;
    }

    .detail__interview-card {
      margin-bottom: 12px;
    }

    .detail__interview-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;

      h4 { margin: 0; font-size: 0.9375rem; font-weight: 600; }
    }

    .detail__interview-duration {
      font-size: 0.8125rem;
      color: var(--mat-sys-on-surface-variant);
    }

    .detail__interview-status {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 12px;

      &.status--scheduled { background: #e3f2fd; color: #1565c0; }
      &.status--completed { background: #e8f5e9; color: #2e7d32; }
      &.status--cancelled { background: #fce4ec; color: #c62828; }
      &.status--no_show { background: #fff3e0; color: #e65100; }
    }

    .detail__interview-notes {
      font-size: 0.8125rem;
      color: var(--mat-sys-on-surface-variant);
      font-style: italic;
      margin-top: 8px;
    }

    .detail__deliverables {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .detail__deliverable-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;

      h4 { margin: 0; font-size: 0.9375rem; font-weight: 600; }
    }

    .detail__deliverable-due {
      font-size: 0.8125rem;
      color: var(--mat-sys-on-surface-variant);
    }

    .detail__deliverable-meta {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
    }

    .detail__deliverable-status {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 12px;

      &.del-status--pending { background: #fff3e0; color: #e65100; }
      &.del-status--submitted { background: #e3f2fd; color: #1565c0; }
      &.del-status--approved { background: #e8f5e9; color: #2e7d32; }
      &.del-status--rejected { background: #fce4ec; color: #c62828; }
      &.del-status--revision_requested { background: #fff8e1; color: #f57f17; }
    }

    .detail__deliverable-grade {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--mat-sys-primary);
    }

    .detail__deliverable-desc {
      font-size: 0.8125rem;
      color: var(--mat-sys-on-surface-variant);
      margin: 8px 0 0;
    }

    .detail__deliverable-feedback {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      font-size: 0.8125rem;
      color: var(--mat-sys-on-surface-variant);
      background: var(--mat-sys-surface-variant);
      padding: 8px 12px;
      border-radius: 8px;
      margin-top: 8px;

      mat-icon { font-size: 16px; width: 16px; height: 16px; flex-shrink: 0; margin-top: 2px; }
    }

    .detail__deliverable-upload {
      margin-top: 12px;
    }
  `,
})
export class ApplicationDetailComponent {
  readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly applicationService = inject(ApplicationService);

  readonly id = input.required<string>();
  readonly ApplicationStatus = ApplicationStatus;
  readonly submitting = signal(false);

  readonly applicationResource = httpResource<ApiResponse<Application>>(
    () => ({ url: `${environment.apiUrl}/applications/${this.id()}` }),
  );

  readonly application = computed(() =>
    this.applicationResource.value()?.data,
  );

  readonly canWithdraw = computed(() => {
    const s = this.application()?.status;
    return s === ApplicationStatus.PENDING || s === ApplicationStatus.UNDER_REVIEW;
  });

  readonly timelineEvents = computed<TimelineEvent[]>(() => {
    const timeline = this.application()?.timeline ?? [];
    return timeline.map((t) => ({
      date: t.createdAt,
      title: t.description,
      description: `Por: ${t.performedBy}`,
      icon: this.getTimelineIcon(t.eventType),
    }));
  });

  interviewStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      scheduled: 'Programada',
      completed: 'Completada',
      cancelled: 'Cancelada',
      no_show: 'No asistió',
    };
    return labels[status] ?? status;
  }

  deliverableStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      submitted: 'Entregado',
      approved: 'Aprobado',
      rejected: 'Rechazado',
      revision_requested: 'Revisión solicitada',
    };
    return labels[status] ?? status;
  }

  withdraw(): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Retirar Aplicación',
        message: '¿Estás seguro de que deseas retirar esta aplicación? Esta acción no se puede deshacer.',
        confirmText: 'Retirar',
        type: 'danger',
      } satisfies ConfirmDialogData,
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.applicationService.withdraw(this.id()).subscribe({
          next: () => {
            this.snackBar.open('Aplicación retirada', 'OK', { duration: 3000 });
            this.applicationResource.reload();
          },
          error: () => this.snackBar.open('Error al retirar', 'Cerrar', { duration: 4000 }),
        });
      }
    });
  }

  submitDeliverable(applicationId: string, deliverableId: string, files: File[]): void {
    if (!files.length || this.submitting()) return;
    this.submitting.set(true);
    const formData = new FormData();
    formData.append('file', files[0]);
    formData.append('deliverableId', deliverableId);

    this.applicationService.submitDeliverable(applicationId, formData).subscribe({
      next: () => {
        this.submitting.set(false);
        this.snackBar.open('Entregable subido correctamente', 'OK', { duration: 3000 });
        this.applicationResource.reload();
      },
      error: () => {
        this.submitting.set(false);
        this.snackBar.open('Error al subir entregable', 'Cerrar', { duration: 4000 });
      },
    });
  }

  private getTimelineIcon(eventType: string): string {
    const icons: Record<string, string> = {
      applied: 'send',
      reviewed: 'visibility',
      interview_scheduled: 'event',
      accepted: 'check_circle',
      rejected: 'cancel',
      started: 'play_circle',
      completed: 'task_alt',
      withdrawn: 'undo',
    };
    return icons[eventType] ?? 'circle';
  }
}
