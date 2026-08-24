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

import { Application } from '../../../../core/models';
import { ApplicationStatus } from '../../../../core/enums';
import { statusLabel as registryLabel } from '../../../../core/status/status-registry';
import { ApplicationService, Permission } from '../../services/application.service';
import { ChatService } from '../../../chat/services/chat.service';
import { ApplicationProgressStepperComponent } from '../../../../shared/components/ui/application-progress-stepper/application-progress-stepper.component';
import { TimelineComponent, TimelineEvent } from '../../../../shared/components/ui/timeline/timeline.component';
import { StatusBadgeComponent } from '../../../../shared/components/ui/status-badge/status-badge.component';
import { SkeletonComponent } from '../../../../shared/components/ui/skeleton/skeleton.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../shared/components/ui/confirm-dialog/confirm-dialog.component';
import { FileUploadComponent } from '../../../../shared/components/ui/file-upload/file-upload.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FileLinkComponent } from '../../../../shared/components/ui/file-link/file-link.component';
import { AnteproyectoPanelComponent } from '../../../../shared/components/academic/anteproyecto-panel/anteproyecto-panel.component';
import { DocumentsPanelComponent } from '../../../../shared/components/academic/documents-panel/documents-panel.component';
import { ProgressBarComponent } from '../../../../shared/components/academic/progress-bar/progress-bar.component';
import { catchError } from 'rxjs';

@Component({
  selector: 'app-application-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule, MatTabsModule, MatIconModule, MatButtonModule, MatDividerModule,
    MatDialogModule, MatSnackBarModule, DatePipe, MatProgressSpinnerModule,
    ApplicationProgressStepperComponent, TimelineComponent, StatusBadgeComponent,
    SkeletonComponent, FileUploadComponent, EmptyStateComponent, FileLinkComponent,
    AnteproyectoPanelComponent, DocumentsPanelComponent, ProgressBarComponent,
  ],
  templateUrl: './application-detail.component.html',
  styleUrl: './application-detail.component.scss',
})
export class ApplicationDetailComponent {
  readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly applicationService = inject(ApplicationService);
  private readonly chatService = inject(ChatService);

  readonly id = input.required<string>();
  readonly ApplicationStatus = ApplicationStatus;
  readonly submitting = signal(false);
  readonly loadingChat = signal(false);

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

  /**
   * Contexto del proyecto: permisos del visor, etapa académica y participantes.
   * Es la fuente de verdad para decidir qué mostrar; el estado de la postulación
   * por sí solo no describe el ciclo académico.
   */
  readonly contextResource = rxResource({
    params: () => this.id(),
    stream: ({ params: id }) => this.applicationService.getContext(id),
  });

  readonly context = computed(() => this.contextResource.value() ?? null);
  readonly academicRecord = computed(() => this.context()?.academicRecord ?? null);
  readonly pendingActions = computed(() => this.context()?.pendingActions ?? []);

  can(permission: Permission): boolean {
    return this.context()?.viewer.permissions.includes(permission) ?? false;
  }

  /**
   * El anteproyecto y los documentos obligatorios ocurren ANTES de `in_progress`.
   * Condicionar su visibilidad al estado de la postulación los ocultaba
   * justamente durante la fase en la que hay que entregarlos.
   */
  readonly showAcademicTab = computed(() => {
    const record = this.academicRecord();
    return !!record && record.status !== 'cancelled';
  });

  readonly showDeliverablesTab = computed(() => {
    const record = this.academicRecord();
    if (!record) return false;
    return ['active', 'waiting_final_docs', 'final_docs_review', 'waiting_sustentation', 'finalizing', 'completed']
      .includes(record.status);
  });

  readonly progressResource = rxResource({
    params: () => this.id(),
    stream: ({ params: id }) => this.applicationService.getProgress(id).pipe(catchError(() => of(null))),
  });

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
      rescheduled: 'Reprogramada',
      no_show: 'No asistió',
    };
    return labels[status] ?? status;
  }

  deliverableStatusLabel(status: string): string {
    return registryLabel('deliverable', status);
  }

  reviewerDisplay(del: any): string | null {
    if (!del) return null;
    const role = (del.reviewerRole || del.reviewedByRole || '').toLowerCase();
    const name = del.reviewerName;

    let roleLabel = '';
    if (role === 'company') {
      roleLabel = 'Empresa';
    } else if (
      role === 'faculty' ||
      role === 'faculty_supervisor' ||
      role === 'asesor' ||
      role === 'academic' ||
      role === 'jury'
    ) {
      roleLabel = 'Asesor';
    } else if (role === 'admin') {
      roleLabel = 'Administrador';
    } else if (role) {
      roleLabel = role;
    }

    if (name && roleLabel) {
      return `${name} (${roleLabel})`;
    } else if (name) {
      return name;
    } else if (roleLabel) {
      return roleLabel;
    }
    return null;
  }

  reviewStatusActionLabel(status: string): string | null {
    if (status === 'approved') return 'Aprobado';
    if (status === 'rejected') return 'Rechazado';
    if (status === 'needs_revision') return 'Corrección solicitada';
    return null;
  }

  startChat(): void {
    const app = this.application();
    const companyUserId = (app?.project as any)?.createdByUserId;
    if (!app || !companyUserId || this.loadingChat()) return;

    this.loadingChat.set(true);
    this.chatService.createConversation([companyUserId], 'direct', app.projectId).subscribe({
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
    const file = files[0];
    const title = file.name;

    this.applicationService.submitDeliverable(applicationId, {
      file,
      title,
      projectDeliverableId: deliverableId,
    }).subscribe({
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

  submitInterviewSolution(interviewId: string, files: File[]): void {
    if (!files.length) return;
    this.applicationService.setInterviewSolution(this.id(), interviewId, files[0]).subscribe({
      next: () => {
        this.snackBar.open('Solución subida correctamente', 'OK', { duration: 3000 });
        this.applicationResource.reload();
      },
      error: () => this.snackBar.open('Error al subir la solución', 'Cerrar', { duration: 4000 }),
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

  /** Recarga lo que depende del contexto tras una acción que cambia de etapa. */
  reloadAll(): void {
    this.applicationResource.reload();
    this.contextResource.reload();
    this.progressResource.reload();
  }
}
