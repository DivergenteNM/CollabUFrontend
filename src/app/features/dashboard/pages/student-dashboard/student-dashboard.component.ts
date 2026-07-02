import {
  Component, ChangeDetectionStrategy, inject, computed,
} from '@angular/core';
import { Router } from '@angular/router';
import { httpResource } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { environment } from '../../../../../environments/environment';
import { ApiResponse, PaginatedResponse, StudentProfile, Recommendation, Application, normalizeApiResponse } from '../../../../core/models';
import { NotificationsStore } from '../../../../state/notifications.store';
import { StatCardComponent } from '../../../../shared/components/ui/stat-card/stat-card.component';
import { ProjectCardComponent } from '../../../../shared/components/cards/project-card/project-card.component';
import { StatusBadgeComponent } from '../../../../shared/components/ui/status-badge/status-badge.component';
import { MatchScoreBarComponent } from '../../../../shared/components/ui/match-score-bar/match-score-bar.component';
import { SkeletonComponent } from '../../../../shared/components/ui/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state.component';
import { RelativeTimePipe } from '../../../../shared/pipes';

@Component({
  selector: 'app-student-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule, MatIconModule, MatButtonModule,
    StatCardComponent, ProjectCardComponent, StatusBadgeComponent,
    MatchScoreBarComponent, SkeletonComponent, EmptyStateComponent,
    RelativeTimePipe,
  ],
  templateUrl: './student-dashboard.component.html',
  styleUrl: './student-dashboard.component.scss',
})
export class StudentDashboardComponent {
  readonly router = inject(Router);
  readonly notificationsStore = inject(NotificationsStore);

  // --- httpResource data loading ---
  readonly profileResource = httpResource<any>(
    () => ({ url: `${environment.apiUrl}/students/profile` })
  );

  readonly recommendationsResource = httpResource<PaginatedResponse<Recommendation>>(
    () => ({ url: `${environment.apiUrl}/matching/recommendations`, params: { limit: '3' } }),
  );

  readonly applicationsResource = httpResource<PaginatedResponse<Application>>(
    () => ({ url: `${environment.apiUrl}/applications/my`, params: { limit: '5' } }),
  );

  // --- Computed signals from resources ---
  readonly profile = computed(() => {
    const val = this.profileResource.value();
    return val ? normalizeApiResponse<StudentProfile>(val).data : null;
  });

  readonly profileCompleteness = computed(() => this.profile()?.profileCompleteness ?? 0);

  readonly practiceHoursLabel = computed(() => {
    const p = this.profile();
    if (!p) return '0/0h';
    const completed = p.practiceHoursCompleted ?? 0;
    const required = p.practiceHoursRequired ?? 0;
    return `${completed}/${required}h`;
  });

  readonly recommendations = computed(() =>
    this.recommendationsResource.value()?.data ?? []
  );

  readonly recommendationsCount = computed(() =>
    this.recommendationsResource.value()?.meta?.total ?? 0
  );

  readonly applications = computed(() =>
    this.applicationsResource.value()?.data ?? []
  );

  readonly activeApplicationsCount = computed(() =>
    this.applicationsResource.value()?.meta?.total ?? 0
  );
}
