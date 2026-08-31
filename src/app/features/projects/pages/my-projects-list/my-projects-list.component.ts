import { Component, ChangeDetectionStrategy, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { httpResource } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

import { environment } from '../../../../../environments/environment';
import { PaginatedResponse, Project } from '../../../../core/models';
import { ProjectStatus } from '../../../../core/enums';
import { ProjectService } from '../../services/project.service';
import { StatusBadgeComponent } from '../../../../shared/components/ui/status-badge/status-badge.component';
import { PaginatorComponent } from '../../../../shared/components/ui/paginator/paginator.component';
import { SkeletonComponent } from '../../../../shared/components/ui/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../shared/components/ui/confirm-dialog/confirm-dialog.component';
import { from } from 'rxjs';

@Component({
  selector: 'app-my-projects-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule, MatIconModule, MatButtonModule, MatMenuModule, MatChipsModule, DatePipe,
    MatDialogModule, MatSnackBarModule,
    StatusBadgeComponent, PaginatorComponent, SkeletonComponent, EmptyStateComponent,
  ],
  templateUrl: './my-projects-list.component.html',
  styleUrl: './my-projects-list.component.scss',
})
export class MyProjectsListComponent {
  readonly router = inject(Router);
  private readonly projectService = inject(ProjectService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly statusFilter = signal('');
  readonly page = signal(1);
  readonly projectStatusDraft = ProjectStatus.DRAFT;
  readonly projectStatusNeedsChanges = ProjectStatus.NEEDS_CHANGES;
  readonly projectStatusPendingApproval = ProjectStatus.PENDING_APPROVAL;

  readonly projectsResource = httpResource<PaginatedResponse<Project>>(
    () => {
      if (!this.isBrowser) return undefined;
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
    this.projectService.updateStatus(id, ProjectStatus.PENDING_APPROVAL).subscribe({
      next: () => {
        this.snackBar.open('Proyecto enviado a revisión', 'OK', { duration: 3000 });
        this.projectsResource.reload();
      },
      error: (err: HttpErrorResponse) => {
        // Backend rechaza si faltan requirements, transición inválida, etc.
        // El mensaje del backend es descriptivo — se muestra tal cual.
        const raw = err?.error?.message;
        const msg = Array.isArray(raw) ? raw.join('; ') : raw ?? 'No se pudo enviar el proyecto a revisión';
        this.snackBar.open(msg, 'Cerrar', { duration: 6000 });
      },
    });
  }

  deleteProject(project: Project): void {
    const dialogRef = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Eliminar Proyecto',
        message: `¿Estás seguro de que deseas eliminar el proyecto "${project.title}"? Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.projectService.delete(project.id).subscribe(() => {
          this.projectsResource.reload();
        });
      }
    });
  }
}
