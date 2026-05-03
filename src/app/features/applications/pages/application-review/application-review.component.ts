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
  templateUrl: './application-review.component.html',
  styleUrl: './application-review.component.scss',
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

  readonly applicationResource = httpResource<Application>(
    () => ({ url: `${environment.apiUrl}/applications/${this.id()}` }),
  );

  readonly application = computed(() =>
    this.applicationResource.value(),
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
