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
import { DatePipe } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { FacultyService, EnrichedAssignment } from '../../../faculty/services/faculty.service';
import { NotificationsStore } from '../../../../state/notifications.store';
import { StatCardComponent } from '../../../../shared/components/ui/stat-card/stat-card.component';
import { StatusBadgeComponent } from '../../../../shared/components/ui/status-badge/status-badge.component';
import { SkeletonComponent } from '../../../../shared/components/ui/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state.component';
import { RelativeTimePipe } from '../../../../shared/pipes';

import { RouterLink } from '@angular/router';
import { AuthStore } from '../../../../state/auth.store';

@Component({
  selector: 'app-faculty-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    MatCardModule, MatIconModule, MatButtonModule,
    StatCardComponent, StatusBadgeComponent, SkeletonComponent,
    EmptyStateComponent, RelativeTimePipe,
  ],
  templateUrl: './faculty-dashboard.component.html',
  styleUrl: './faculty-dashboard.component.scss',
})
export class FacultyDashboardComponent implements OnDestroy {
  readonly router = inject(Router);
  readonly authStore = inject(AuthStore);
  private readonly facultyService = inject(FacultyService);
  readonly notificationsStore = inject(NotificationsStore);

  readonly userInitials = computed(() => {
    const p = this.authStore.profile();
    if (p?.firstName && p?.lastName) {
      return `${p.firstName[0]}${p.lastName[0]}`.toUpperCase();
    }
    return 'D';
  });
  private readonly destroy$ = new Subject<void>();

  readonly isLoading = signal(true);
  readonly assignments = signal<EnrichedAssignment[]>([]);
  readonly totalCount = signal(0);

  readonly activeCount = computed(() =>
    this.assignments().filter(a => a.status === 'active').length
  );

  readonly completedCount = computed(() =>
    this.assignments().filter(a => a.status === 'completed').length
  );

  constructor() {
    this.loadAssignments();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAssignments(): void {
    this.isLoading.set(true);
    this.facultyService.getMyStudentsEnriched({ limit: 100 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.assignments.set(response.data);
          this.totalCount.set(response.total);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  navigateToStudent(applicationId: string): void {
    this.router.navigate(['/my-students', applicationId]);
  }
}