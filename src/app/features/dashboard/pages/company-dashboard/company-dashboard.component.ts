import {
  Component, ChangeDetectionStrategy, inject, computed,
} from '@angular/core';
import { Router } from '@angular/router';
import { httpResource } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { environment } from '../../../../../environments/environment';
import { PaginatedResponse, Project, Application } from '../../../../core/models';
import { NotificationsStore } from '../../../../state/notifications.store';
import { StatCardComponent } from '../../../../shared/components/ui/stat-card/stat-card.component';
import { ApplicationCardComponent } from '../../../../shared/components/cards/application-card/application-card.component';
import { StatusBadgeComponent } from '../../../../shared/components/ui/status-badge/status-badge.component';
import { SkeletonComponent } from '../../../../shared/components/ui/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state.component';
import { RelativeTimePipe } from '../../../../shared/pipes';

@Component({
  selector: 'app-company-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule, MatIconModule, MatButtonModule,
    StatCardComponent, ApplicationCardComponent, StatusBadgeComponent,
    SkeletonComponent, EmptyStateComponent, RelativeTimePipe,
  ],
  templateUrl: './company-dashboard.component.html',
  styleUrl: './company-dashboard.component.scss',
})
export class CompanyDashboardComponent {
  readonly router = inject(Router);
  readonly notificationsStore = inject(NotificationsStore);

  // --- httpResource data loading ---
  readonly projectsResource = httpResource<PaginatedResponse<Project>>(
    () => ({ url: `${environment.apiUrl}/projects/my-projects`, params: { status: 'published' } }),
  );

  readonly applicationsResource = httpResource<PaginatedResponse<Application>>(
    () => ({ url: `${environment.apiUrl}/applications/received`, params: { status: 'pending', limit: '5' } }),
  );

  // --- Computed signals from resources ---
  readonly projects = computed(() =>
    this.projectsResource.value()?.data ?? []
  );

  readonly activeProjectsCount = computed(() =>
    this.projectsResource.value()?.meta?.total ?? 0
  );

  readonly pendingApplications = computed(() =>
    this.applicationsResource.value()?.data ?? []
  );

  readonly pendingApplicationsCount = computed(() =>
    this.applicationsResource.value()?.meta?.total ?? 0
  );

  readonly activeStudentsCount = computed(() => {
    const projects = this.projects();
    return projects.reduce((sum, p) => sum + p.positionsFilled, 0);
  });

  readonly avgRating = computed(() => {
    // Placeholder — computed from project data or separate endpoint
    return '—';
  });

  onChangeApplicationStatus(event: { id: string; status: string }): void {
    // Will be wired to ApplicationService in applications feature
    console.log('Change application status:', event);
  }
}
