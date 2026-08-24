import { Component, ChangeDetectionStrategy, input, inject, signal, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DatePipe } from '@angular/common';
import { Subject, forkJoin, of } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { statusLabel as registryLabel } from '../../../../core/status/status-registry';

import { FacultyService, AssignmentDetail, Deliverable, EvaluationItem } from '../../services/faculty.service';
import { StatusBadgeComponent } from '../../../../shared/components/ui/status-badge/status-badge.component';
import { SkeletonComponent } from '../../../../shared/components/ui/skeleton/skeleton.component';
import { StarRatingComponent } from '../../../../shared/components/ui/star-rating/star-rating.component';
import { FileLinkComponent } from '../../../../shared/components/ui/file-link/file-link.component';
import { ApplicationService, AcademicSubmission, SubmissionHistoryItem, ProgressData } from '../../../applications/services/application.service';
import { ProgressBarComponent } from '../../../../shared/components/academic/progress-bar/progress-bar.component';

@Component({
  selector: 'app-student-supervision',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink, MatIconModule, MatButtonModule, MatCardModule,
    MatTabsModule, MatChipsModule, MatFormFieldModule, MatInputModule,
    MatSliderModule, MatSnackBarModule, DatePipe,
    StatusBadgeComponent, SkeletonComponent, StarRatingComponent, ProgressBarComponent, FileLinkComponent,
  ],
  templateUrl: './student-supervision.component.html',
  styleUrl: './student-supervision.component.scss',
})
export class StudentSupervisionComponent implements OnDestroy {
  readonly applicationId = input.required<string>();
  readonly router = inject(Router);
  private readonly facultyService = inject(FacultyService);
  private readonly applicationService = inject(ApplicationService);
  private readonly destroy$ = new Subject<void>();

  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly detail = signal<AssignmentDetail | null>(null);
  readonly deliverables = signal<Deliverable[]>([]);
  readonly evaluations = signal<EvaluationItem[]>([]);
  readonly reviewGrade = signal(3);
  readonly reviewFeedback = signal('');

  readonly progress = signal<ProgressData | null>(null);
  readonly anteproyecto = signal<AcademicSubmission | null>(null);
  readonly anteproyectoHistory = signal<SubmissionHistoryItem[]>([]);
  readonly anteproyectoComment = signal('');
  readonly anteproyectoLoading = signal(false);

  private readonly snackBar = inject(MatSnackBar);

  constructor() {
    this.loadAssignment();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAssignment(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.facultyService.getMyStudents({ limit: 100 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const assignment = response.data.find(a => a.applicationId === this.applicationId());
          if (!assignment) {
            this.error.set('No se encontró la asignación para este estudiante.');
            this.isLoading.set(false);
            return;
          }
          this.loadDetail(assignment.id);
        },
        error: () => {
          this.error.set('Error al cargar la información del estudiante.');
          this.isLoading.set(false);
        },
      });
  }

  private loadDetail(assignmentId: string): void {
    forkJoin({
      detail: this.facultyService.getAssignmentDetail(assignmentId).pipe(catchError(() => of(null))),
      deliverables: this.facultyService.getDeliverables(this.applicationId()).pipe(catchError(() => of([]))),
      evaluations: this.facultyService.getEvaluationsByApplication(this.applicationId()).pipe(catchError(() => of([]))),
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (result) => {
        if (!result.detail) {
          this.error.set('No se encontró la asignación para este estudiante.');
          this.isLoading.set(false);
          return;
        }
        this.detail.set(result.detail);
        this.deliverables.set(result.deliverables);
        this.evaluations.set(result.evaluations);
        this.isLoading.set(false);
        this.loadAnteproyecto();
        this.loadProgress();
      },
      error: () => {
        this.error.set('Error al cargar los detalles del estudiante.');
        this.isLoading.set(false);
      },
    });
  }

  loadProgress(): void {
    this.applicationService.getProgress(this.applicationId())
      .pipe(catchError(() => of(null)), takeUntil(this.destroy$))
      .subscribe((p) => this.progress.set(p));
  }

  loadAnteproyecto(): void {
    this.applicationService.getAnteproyecto(this.applicationId())
      .pipe(catchError(() => of(null)), takeUntil(this.destroy$))
      .subscribe((submission) => {
        this.anteproyecto.set(submission);
        if (submission) {
          this.applicationService.getAnteproyectoHistory(this.applicationId())
            .pipe(catchError(() => of([])), takeUntil(this.destroy$))
            .subscribe((h) => this.anteproyectoHistory.set(h));
        }
      });
  }

  submitAsesorComment(): void {
    const comment = this.anteproyectoComment().trim();
    if (!comment) return;
    this.anteproyectoLoading.set(true);
    this.applicationService.addAsesorComment(this.applicationId(), comment).subscribe({
      next: () => {
        this.anteproyectoComment.set('');
        this.anteproyectoLoading.set(false);
        this.snackBar.open('Comentario agregado', 'OK', { duration: 2500 });
        this.loadAnteproyecto();
      },
      error: () => {
        this.anteproyectoLoading.set(false);
        this.snackBar.open('Error al comentar', 'Cerrar', { duration: 4000 });
      },
    });
  }

  reviewAnteproyecto(action: 'correction' | 'approve' | 'reject'): void {
    const comment = this.anteproyectoComment().trim();
    if ((action === 'correction' || action === 'reject') && !comment) {
      this.snackBar.open('Se requiere un comentario', 'Cerrar', { duration: 3000 });
      return;
    }
    this.anteproyectoLoading.set(true);
    this.applicationService.reviewAnteproyecto(this.applicationId(), action, comment || undefined).subscribe({
      next: () => {
        this.anteproyectoComment.set('');
        this.anteproyectoLoading.set(false);
        this.snackBar.open('Anteproyecto revisado', 'OK', { duration: 2500 });
        this.loadAnteproyecto();
      },
      error: (err) => {
        this.anteproyectoLoading.set(false);
        this.snackBar.open(err?.error?.message ?? 'Error al revisar', 'Cerrar', { duration: 4000 });
      },
    });
  }

  anteproyectoStatusLabel(status: string): string {
    return registryLabel('submission', status);
  }

  statusLabel(status: string): string {
    return registryLabel('assignment', status);
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

  evalTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      company_evaluates_student: 'Empresa → Estudiante',
      student_evaluates_company: 'Estudiante → Empresa',
      supervisor_evaluates_student: 'Asesor → Estudiante',
      student_evaluates_supervisor: 'Estudiante → Asesor',
      self_evaluation: 'Autoevaluación',
    };
    return labels[type] ?? type;
  }

  reviewDeliverable(appId: string, delId: string, status: 'approved' | 'rejected' | 'needs_revision'): void {
    if (status === 'rejected' && (!this.reviewFeedback() || !this.reviewFeedback().trim())) {
      this.snackBar.open('El comentario es obligatorio para rechazar el entregable', 'Cerrar', { duration: 4000 });
      return;
    }
    this.facultyService.reviewDeliverable(appId, delId, status, {
      grade: this.reviewGrade(),
      feedback: this.reviewFeedback().trim() || undefined,
    }).subscribe({
      next: () => {
        this.snackBar.open('Entregable revisado', 'OK', { duration: 3000 });
        this.reviewFeedback.set('');
        this.reviewGrade.set(3);
        this.loadAssignment();
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'Error al revisar entregable';
        this.snackBar.open(Array.isArray(msg) ? msg.join('; ') : msg, 'Cerrar', { duration: 4000 });
      },
    });
  }
}