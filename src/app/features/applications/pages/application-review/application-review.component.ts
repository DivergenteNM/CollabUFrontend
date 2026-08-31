import {
  Component, ChangeDetectionStrategy, inject, input, computed, signal, effect, PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { statusLabel as registryLabel } from '../../../../core/status/status-registry';
import { httpResource } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DatePipe, DecimalPipe } from '@angular/common';

import { environment } from '../../../../../environments/environment';
import { ApiResponse, Application, Interview } from '../../../../core/models';
import { FileUploadComponent } from '../../../../shared/components/ui/file-upload/file-upload.component';
import { FileLinkComponent } from '../../../../shared/components/ui/file-link/file-link.component';
import { ApplicationStatus } from '../../../../core/enums';
import { ApplicationService } from '../../services/application.service';
import { ChatService } from '../../../chat/services/chat.service';
import { ApplicationProgressStepperComponent } from '../../../../shared/components/ui/application-progress-stepper/application-progress-stepper.component';
import { StatusBadgeComponent } from '../../../../shared/components/ui/status-badge/status-badge.component';
import { MatchScoreCardComponent } from '../../../../shared/components/cards/match-score-card/match-score-card.component';
import { SkillChipListComponent } from '../../../../shared/components/ui/skill-chip-list/skill-chip-list.component';
import { SkeletonComponent } from '../../../../shared/components/ui/skeleton/skeleton.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../shared/components/ui/confirm-dialog/confirm-dialog.component';
import { CreateDeliverableDialogComponent } from '../../components/create-deliverable-dialog/create-deliverable-dialog.component';
import { DocumentsPanelComponent } from '../../../../shared/components/academic/documents-panel/documents-panel.component';
import { ProgressBarComponent } from '../../../../shared/components/academic/progress-bar/progress-bar.component';

