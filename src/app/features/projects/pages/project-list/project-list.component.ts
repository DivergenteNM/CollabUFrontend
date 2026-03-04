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
  template: `
    <div class="project-list">
      <header class="project-list__header">
        <h1>Proyectos Disponibles</h1>
        @if (totalProjects() > 0) {
          <span class="project-list__count">{{ totalProjects() }} proyectos encontrados</span>
        }
      </header>

      <!-- Filters -->
      @if (!uiStore.isMobile()) {
        <app-search-filter-bar
          [filters]="filterConfigs"
          (filtersChanged)="onFiltersChanged($event)" />
      } @else {
        <button mat-stroked-button (click)="showMobileFilters.set(true)">
          <mat-icon>filter_list</mat-icon> Filtros
        </button>

        <mat-drawer-container class="project-list__drawer-container" [hasBackdrop]="true">
          <mat-drawer #filterDrawer
                      mode="over"
                      position="end"
                      [opened]="showMobileFilters()"
                      (closed)="showMobileFilters.set(false)">
            <div class="project-list__mobile-filters">
              <div class="project-list__mobile-filters-header">
                <h3>Filtros</h3>
                <button mat-icon-button aria-label="Cerrar filtros" (click)="showMobileFilters.set(false)">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
              <app-search-filter-bar
                [filters]="filterConfigs"
                (filtersChanged)="onFiltersChanged($event)" />
            </div>
          </mat-drawer>
        </mat-drawer-container>
      }

      <!-- Project Grid -->
      <section class="project-list__grid">
        @if (projectsResource.isLoading()) {
          @for (_ of skeletonArray; track $index) {
            <app-skeleton width="100%" height="320px" />
          }
        } @else if (projects().length === 0) {
          <div class="project-list__empty">
            <app-empty-state
              icon="search_off"
              title="Sin resultados"
              message="No se encontraron proyectos con los filtros seleccionados."
              actionLabel="Limpiar filtros"
              (actionClicked)="clearFilters()" />
          </div>
        } @else {
          @for (project of projects(); track project.id) {
            <app-project-card
              [project]="project"
              [matchScore]="authStore.isStudent() ? project.applicationsCount : undefined"
              [showActions]="true"
              (viewDetail)="router.navigate(['/projects', $event])"
              (apply)="router.navigate(['/projects', $event])" />
          }
        }
      </section>

      <!-- Paginator -->
      @if (totalProjects() > 0) {
        <app-paginator
          [totalItems]="totalProjects()"
          [pageSize]="12"
          [pageSizeOptions]="[12, 24, 48]"
          (pageChanged)="onPageChanged($event)" />
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .project-list__header {
      display: flex;
      align-items: baseline;
      gap: 16px;
      margin-bottom: 24px;

      h1 {
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--mat-sys-on-surface);
        margin: 0;
      }
    }

    .project-list__count {
      font-size: 0.875rem;
      color: var(--mat-sys-on-surface-variant);
    }

    app-search-filter-bar {
      margin-bottom: 24px;
    }

    .project-list__grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
      margin-bottom: 24px;
    }

    .project-list__empty {
      grid-column: 1 / -1;
    }

    .project-list__drawer-container {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 1000;
      pointer-events: none;

      &[ng-reflect-has-backdrop="true"] {
        pointer-events: all;
      }
    }

    .project-list__mobile-filters {
      padding: 16px;
      width: 300px;
    }

    .project-list__mobile-filters-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;

      h3 {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 600;
      }
    }
  `,
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
        { value: ProjectType.SOCIAL_SERVICE, label: 'Servicio Social' },
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
