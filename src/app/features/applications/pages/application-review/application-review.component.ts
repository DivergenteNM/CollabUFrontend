import {
  Component, ChangeDetectionStrategy, inject, input, computed, signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { httpResource } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSliderModule } from '@angular/material/slider';
import { DatePipe, DecimalPipe } from '@angular/common';

import { environment } from '../../../../../environments/environment';
import { ApiResponse, Application, MatchBreakdown } from '../../../../core/models';
import { ApplicationStatus } from '../../../../core/enums';
import { ApplicationService } from '../../services/application.service';
import { ApplicationProgressStepperComponent } from '../../../../shared/components/ui/application-progress-stepper/application-progress-stepper.component';
import { StatusBadgeComponent } from '../../../../shared/components/ui/status-badge/status-badge.component';
import { MatchScoreCardComponent } from '../../../../shared/components/cards/match-score-card/match-score-card.component';
import { SkillChipListComponent } from '../../../../shared/components/ui/skill-chip-list/skill-chip-list.component';
import { SkeletonComponent } from '../../../../shared/components/ui/skeleton/skeleton.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../shared/components/ui/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-application-review',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule, FormsModule,
    MatCardModule, MatTabsModule, MatIconModule, MatButtonModule, MatChipsModule,
    MatDividerModule, MatDialogModule, MatSnackBarModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatDatepickerModule, MatSliderModule, DatePipe, DecimalPipe,
    ApplicationProgressStepperComponent, StatusBadgeComponent, MatchScoreCardComponent,
    SkillChipListComponent, SkeletonComponent,
  ],
  template: `
    <div class="review">
      <button mat-button class="review__back" (click)="router.navigate(['/received-applications'])">
        <mat-icon>arrow_back</mat-icon> Aplicaciones Recibidas
      </button>

      @if (applicationResource.isLoading()) {
        <app-skeleton width="100%" height="200px" />
        <app-skeleton width="100%" height="400px" />
      } @else if (application(); as app) {
        <!-- Header -->
        <mat-card class="review__header-card">
          <mat-card-content>
            <div class="review__header">
              <div>
                <h1>{{ app.project?.title || 'Proyecto' }}</h1>
                <app-status-badge [status]="app.status" />
              </div>
              <app-application-progress-stepper [currentStatus]="app.status" />
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Two-column layout -->
        <div class="review__content">
          <!-- Left: Student Info -->
          <mat-card class="review__student-card">
            <mat-card-content>
              <h2>
                <mat-icon>person</mat-icon>
                {{ app.student?.userId ? 'Estudiante' : 'Estudiante #' + app.studentId }}
              </h2>
              @if (app.student; as student) {
                <div class="review__student-info">
                  <div class="review__info-row">
                    <span class="review__label">Código</span>
                    <span>{{ student.studentCode }}</span>
                  </div>
                  <div class="review__info-row">
                    <span class="review__label">Programa</span>
                    <span>{{ student.program }}</span>
                  </div>
                  <div class="review__info-row">
                    <span class="review__label">Semestre</span>
                    <span>{{ student.semester }}</span>
                  </div>
                  @if (student.gpa) {
                    <div class="review__info-row">
                      <span class="review__label">Promedio</span>
                      <span>{{ student.gpa | number:'1.1-2' }}</span>
                    </div>
                  }
                  <div class="review__info-row">
                    <span class="review__label">Horas práctica</span>
                    <span>{{ student.practiceHoursCompleted }}/{{ student.practiceHoursRequired }}h</span>
                  </div>
                  @if (student.averageRating) {
                    <div class="review__info-row">
                      <span class="review__label">Rating promedio</span>
                      <span>⭐ {{ student.averageRating | number:'1.1-1' }}</span>
                    </div>
                  }
                </div>

                @if (student.skills.length > 0) {
                  <mat-divider />
                  <h3>Habilidades</h3>
                  <app-skill-chip-list [skills]="studentSkillNames()" />
                }

                @if (student.bio) {
                  <mat-divider />
                  <h3>Biografía</h3>
                  <p class="review__bio">{{ student.bio }}</p>
                }

                <div class="review__student-links">
                  @if (student.linkedinUrl) {
                    <a [href]="student.linkedinUrl" target="_blank" rel="noopener" mat-stroked-button>
                      <mat-icon>link</mat-icon> LinkedIn
                    </a>
                  }
                  @if (student.githubUrl) {
                    <a [href]="student.githubUrl" target="_blank" rel="noopener" mat-stroked-button>
                      <mat-icon>code</mat-icon> GitHub
                    </a>
                  }
                  @if (student.portfolioUrl) {
                    <a [href]="student.portfolioUrl" target="_blank" rel="noopener" mat-stroked-button>
                      <mat-icon>language</mat-icon> Portfolio
                    </a>
                  }
                </div>
              }
            </mat-card-content>
          </mat-card>

          <!-- Right: Match + Cover Letter -->
          <div class="review__right">
            @if (app.matchScore != null && app.matchBreakdown) {
              <app-match-score-card
                [totalScore]="app.matchScore"
                [breakdown]="app.matchBreakdown" />
            }

            <mat-card>
              <mat-card-content>
                <h3>Carta de Motivación</h3>
                <p class="review__cover-letter">{{ app.coverLetter || 'Sin carta de motivación' }}</p>
                <p class="review__applied-date">
                  <mat-icon>calendar_today</mat-icon>
                  Aplicó el {{ app.appliedAt | date:'d MMMM yyyy' }}
                </p>
              </mat-card-content>
            </mat-card>

            <!-- Actions -->
            <mat-card class="review__actions-card">
              <mat-card-content>
                <h3>Acciones</h3>
                <div class="review__actions">
                  @if (canScheduleInterview()) {
                    <button mat-flat-button (click)="showInterviewForm.set(!showInterviewForm())">
                      <mat-icon>event</mat-icon> Programar Entrevista
                    </button>
                  }
                  @if (canAccept()) {
                    <button mat-flat-button class="action--accept" (click)="accept()">
                      <mat-icon>check_circle</mat-icon> Aceptar
                    </button>
                  }
                  @if (canReject()) {
                    <button mat-stroked-button class="action--reject" (click)="showRejectForm.set(!showRejectForm())">
                      <mat-icon>cancel</mat-icon> Rechazar
                    </button>
                  }
                </div>

                <!-- Interview form -->
                @if (showInterviewForm()) {
                  <form [formGroup]="interviewForm" class="review__inline-form" (ngSubmit)="scheduleInterview()">
                    <mat-divider />
                    <h4>Programar Entrevista</h4>
                    <div class="review__form-row">
                      <mat-form-field appearance="outline">
                        <mat-label>Fecha y hora</mat-label>
                        <input matInput [matDatepicker]="dp" formControlName="scheduledAt" />
                        <mat-datepicker-toggle matIconSuffix [for]="dp" />
                        <mat-datepicker #dp />
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>Duración (min)</mat-label>
                        <input matInput type="number" formControlName="durationMinutes" />
                      </mat-form-field>
                    </div>
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Modalidad</mat-label>
                      <mat-select formControlName="modality">
                        <mat-option value="presencial">Presencial</mat-option>
                        <mat-option value="virtual">Virtual</mat-option>
                      </mat-select>
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Link Meet / Ubicación</mat-label>
                      <input matInput formControlName="meetingUrl" />
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Notas (opcional)</mat-label>
                      <textarea matInput formControlName="notes" rows="2"></textarea>
                    </mat-form-field>
                    <div class="review__form-actions">
                      <button mat-button type="button" (click)="showInterviewForm.set(false)">Cancelar</button>
                      <button mat-flat-button type="submit" [disabled]="interviewForm.invalid">
                        Confirmar Entrevista
                      </button>
                    </div>
                  </form>
                }

                <!-- Reject form -->
                @if (showRejectForm()) {
                  <form [formGroup]="rejectForm" class="review__inline-form" (ngSubmit)="reject()">
                    <mat-divider />
                    <h4>Razón de Rechazo</h4>
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Razón</mat-label>
                      <textarea matInput formControlName="reason" rows="3"
                                placeholder="Explica brevemente la razón del rechazo..."></textarea>
                      <mat-error>La razón es obligatoria</mat-error>
                    </mat-form-field>
                    <div class="review__form-actions">
                      <button mat-button type="button" (click)="showRejectForm.set(false)">Cancelar</button>
                      <button mat-flat-button class="action--reject" type="submit"
                              [disabled]="rejectForm.invalid">
                        Confirmar Rechazo
                      </button>
                    </div>
                  </form>
                }
              </mat-card-content>
            </mat-card>

            <!-- Deliverables tab (in_progress) -->
            @if (app.status === ApplicationStatus.IN_PROGRESS || app.status === ApplicationStatus.COMPLETED) {
              <mat-card>
                <mat-card-content>
                  <h3>Entregables</h3>
                  @if (app.deliverables && app.deliverables.length > 0) {
                    @for (del of app.deliverables; track del.id; let i = $index) {
                      <div class="review__deliverable">
                        <div class="review__deliverable-header">
                          <span class="review__deliverable-title">#{{ i + 1 }} — {{ del.title }}</span>
                          <span class="review__deliverable-status"
                                [class]="'del-status--' + del.status">
                            {{ deliverableStatusLabel(del.status) }}
                          </span>
                        </div>
                        <span class="review__deliverable-due">
                          Límite: {{ del.dueDate | date:'d MMM yyyy' }}
                        </span>
                        @if (del.grade != null) {
                          <span class="review__deliverable-grade">Nota: {{ del.grade }}/5</span>
                        }
                        @if (del.status === 'submitted') {
                          <div class="review__deliverable-review">
                            <h5>Revisar Entregable</h5>
                            <mat-form-field appearance="outline" class="full-width">
                              <mat-label>Comentario</mat-label>
                              <textarea matInput [(ngModel)]="reviewFeedback" rows="2"></textarea>
                            </mat-form-field>
                            <div class="review__form-row">
                              <label>Nota: {{ reviewGrade() }}/5</label>
                              <mat-slider min="1" max="5" step="1" discrete>
                                <input matSliderThumb [value]="reviewGrade()"
                                       (valueChange)="reviewGrade.set($event)" />
                              </mat-slider>
                            </div>
                            <div class="review__form-actions">
                              <button mat-stroked-button
                                      (click)="reviewDeliverable(app.id, del.id, 'rejected')">
                                Rechazar
                              </button>
                              <button mat-flat-button
                                      (click)="reviewDeliverable(app.id, del.id, 'approved')">
                                Aprobar
                              </button>
                            </div>
                          </div>
                        }
                        @if ($index < app.deliverables!.length - 1) {
                          <mat-divider />
                        }
                      </div>
                    }
                  } @else {
                    <p class="review__empty">No hay entregables asignados aún.</p>
                  }
                </mat-card-content>
              </mat-card>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    :host { display: block; padding: 24px; max-width: 1200px; margin: 0 auto; }

    .review__back { margin-bottom: 16px; }

    .review__header-card {
      margin-bottom: 24px;

      h1 {
        font-size: 1.5rem;
        font-weight: 700;
        margin: 0 0 8px;
        color: var(--mat-sys-on-surface);
      }
    }

    .review__header {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .review__content {
      display: grid;
      grid-template-columns: 380px 1fr;
      gap: 24px;

      @media (max-width: 900px) {
        grid-template-columns: 1fr;
      }
    }

    .review__student-card {
      h2 {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 1.125rem;
        font-weight: 600;
        margin: 0 0 16px;
      }

      h3 {
        font-size: 0.9375rem;
        font-weight: 600;
        margin: 12px 0 8px;
      }

      mat-divider { margin: 16px 0; }
    }

    .review__student-info {
      display: flex;
      flex-direction: column;
    }

    .review__info-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 0.875rem;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
      &:last-child { border-bottom: none; }
    }

    .review__label {
      color: var(--mat-sys-on-surface-variant);
      font-weight: 500;
    }

    .review__bio {
      font-size: 0.8125rem;
      color: var(--mat-sys-on-surface-variant);
      line-height: 1.5;
    }

    .review__student-links {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 16px;
    }

    .review__right {
      display: flex;
      flex-direction: column;
      gap: 16px;

      h3 {
        font-size: 1rem;
        font-weight: 600;
        margin: 0 0 12px;
      }
    }

    .review__cover-letter {
      font-size: 0.875rem;
      line-height: 1.6;
      color: var(--mat-sys-on-surface-variant);
      white-space: pre-line;
    }

    .review__applied-date {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8125rem;
      color: var(--mat-sys-on-surface-variant);
      margin-top: 12px;

      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }

    .review__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .action--accept {
      background-color: #2e7d32 !important;
      color: white !important;
    }

    .action--reject {
      color: #c62828 !important;
      border-color: #c62828 !important;
    }

    .review__inline-form {
      margin-top: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;

      h4 {
        font-size: 0.9375rem;
        font-weight: 600;
        margin: 8px 0 0;
      }

      mat-divider { margin: 4px 0; }
    }

    .review__form-row {
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;

      mat-form-field { flex: 1; min-width: 160px; }
    }

    .review__form-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }

    .full-width { width: 100%; }

    .review__deliverable {
      margin-bottom: 16px;
    }

    .review__deliverable-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }

    .review__deliverable-title {
      font-weight: 600;
      font-size: 0.9375rem;
    }

    .review__deliverable-status {
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

    .review__deliverable-due,
    .review__deliverable-grade {
      font-size: 0.8125rem;
      color: var(--mat-sys-on-surface-variant);
    }

    .review__deliverable-grade {
      font-weight: 600;
      color: var(--mat-sys-primary);
      margin-left: 12px;
    }

    .review__deliverable-review {
      margin-top: 12px;
      padding: 12px;
      background: var(--mat-sys-surface-variant);
      border-radius: 8px;

      h5 {
        font-size: 0.875rem;
        font-weight: 600;
        margin: 0 0 8px;
      }
    }

    .review__empty {
      text-align: center;
      color: var(--mat-sys-on-surface-variant);
      padding: 16px;
    }
  `,
})
export class ApplicationReviewComponent {
  readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly applicationService = inject(ApplicationService);

