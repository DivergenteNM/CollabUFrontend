import {
  Component, ChangeDetectionStrategy, inject, computed, PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { httpResource } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { environment } from '../../../../../environments/environment';
import { ApiResponse, PaginatedResponse, StudentProfile, RecommendationsPage, Application, normalizeApiResponse } from '../../../../core/models';
import { NotificationsStore } from '../../../../state/notifications.store';
import { StatCardComponent } from '../../../../shared/components/ui/stat-card/stat-card.component';
import { StatusBadgeComponent } from '../../../../shared/components/ui/status-badge/status-badge.component';
import { MatchScoreBarComponent } from '../../../../shared/components/ui/match-score-bar/match-score-bar.component';
import { SkeletonComponent } from '../../../../shared/components/ui/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state.component';
import { RelativeTimePipe } from '../../../../shared/pipes';

import { RouterLink } from '@angular/router';
import { AuthStore } from '../../../../state/auth.store';

@Component({
  selector: 'app-student-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    MatCardModule, MatIconModule, MatButtonModule,
    StatCardComponent, StatusBadgeComponent,
    MatchScoreBarComponent, SkeletonComponent, EmptyStateComponent,
    RelativeTimePipe,
  ],
  templateUrl: './student-dashboard.component.html',
  styleUrl: './student-dashboard.component.scss',
})
export class StudentDashboardComponent {
  readonly router = inject(Router);
  readonly authStore = inject(AuthStore);
  readonly notificationsStore = inject(NotificationsStore);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly userInitials = computed(() => {
    const p = this.authStore.profile();
    if (p?.firstName && p?.lastName) {
      return `${p.firstName[0]}${p.lastName[0]}`.toUpperCase();
    }
    return 'E';
  });

  // --- httpResource data loading ---
  // Browser-only: the server has no auth token (localStorage doesn't exist during SSR),
  // so these authenticated requests would 401 on the server and that error would get
  // baked into the hydration transfer-state, leaving the dashboard stuck showing empty
  // data after a hard reload until an unrelated client-side navigation refires them.
  readonly profileResource = httpResource<any>(
    () => (this.isBrowser ? { url: `${environment.apiUrl}/students/profile` } : undefined)
  );

  // matching-service no envuelve la respuesta en {data,meta} — devuelve {data,total,page,limit} plano.
  readonly recommendationsResource = httpResource<RecommendationsPage>(
    () => (this.isBrowser
      ? { url: `${environment.apiUrl}/matching/recommendations`, params: { limit: '3' } }
      : undefined),
  );

  readonly applicationsResource = httpResource<PaginatedResponse<Application>>(
    () => (this.isBrowser
      ? { url: `${environment.apiUrl}/applications/my`, params: { limit: '5' } }
      : undefined),
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
    this.recommendationsResource.value()?.total ?? 0
  );

  readonly applications = computed(() =>
    this.applicationsResource.value()?.data ?? []
  );

  readonly activeApplicationsCount = computed(() =>
    this.applicationsResource.value()?.meta?.total ?? 0
  );
}
