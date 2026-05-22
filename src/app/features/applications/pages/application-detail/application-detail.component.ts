import {
  Component, ChangeDetectionStrategy, inject, input, computed, signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DatePipe } from '@angular/common';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state.component';

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
    SkeletonComponent, FileUploadComponent, EmptyStateComponent,
  ],
  templateUrl: './application-detail.component.html',
  styleUrl: './application-detail.component.scss',
})
export class ApplicationDetailComponent {
  readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly applicationService = inject(ApplicationService);

  readonly id = input.required<string>();
  readonly ApplicationStatus = ApplicationStatus;
  readonly submitting = signal(false);

  readonly applicationResource = rxResource({
    params: () => this.id(),
    stream: ({ params: id }) => this.applicationService.getById(id).pipe(
      switchMap(app => {
        if (!app) return of(app);
        return this.applicationService.enrichApplication(app);
      })
    )
  });

  readonly application = computed(() =>
    this.applicationResource.value() as Application | undefined,
  );

  readonly canWithdraw = computed(() => {
    const s = this.application()?.status;
    return s === ApplicationStatus.PENDING || s === ApplicationStatus.UNDER_REVIEW;
  });
  
  readonly nextInterview = computed(() => {
    const interviews = this.application()?.interviews ?? [];
    const now = new Date();
    const scheduled = interviews.filter(i => 
      i.status === 'scheduled' && new Date(i.scheduledAt) > now
    );
    if (scheduled.length === 0) return null;
    
    // Sort by date and take the first one
    return [...scheduled].sort((a, b) => 
      new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    )[0];
  });

  readonly timelineEvents = computed<TimelineEvent[]>(() => {
    const app = this.application();
    if (!app) return [];

    return (app.timeline ?? []).map((t) => {
      let actorName = t.changedByUserId;
      // Replace UUID-like IDs with readable labels
      if (!actorName || actorName === app.studentId) {
        // @ts-ignore
        const user = app.student?.user;
        actorName = user?.firstName ? `${user.firstName} ${user.lastName}` : 'Estudiante';
      } else if (actorName === 'system') {
        actorName = 'Sistema';
      } else {
        // Company user — use supervisor or company name from enriched project
        actorName = app.project?.supervisorName || app.project?.companyName || 'Empresa';
      }

      return {
        date: t.createdAt,
        title: this.getTimelineTitle(t.toStatus),
        description: `Por: ${actorName}`,
        icon: this.getTimelineIcon(t.toStatus),
      };
    });
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

  private getTimelineIcon(toStatus: string): string {
    const icons: Record<string, string> = {
      pending: 'send',
      under_review: 'visibility',
      shortlisted: 'star',
      interview: 'event',
      accepted: 'check_circle',
      rejected: 'cancel',
      withdrawn: 'undo',
      in_progress: 'play_circle',
      completed: 'task_alt',
      cancelled: 'block',
    };
    return icons[toStatus] ?? 'circle';
  }

  private getTimelineTitle(toStatus: string): string {
    const titles: Record<string, string> = {
      pending: 'Aplicación enviada',
      under_review: 'Aplicación en revisión',
      shortlisted: 'Preseleccionado',
      interview: 'Entrevista programada',
      accepted: 'Aplicación aceptada',
      rejected: 'Aplicación rechazada',
      withdrawn: 'Aplicación retirada',
      in_progress: 'Proyecto en progreso',
      completed: 'Proyecto completado',
      cancelled: 'Aplicación cancelada',
    };
    return titles[toStatus] ?? toStatus;
  }
}