  readonly id = input.required<string>();
  readonly ApplicationStatus = ApplicationStatus;

  readonly showInterviewForm = signal(false);
  readonly showRejectForm = signal(false);
  readonly reviewGrade = signal(3);
  reviewFeedback = '';

  readonly interviewForm = this.fb.nonNullable.group({
    scheduledAt: ['', Validators.required],
    durationMinutes: [60, [Validators.required, Validators.min(15)]],
    modality: ['virtual', Validators.required],
    meetingUrl: [''],
    notes: [''],
  });

  readonly rejectForm = this.fb.nonNullable.group({
    reason: ['', Validators.required],
  });

  readonly applicationResource = httpResource<ApiResponse<Application>>(
    () => ({ url: `${environment.apiUrl}/applications/${this.id()}` }),
  );

  readonly application = computed(() =>
    this.applicationResource.value()?.data,
  );

  readonly studentSkillNames = computed(() =>
    this.application()?.student?.skills.map((s) => s.name) ?? [],
  );

  readonly canScheduleInterview = computed(() => {
    const s = this.application()?.status;
    return s === ApplicationStatus.PENDING ||
           s === ApplicationStatus.UNDER_REVIEW;
  });

  readonly canAccept = computed(() => {
    const s = this.application()?.status;
    return s === ApplicationStatus.PENDING ||
           s === ApplicationStatus.UNDER_REVIEW ||
           s === ApplicationStatus.INTERVIEW;
  });

