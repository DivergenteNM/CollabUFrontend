import {
  Component, ChangeDetectionStrategy, inject, signal, computed,
} from '@angular/core';
import { Router } from '@angular/router';
import { httpResource } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { DatePipe } from '@angular/common';

import { environment } from '../../../../../environments/environment';
import { PaginatedResponse, Project } from '../../../../core/models';
import { ProjectStatus } from '../../../../core/enums';
import { ProjectService } from '../../services/project.service';
import { StatusBadgeComponent } from '../../../../shared/components/ui/status-badge/status-badge.component';
import { PaginatorComponent } from '../../../../shared/components/ui/paginator/paginator.component';
import { SkeletonComponent } from '../../../../shared/components/ui/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state.component';

@Component({
  selector: 'app-my-projects-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule, MatIconModule, MatButtonModule, MatMenuModule, MatChipsModule, DatePipe,
    StatusBadgeComponent, PaginatorComponent, SkeletonComponent, EmptyStateComponent,
  ],
  templateUrl: './my-projects-list.component.html',
  styleUrl: './my-projects-list.component.scss',
})
export class MyProjectsListComponent {
  readonly router = inject(Router);
  private readonly projectService = inject(ProjectService);

  readonly statusFilter = signal('');
  readonly page = signal(1);
  readonly projectStatusDraft = ProjectStatus.DRAFT;

  readonly projectsResource = httpResource<PaginatedResponse<Project>>(
    () => {
      const params: Record<string, string | number> = { page: this.page(), limit: 10 };
      const status = this.statusFilter();
      if (status) params['status'] = status;
      return { url: `${environment.apiUrl}/projects/my-projects`, params };
    },
  );

  readonly projects = computed(() =>
    this.projectsResource.value()?.data ?? []
  );

  readonly totalProjects = computed(() =>
    this.projectsResource.value()?.meta?.total ?? 0
  );

  onPageChanged(event: { page: number; limit: number }): void {
    this.page.set(event.page);
  }

  publishProject(id: string): void {
    this.projectService.publish(id).subscribe(() => {
      this.projectsResource.reload();
    });
  }
}
