import {
  Component, ChangeDetectionStrategy, inject, computed,
} from '@angular/core';
import { Router } from '@angular/router';
import { httpResource } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { environment } from '../../../../../environments/environment';
import { PaginatedResponse } from '../../../../core/models';
import { ApplicationStatus } from '../../../../core/enums';
import { NotificationsStore } from '../../../../state/notifications.store';
import { StatCardComponent } from '../../../../shared/components/ui/stat-card/stat-card.component';
import { StatusBadgeComponent } from '../../../../shared/components/ui/status-badge/status-badge.component';
import { SkeletonComponent } from '../../../../shared/components/ui/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state.component';
import { RelativeTimePipe } from '../../../../shared/pipes';

/** Represents a supervised student as returned by the faculty endpoint */
export interface AssignedStudentSummary {
  applicationId: string;
  studentName: string;
  studentCode: string;
  program: string;
  companyName: string;
  projectTitle: string;
  status: ApplicationStatus;
  progressPercent: number;
  practiceHoursCompleted: number;
  practiceHoursRequired: number;
  pendingEvaluation: boolean;
}

@Component({
  selector: 'app-faculty-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule, MatIconModule, MatButtonModule, MatProgressBarModule,
    StatCardComponent, StatusBadgeComponent, SkeletonComponent,
    EmptyStateComponent, RelativeTimePipe,
  ],
  templateUrl: './faculty-dashboard.component.html',
  styleUrl: './faculty-dashboard.component.scss',
})
export class FacultyDashboardComponent {
  readonly router = inject(Router);
  readonly notificationsStore = inject(NotificationsStore);

  // --- httpResource data loading ---
  readonly studentsResource = httpResource<PaginatedResponse<AssignedStudentSummary>>(
    () => ({ url: `${environment.apiUrl}/faculty/assigned-students` }),
  );

  // --- Computed signals from resources ---
  readonly students = computed(() =>
    this.studentsResource.value()?.data ?? []
  );

  readonly assignedCount = computed(() =>
    this.studentsResource.value()?.meta?.total ?? 0
  );

  readonly pendingEvaluationsCount = computed(() =>
    this.students().filter(s => s.pendingEvaluation).length
  );

  readonly avgProgress = computed(() => {
    const list = this.students();
    if (list.length === 0) return 0;
    const total = list.reduce((sum, s) => sum + s.progressPercent, 0);
    return Math.round(total / list.length);
  });
}
