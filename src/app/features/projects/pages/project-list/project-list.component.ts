import {
  Component, ChangeDetectionStrategy, inject, signal, computed,
} from '@angular/core';
import { Router } from '@angular/router';
import { httpResource } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';

import { environment } from '../../../../../environments/environment';
import { PaginatedResponse, Project } from '../../../../core/models';
import { ProjectType } from '../../../../core/enums';
import { AuthStore } from '../../../../state/auth.store';
import { UiStore } from '../../../../state/ui.store';
import { ProjectCardComponent } from '../../../../shared/components/cards/project-card/project-card.component';
import { SearchFilterBarComponent, FilterConfig } from '../../../../shared/components/ui/search-filter-bar/search-filter-bar.component';
import { PaginatorComponent } from '../../../../shared/components/ui/paginator/paginator.component';
import { SkeletonComponent } from '../../../../shared/components/ui/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state.component';

@Component({
  selector: 'app-project-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule, MatIconModule, MatSidenavModule,
    ProjectCardComponent, SearchFilterBarComponent, PaginatorComponent,
    SkeletonComponent, EmptyStateComponent,
  ],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.scss',
})
export class ProjectListComponent {
  readonly router = inject(Router);
  readonly authStore = inject(AuthStore);
  readonly uiStore = inject(UiStore);

  readonly filters = signal<Record<string, any>>({});
  readonly page = signal(1);
  readonly showMobileFilters = signal(false);
  readonly skeletonArray = Array(6);

  readonly filterConfigs: FilterConfig[] = [
    { key: 'search', label: 'Buscar', type: 'text', placeholder: 'Buscar proyecto...' },
    {
      key: 'projectType', label: 'Tipo', type: 'select',
      options: [
        { value: ProjectType.PROFESSIONAL_PRACTICE, label: 'Práctica Profesional' },
        { value: ProjectType.THESIS, label: 'Tesis / Trabajo de Grado' },
        { value: ProjectType.RESEARCH, label: 'Investigación' },
        { value: ProjectType.INTERNSHIP, label: 'Pasantía' },
      ],
    },
    {
      key: 'isRemote', label: 'Modalidad', type: 'select',
      options: [
        { value: 'true', label: 'Remoto' },
        { value: 'false', label: 'Presencial' },
      ],
    },
    {
      key: 'sortBy', label: 'Ordenar', type: 'select',
      options: [
        { value: 'createdAt', label: 'Más recientes' },
        { value: 'applicationDeadline', label: 'Fecha límite' },
        { value: 'applicationsCount', label: 'Más aplicaciones' },
      ],
    },
  ];

  readonly projectsResource = httpResource<PaginatedResponse<Project>>(
    () => ({
      url: `${environment.apiUrl}/projects`,
      params: this.buildParams(),
    }),
  );

  readonly projects = computed(() =>
    this.projectsResource.value()?.data ?? []
  );

  readonly totalProjects = computed(() =>
    this.projectsResource.value()?.meta?.total ?? 0
  );

  onFiltersChanged(newFilters: Record<string, any>): void {
    this.filters.set(newFilters);
    this.page.set(1);
  }

  onPageChanged(event: { page: number; limit: number }): void {
    this.page.set(event.page);
  }

  clearFilters(): void {
    this.filters.set({});
    this.page.set(1);
  }

  private buildParams(): Record<string, string | number | boolean> {
    const f = this.filters();
    const params: Record<string, string | number | boolean> = {
      page: this.page(),
      limit: 12,
    };
    Object.entries(f).forEach(([key, value]) => {
      if (value !== '' && value != null) {
        params[key] = value;
      }
    });
    return params;
  }
}