  readonly canReject = computed(() => {
    const s = this.application()?.status;
    return s !== ApplicationStatus.REJECTED &&
           s !== ApplicationStatus.COMPLETED &&
           s !== ApplicationStatus.CANCELLED &&
           s !== ApplicationStatus.WITHDRAWN;
  });

  accept(): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Aceptar Aplicación',
        message: '¿Estás seguro de que deseas aceptar esta aplicación? El estudiante será notificado.',
        confirmText: 'Aceptar',
        type: 'info',
      } satisfies ConfirmDialogData,
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.applicationService.changeStatus(this.id(), ApplicationStatus.ACCEPTED).subscribe({
          next: () => {
            this.snackBar.open('Aplicación aceptada', 'OK', { duration: 3000 });
            this.applicationResource.reload();
          },
          error: () => this.snackBar.open('Error al aceptar', 'Cerrar', { duration: 4000 }),
        });
      }
    });
  }

  reject(): void {
    if (this.rejectForm.invalid) return;
    const { reason } = this.rejectForm.getRawValue();

    this.applicationService.changeStatus(this.id(), ApplicationStatus.REJECTED, reason).subscribe({
      next: () => {
        this.snackBar.open('Aplicación rechazada', 'OK', { duration: 3000 });
        this.showRejectForm.set(false);
        this.applicationResource.reload();
      },
      error: () => this.snackBar.open('Error al rechazar', 'Cerrar', { duration: 4000 }),
    });
  }

  scheduleInterview(): void {
    if (this.interviewForm.invalid) return;
    const data = this.interviewForm.getRawValue();

    this.applicationService.scheduleInterview(this.id(), {
      scheduledAt: data.scheduledAt,
      durationMinutes: data.durationMinutes,
      meetingUrl: data.meetingUrl || undefined,
      notes: data.notes || undefined,
    }).subscribe({
      next: () => {
        this.snackBar.open('Entrevista programada', 'OK', { duration: 3000 });
        this.showInterviewForm.set(false);
        this.applicationResource.reload();
      },
      error: () => this.snackBar.open('Error al programar entrevista', 'Cerrar', { duration: 4000 }),
    });
  }

  reviewDeliverable(applicationId: string, deliverableId: string, status: string): void {
    this.applicationService.reviewDeliverable(applicationId, deliverableId, {
      status,
      grade: this.reviewGrade(),
      feedback: this.reviewFeedback,
    }).subscribe({
      next: () => {
        this.snackBar.open('Entregable revisado', 'OK', { duration: 3000 });
        this.reviewFeedback = '';
        this.reviewGrade.set(3);
        this.applicationResource.reload();
      },
      error: () => this.snackBar.open('Error al revisar entregable', 'Cerrar', { duration: 4000 }),
    });
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
}
