import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnDestroy,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DatePipe } from '@angular/common';
import { Subject, forkJoin, of } from 'rxjs';
import { switchMap, map, catchError, takeUntil } from 'rxjs/operators';

import { SupervisorAssignmentItem, FacultyService, UserProfile } from '../../../faculty/services/faculty.service';
import { ApplicationStatus } from '../../../../core/enums';
import { NotificationsStore } from '../../../../state/notifications.store';
import { StatCardComponent } from '../../../../shared/components/ui/stat-card/stat-card.component';
import { StatusBadgeComponent } from '../../../../shared/components/ui/status-badge/status-badge.component';
import { SkeletonComponent } from '../../../../shared/components/ui/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state.component';
import { RelativeTimePipe } from '../../../../shared/pipes';

@Component({
  selector: 'app-faculty-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule, MatIconModule, MatButtonModule, MatProgressBarModule,
    DatePipe, StatCardComponent, StatusBadgeComponent, SkeletonComponent,
    EmptyStateComponent, RelativeTimePipe,
  ],
  templateUrl: './faculty-dashboard.component.html',
  styleUrl: './faculty-dashboard.component.scss',
})
export class FacultyDashboardComponent implements OnDestroy {
  readonly router = inject(Router);
  private readonly facultyService = inject(FacultyService);
  readonly notificationsStore = inject(NotificationsStore);
  private readonly destroy$ = new Subject<void>();

  readonly isLoading = signal(true);
  readonly assignments = signal<SupervisorAssignmentItem[]>([]);
  readonly studentNames = signal<Map<string, string>>(new Map());
  readonly totalCount = signal(0);

  readonly activeCount = computed(() =>
    this.assignments().filter(a => a.status === 'active').length
  );

  readonly completedCount = computed(() =>
    this.assignments().filter(a => a.status === 'completed').length
  );

  readonly currentPeriod = computed(() => {
    const periods = this.assignments()
      .filter(a => a.period?.isCurrent)
      .map(a => a.period.name);
    return periods.length > 0 ? periods[0] : null;
  });

  constructor() {
    this.loadAssignments();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAssignments(): void {
    this.isLoading.set(true);
    this.facultyService.getMyStudents({ limit: 100 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.assignments.set(response.data);
          this.totalCount.set(response.total);
          this.enrichStudentNames(response.data);
        },
        error: () => this.isLoading.set(false),
      });
  }

  private enrichStudentNames(items: SupervisorAssignmentItem[]): void {
    const uniqueIds = [...new Set(items.map(a => a.studentId))];
    if (uniqueIds.length === 0) {
      this.isLoading.set(false);
      return;
    }

    forkJoin(
      uniqueIds.map(id =>
        this.facultyService.getUserProfile(id).pipe(
          catchError(() => of(null)),
        )
      )
    ).pipe(takeUntil(this.destroy$)).subscribe({
      next: (profiles) => {
        const nameMap = new Map<string, string>();
        uniqueIds.forEach((id, i) => {
          const p = profiles[i] as UserProfile | null;
          if (p) {
            const name = p.displayName ?? (`${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || 'Estudiante');
            nameMap.set(id, name);
          } else {
            nameMap.set(id, 'Estudiante');
          }
        });
        this.studentNames.set(nameMap);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  getStudentName(studentId: string): string {
    return this.studentNames().get(studentId) ?? 'Estudiante';
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: 'Activo',
      completed: 'Completado',
      transferred: 'Transferido',
    };
    return labels[status] ?? status;
  }

  navigateToStudent(applicationId: string): void {
    this.router.navigate(['/my-students', applicationId]);
  }
}