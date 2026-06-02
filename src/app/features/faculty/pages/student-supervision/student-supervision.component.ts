import { Component, ChangeDetectionStrategy, input, inject, signal, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { DatePipe } from '@angular/common';
import { Subject, forkJoin, of } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';

import { FacultyService, AssignmentDetail, Deliverable, EvaluationItem } from '../../services/faculty.service';
import { StatusBadgeComponent } from '../../../../shared/components/ui/status-badge/status-badge.component';
import { SkeletonComponent } from '../../../../shared/components/ui/skeleton/skeleton.component';
import { StarRatingComponent } from '../../../../shared/components/ui/star-rating/star-rating.component';

@Component({
  selector: 'app-student-supervision',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink, MatIconModule, MatButtonModule, MatCardModule,
    MatTabsModule, MatChipsModule, DatePipe,
    StatusBadgeComponent, SkeletonComponent, StarRatingComponent,
  ],
  templateUrl: './student-supervision.component.html',
  styleUrl: './student-supervision.component.scss',
})
export class StudentSupervisionComponent implements OnDestroy {
  readonly applicationId = input.required<string>();
  readonly router = inject(Router);
  private readonly facultyService = inject(FacultyService);
  private readonly destroy$ = new Subject<void>();

  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly detail = signal<AssignmentDetail | null>(null);
  readonly deliverables = signal<Deliverable[]>([]);
  readonly evaluations = signal<EvaluationItem[]>([]);

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
      },
      error: () => {
        this.error.set('Error al cargar los detalles del estudiante.');
        this.isLoading.set(false);
      },
    });
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: 'Activo',
      completed: 'Completado',
      transferred: 'Transferido',
    };
    return labels[status] ?? status;
  }

  deliverableStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      submitted: 'Entregado',
      approved: 'Aprobado',
      rejected: 'Rechazado',
      needs_revision: 'Solicita revisión',
    };
    return labels[status] ?? status;
  }
}