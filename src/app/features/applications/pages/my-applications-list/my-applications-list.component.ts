import {
  Component, ChangeDetectionStrategy, inject, signal, computed,
} from '@angular/core';
import { Router } from '@angular/router';
import { httpResource } from '@angular/common/http';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { environment } from '../../../../../environments/environment';
import { PaginatedResponse, Application } from '../../../../core/models';
import { ApplicationStatus } from '../../../../core/enums';
import { ApplicationService } from '../../services/application.service';
import { ApplicationCardComponent } from '../../../../shared/components/cards/application-card/application-card.component';
import { PaginatorComponent } from '../../../../shared/components/ui/paginator/paginator.component';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../../shared/components/ui/skeleton/skeleton.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../shared/components/ui/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-my-applications-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatSelectModule, MatFormFieldModule, MatButtonModule, MatIconModule,
    MatDialogModule, MatSnackBarModule,
    ApplicationCardComponent, PaginatorComponent, EmptyStateComponent, SkeletonComponent,
  ],
  template: `
    <div class="my-apps">
      <header class="my-apps__header">
        <h1>Mis Aplicaciones</h1>
      </header>

      <!-- Filters -->
      <div class="my-apps__filters">
        <mat-form-field appearance="outline" class="my-apps__filter">
          <mat-label>Estado</mat-label>
          <mat-select [value]="statusFilter()" (selectionChange)="statusFilter.set($event.value); page.set(1)">
            <mat-option value="">Todos</mat-option>
            <mat-option [value]="ApplicationStatus.PENDING">Pendiente</mat-option>
            <mat-option [value]="ApplicationStatus.UNDER_REVIEW">En revisión</mat-option>
            <mat-option [value]="ApplicationStatus.INTERVIEW">Entrevista</mat-option>
            <mat-option [value]="ApplicationStatus.ACCEPTED">Aceptada</mat-option>
            <mat-option [value]="ApplicationStatus.REJECTED">Rechazada</mat-option>
            <mat-option [value]="ApplicationStatus.IN_PROGRESS">En progreso</mat-option>
            <mat-option [value]="ApplicationStatus.COMPLETED">Completada</mat-option>
            <mat-option [value]="ApplicationStatus.WITHDRAWN">Retirada</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="my-apps__filter">
          <mat-label>Ordenar</mat-label>
          <mat-select [value]="sortBy()" (selectionChange)="sortBy.set($event.value)">
            <mat-option value="appliedAt">Fecha aplicación</mat-option>
            <mat-option value="matchScore">Match score</mat-option>
            <mat-option value="status">Estado</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <!-- List -->
      <div class="my-apps__list">
        @if (applicationsResource.isLoading()) {
          @for (_ of [1,2,3]; track $index) {
            <app-skeleton width="100%" height="200px" />
          }
        } @else if (applications().length === 0) {
          <app-empty-state
            icon="inbox"
            title="Sin aplicaciones"
            message="Aún no has aplicado a ningún proyecto. Explora los proyectos disponibles."
            actionLabel="Ver Proyectos"
            (actionClicked)="router.navigate(['/projects'])" />
        } @else {
          @for (app of applications(); track app.id) {
            <app-application-card
              [application]="app"
              viewMode="student"
              (viewDetail)="router.navigate(['/my-applications', $event])" />
          }
        }
      </div>

      @if (totalItems() > 0) {
        <app-paginator
          [totalItems]="totalItems()"
          [pageSize]="10"
          (pageChanged)="onPageChanged($event)" />
      }
    </div>
  `,
  styles: `
    :host { display: block; padding: 24px; max-width: 1200px; margin: 0 auto; }

    .my-apps__header {
      margin-bottom: 20px;
      h1 {
        font-size: 1.75rem;
        font-weight: 700;
        margin: 0;
        color: var(--mat-sys-on-surface);
      }
    }

    .my-apps__filters {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 20px;
    }

    .my-apps__filter {
      min-width: 180px;
    }

    .my-apps__list {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 24px;
    }
  `,
})
export class MyApplicationsListComponent {
  readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly applicationService = inject(ApplicationService);

  readonly ApplicationStatus = ApplicationStatus;
  readonly statusFilter = signal('');
  readonly sortBy = signal('appliedAt');
  readonly page = signal(1);

  readonly applicationsResource = httpResource<PaginatedResponse<Application>>(
    () => {
      const params: Record<string, string | number> = {
        page: this.page(),
        limit: 10,
        sortBy: this.sortBy(),
      };
      const status = this.statusFilter();
      if (status) params['status'] = status;
      return { url: `${environment.apiUrl}/applications/my-applications`, params };
    },
  );

  readonly applications = computed(() =>
    this.applicationsResource.value()?.data ?? [],
  );

  readonly totalItems = computed(() =>
    this.applicationsResource.value()?.meta?.total ?? 0,
  );

  onPageChanged(event: { page: number; limit: number }): void {
    this.page.set(event.page);
  }

  withdrawApplication(id: string): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Retirar Aplicación',
        message: '¿Estás seguro de que deseas retirar esta aplicación? Esta acción no se puede deshacer.',
        confirmText: 'Retirar',
        type: 'danger',
      } satisfies ConfirmDialogData,
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.applicationService.withdraw(id).subscribe({
          next: () => {
            this.snackBar.open('Aplicación retirada', 'OK', { duration: 3000 });
            this.applicationsResource.reload();
          },
          error: () => this.snackBar.open('Error al retirar', 'Cerrar', { duration: 4000 }),
        });
      }
    });
  }
}
