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
  template: `
    <div class="my-projects">
      <header class="my-projects__header">
        <h1>Mis Proyectos</h1>
        <button mat-flat-button (click)="router.navigate(['/my-projects', 'create'])">
          <mat-icon>add</mat-icon> Crear Proyecto
        </button>
      </header>

      <!-- Filter chips -->
      <mat-chip-listbox class="my-projects__filters" (change)="statusFilter.set($event.value || '')">
        <mat-chip-option value="">Todos</mat-chip-option>
        <mat-chip-option value="draft">Borradores</mat-chip-option>
        <mat-chip-option value="published">Publicados</mat-chip-option>
        <mat-chip-option value="in_progress">En Progreso</mat-chip-option>
        <mat-chip-option value="completed">Completados</mat-chip-option>
      </mat-chip-listbox>

      <!-- Projects list -->
      <div class="my-projects__list">
        @if (projectsResource.isLoading()) {
          @for (_ of [1,2,3]; track $index) {
            <app-skeleton width="100%" height="120px" />
          }
        } @else if (projects().length === 0) {
          <app-empty-state
            icon="create_new_folder"
            title="Sin proyectos"
            message="Publica tu primer proyecto para empezar a recibir aplicaciones."
            actionLabel="Crear Proyecto"
            (actionClicked)="router.navigate(['/my-projects', 'create'])" />
        } @else {
          @for (project of projects(); track project.id) {
            <mat-card class="my-projects__item">
              <mat-card-content>
                <div class="my-projects__item-main">
                  <div class="my-projects__item-info">
                    <h3 class="my-projects__item-title">{{ project.title }}</h3>
                    <div class="my-projects__item-meta">
                      <app-status-badge [status]="project.status" size="sm" />
                      <span>{{ project.positionsFilled }}/{{ project.positionsAvailable }} posiciones</span>
                      <span>{{ project.applicationsCount }} aplicaciones</span>
                      @if (project.applicationDeadline) {
                        <span>Límite: {{ project.applicationDeadline | date:'d MMM yyyy' }}</span>
                      }
                    </div>
                  </div>
                  <div class="my-projects__item-actions">
                    <button mat-icon-button [matMenuTriggerFor]="projectMenu">
                      <mat-icon>more_vert</mat-icon>
                    </button>
                    <mat-menu #projectMenu="matMenu">
                      <button mat-menu-item (click)="router.navigate(['/projects', project.id])">
                        <mat-icon>visibility</mat-icon> Ver Detalle
                      </button>
                      <button mat-menu-item (click)="router.navigate(['/my-projects', project.id, 'edit'])">
                        <mat-icon>edit</mat-icon> Editar
                      </button>
                      <button mat-menu-item (click)="router.navigate(['/my-projects', project.id, 'applicants'])">
                        <mat-icon>people</mat-icon> Ver Aplicantes
                      </button>
                      @if (project.status === projectStatusDraft) {
                        <button mat-menu-item (click)="publishProject(project.id)">
                          <mat-icon>publish</mat-icon> Publicar
                        </button>
                      }
                    </mat-menu>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          }
        }
      </div>

      @if (totalProjects() > 0) {
        <app-paginator
          [totalItems]="totalProjects()"
          [pageSize]="10"
          (pageChanged)="onPageChanged($event)" />
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .my-projects__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;

      h1 {
        font-size: 1.75rem;
        font-weight: 700;
        margin: 0;
        color: var(--mat-sys-on-surface);
      }
    }

    .my-projects__filters {
      margin-bottom: 20px;
    }

    .my-projects__list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 24px;
    }

    .my-projects__item-main {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .my-projects__item-info {
      flex: 1;
      min-width: 0;
    }

    .my-projects__item-title {
      font-size: 1rem;
      font-weight: 600;
      margin: 0 0 8px;
      color: var(--mat-sys-on-surface);
    }

    .my-projects__item-meta {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px 16px;
      font-size: 0.8125rem;
      color: var(--mat-sys-on-surface-variant);
    }
  `,
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