@Component({
  selector: 'app-application-review',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule, FormsModule,
    MatCardModule, MatTabsModule, MatIconModule, MatButtonModule, MatChipsModule,
    MatDividerModule, MatDialogModule, MatSnackBarModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatDatepickerModule, MatSliderModule, DatePipe, DecimalPipe,
    MatProgressSpinnerModule,
    ApplicationProgressStepperComponent, StatusBadgeComponent, MatchScoreCardComponent,
    SkillChipListComponent, SkeletonComponent, CreateDeliverableDialogComponent, FileUploadComponent,
    FileLinkComponent, DocumentsPanelComponent, ProgressBarComponent,
  ],
  templateUrl: './application-review.component.html',
  styleUrl: './application-review.component.scss',
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' },
  ],
})
export class ApplicationReviewComponent {
  readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly applicationService = inject(ApplicationService);
  private readonly chatService = inject(ChatService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly id = input.required<string>();
  readonly ApplicationStatus = ApplicationStatus;

  readonly showInterviewForm = signal(false);
  readonly showRejectForm = signal(false);
  readonly reviewGrade = signal(3);
  readonly loadingChat = signal(false);
  readonly savingNotes = signal(false);
  readonly notesText = signal('');
  readonly resolvingInterviewId = signal<string | null>(null);
  readonly resolutionChoice = signal<'passed' | 'failed'>('passed');
  resolutionComment = '';
  readonly briefFormInterviewId = signal<string | null>(null);
  technicalTaskDescription = '';
  technicalTaskDueDate = '';
  reviewFeedback = '';

  readonly interviewForm = this.fb.nonNullable.group({
    scheduledDate: [null as Date | null, Validators.required],
    scheduledTime: ['09:00', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2]):[0-5][0-9]$/)]],
    scheduledPeriod: ['AM' as 'AM' | 'PM', Validators.required],
    durationMinutes: [60, [Validators.required, Validators.min(15)]],
    modality: ['virtual', Validators.required],
    meetingUrl: [''],
  });

  readonly rejectForm = this.fb.nonNullable.group({
    reason: ['', Validators.required],
  });

  readonly applicationResource = rxResource({
    params: () => this.id(),
    stream: ({ params: id }) => {
      if (!isPlatformBrowser(this.platformId)) {
        return of(undefined);
      }
      return this.applicationService.getById(id).pipe(
        switchMap(app => {
          if (!app) return of(app);
          return this.applicationService.enrichApplication(app);
        })
      );
    }
  });

  readonly application = computed(() =>
    this.applicationResource.value() as Application | undefined,
  );

  readonly progressResource = rxResource({
    params: () => this.id(),
    stream: ({ params: id }) => this.applicationService.getProgress(id).pipe(catchError(() => of(null))),
  });

  readonly contextResource = rxResource({
    params: () => this.id(),
    stream: ({ params: id }) => this.applicationService.getContext(id).pipe(catchError(() => of(null))),
  });

  readonly academicRecord = computed(() => this.contextResource.value()?.academicRecord ?? null);

  private notesSeeded = false;
  constructor() {
    effect(() => {
      const app = this.application();
      if (app && !this.notesSeeded) {
        this.notesText.set(app.notes ?? '');
        this.notesSeeded = true;
      }
    });
  }

  readonly studentSkillNames = computed(() =>
    this.application()?.student?.skills?.map((s: any) => s.name) ?? [],
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

  startChat(): void {
    const app = this.application();
    if (!app || !app.student?.userId || this.loadingChat()) return;

    this.loadingChat.set(true);
    this.chatService.createConversation([app.student.userId], 'direct', app.projectId).subscribe({
      next: (res: any) => {
        this.loadingChat.set(false);
        const conv = res?.data || res;
        if (conv?.id) {
          this.router.navigate(['/chat', conv.id]);
        }
      },
      error: () => {
        this.loadingChat.set(false);
        this.snackBar.open('Error al iniciar el chat', 'Cerrar', { duration: 4000 });
      },
    });
  }

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

  onTimePicked(event: Event): void {
    const time = (event.target as HTMLInputElement).value; // HH:mm (24h)
    if (!time) return;
    let [h, m] = time.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    const hh = h.toString().padStart(2, '0');
    const mm = m.toString().padStart(2, '0');
    this.interviewForm.patchValue({
      scheduledTime: `${hh}:${mm}`,
      scheduledPeriod: period
    });
  }

  scheduleInterview(): void {
    if (this.interviewForm.invalid) return;
    const data = this.interviewForm.getRawValue();

    // Combine date and time
    const date = new Date(data.scheduledDate!);
    let [hours, minutes] = data.scheduledTime.split(':').map(Number);
    
    if (data.scheduledPeriod === 'PM' && hours < 12) hours += 12;
    if (data.scheduledPeriod === 'AM' && hours === 12) hours = 0;
    
    date.setHours(hours, minutes, 0, 0);

    const interviewData: any = {
      scheduledAt: date.toISOString(),
      durationMinutes: Number(data.durationMinutes),
      interviewType:
        data.modality === 'virtual' ? 'video' :
        data.modality === 'phone' ? 'phone' :
        data.modality === 'technical' ? 'technical' : 'in_person',
    };

    if (data.modality === 'virtual' && data.meetingUrl) {
      let url = data.meetingUrl;
      if (!url.startsWith('http')) url = 'https://' + url;
      interviewData.meetingLink = url;
    } else if ((data.modality === 'presencial' || data.modality === 'technical') && data.meetingUrl) {
      interviewData.location = data.meetingUrl;
    }

    this.applicationService.scheduleInterview(this.id(), interviewData).subscribe({
      next: () => {
        this.snackBar.open('Entrevista programada', 'OK', { duration: 3000 });
        this.showInterviewForm.set(false);
        this.applicationResource.reload();
      },
      error: () => this.snackBar.open('Error al programar entrevista', 'Cerrar', { duration: 4000 }),
    });
  }

  reviewDeliverable(applicationId: string, deliverableId: string, status: 'approved' | 'rejected' | 'needs_revision'): void {
    if (status === 'rejected' && (!this.reviewFeedback || !this.reviewFeedback.trim())) {
      this.snackBar.open('El comentario es obligatorio para rechazar el entregable', 'Cerrar', { duration: 4000 });
      return;
    }
    this.applicationService.reviewDeliverable(applicationId, deliverableId, status, {
      grade: this.reviewGrade(),
      feedback: this.reviewFeedback.trim() || undefined,
    }).subscribe({
      next: () => {
        this.snackBar.open('Entregable revisado', 'OK', { duration: 3000 });
        this.reviewFeedback = '';
        this.reviewGrade.set(3);
        this.applicationResource.reload();
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'Error al revisar entregable';
        this.snackBar.open(Array.isArray(msg) ? msg.join('; ') : msg, 'Cerrar', { duration: 4000 });
      },
    });
  }

  deliverableStatusLabel(status: string): string {
    return registryLabel('deliverable', status);
  }

  saveNotes(): void {
    if (this.savingNotes()) return;
    this.savingNotes.set(true);
    this.applicationService.updateNotes(this.id(), this.notesText()).subscribe({
      next: () => {
        this.savingNotes.set(false);
        this.snackBar.open('Nota guardada', 'OK', { duration: 2000 });
      },
      error: () => {
        this.savingNotes.set(false);
        this.snackBar.open('Error al guardar la nota', 'Cerrar', { duration: 4000 });
      },
    });
  }

  toggleResolveForm(interview: Interview): void {
    this.resolvingInterviewId.set(this.resolvingInterviewId() === interview.id ? null : interview.id);
    this.resolutionChoice.set('passed');
    this.resolutionComment = '';
  }

  confirmResolveInterview(interview: Interview): void {
    this.applicationService.completeInterview(this.id(), interview.id, {
      resolution: this.resolutionChoice(),
      resolutionComment: this.resolutionComment || undefined,
    }).subscribe({
      next: () => {
        this.snackBar.open('Entrevista resuelta', 'OK', { duration: 3000 });
        this.resolvingInterviewId.set(null);
        this.applicationResource.reload();
      },
      error: () => this.snackBar.open('Error al resolver la entrevista', 'Cerrar', { duration: 4000 }),
    });
  }

  toggleBriefForm(interview: Interview): void {
    this.briefFormInterviewId.set(this.briefFormInterviewId() === interview.id ? null : interview.id);
    this.technicalTaskDescription = interview.technicalTaskDescription ?? '';
    this.technicalTaskDueDate = interview.technicalTaskDueDate ? interview.technicalTaskDueDate.substring(0, 10) : '';
  }

  saveBrief(interview: Interview, files: File[]): void {
    this.applicationService.setInterviewBrief(this.id(), interview.id, {
      file: files[0],
      description: this.technicalTaskDescription || undefined,
      dueDate: this.technicalTaskDueDate || undefined,
    }).subscribe({
      next: () => {
        this.snackBar.open('Prueba técnica actualizada', 'OK', { duration: 3000 });
        this.briefFormInterviewId.set(null);
        this.applicationResource.reload();
      },
      error: () => this.snackBar.open('Error al guardar la prueba técnica', 'Cerrar', { duration: 4000 }),
    });
  }

  interviewTypeLabel(type: string): string {
    return ({ phone: 'Telefónica', video: 'Video', in_person: 'Presencial', technical: 'Prueba técnica' } as Record<string, string>)[type] ?? type;
  }

  openCreateDeliverableDialog(): void {
    const app = this.application();
    if (!app) return;

    const dialogRef = this.dialog.open(CreateDeliverableDialogComponent, {
      width: '500px',
      data: { applicationId: app.id },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.applicationService.createDeliverable(app.id, result).subscribe({
          next: () => {
            this.snackBar.open('Entregable creado', 'OK', { duration: 3000 });
            this.applicationResource.reload();
          },
          error: () => this.snackBar.open('Error al crear entregable', 'Cerrar', { duration: 4000 }),
        });
      }
    });
  }
}
