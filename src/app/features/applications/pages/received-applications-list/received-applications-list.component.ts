import {
  Component, ChangeDetectionStrategy, inject, signal, computed,
} from '@angular/core';
import { Router } from '@angular/router';
import { httpResource } from '@angular/common/http';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { environment } from '../../../../../environments/environment';
import { PaginatedResponse, Application } from '../../../../core/models';
import { ApplicationStatus } from '../../../../core/enums';
import { ApplicationService } from '../../services/application.service';
import { ApplicationCardComponent } from '../../../../shared/components/cards/application-card/application-card.component';
import { PaginatorComponent } from '../../../../shared/components/ui/paginator/paginator.component';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../../shared/components/ui/skeleton/skeleton.component';

@Component({
  selector: 'app-received-applications-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatSelectModule, MatFormFieldModule, MatInputModule, MatIconModule, MatSnackBarModule,
    ApplicationCardComponent, PaginatorComponent, EmptyStateComponent, SkeletonComponent,
  ],
  template: `
    <div class="received">
      <header class="received__header">
        <h1>Aplicaciones Recibidas</h1>
      </header>

      <!-- Filters -->
      <div class="received__filters">
        <mat-form-field appearance="outline" class="received__filter">
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
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="received__filter">
          <mat-label>Match mínimo</mat-label>
          <mat-select [value]="minMatch()" (selectionChange)="minMatch.set($event.value); page.set(1)">
            <mat-option value="">Sin filtro</mat-option>
            <mat-option value="50">≥ 50%</mat-option>
            <mat-option value="70">≥ 70%</mat-option>
            <mat-option value="80">≥ 80%</mat-option>
            <mat-option value="90">≥ 90%</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="received__filter">
          <mat-label>Ordenar</mat-label>
          <mat-select [value]="sortBy()" (selectionChange)="sortBy.set($event.value)">
            <mat-option value="appliedAt">Fecha aplicación</mat-option>
            <mat-option value="matchScore">Match score</mat-option>
            <mat-option value="status">Estado</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <!-- List -->
      <div class="received__list">
        @if (applicationsResource.isLoading()) {
          @for (_ of [1,2,3]; track $index) {
            <app-skeleton width="100%" height="200px" />
          }
        } @else if (applications().length === 0) {
          <app-empty-state
            icon="inbox"
            title="Sin aplicaciones"
            message="Aún no has recibido aplicaciones. Publica un proyecto para empezar."
            actionLabel="Mis Proyectos"
            (actionClicked)="router.navigate(['/my-projects'])" />
        } @else {
          @for (app of applications(); track app.id) {
            <app-application-card
              [application]="app"
              viewMode="company"
              (viewDetail)="router.navigate(['/received-applications', $event])"
              (changeStatus)="onChangeStatus($event)" />
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

    .received__header {
      margin-bottom: 20px;
      h1 {
        font-size: 1.75rem;
        font-weight: 700;
        margin: 0;
        color: var(--mat-sys-on-surface);
      }
    }

    .received__filters {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 20px;
    }

    .received__filter {
      min-width: 160px;
    }

    .received__list {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 24px;
    }
  `,
})
export class ReceivedApplicationsListComponent {
  readonly router = inject(Router);
  private readonly applicationService = inject(ApplicationService);
  private readonly snackBar = inject(MatSnackBar);

  readonly ApplicationStatus = ApplicationStatus;
  readonly statusFilter = signal('');
  readonly minMatch = signal('');
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
      const mm = this.minMatch();
      if (mm) params['minMatchScore'] = mm;
      return { url: `${environment.apiUrl}/applications/received`, params };
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

  onChangeStatus(event: { id: string; status: ApplicationStatus }): void {
    this.applicationService.changeStatus(event.id, event.status).subscribe({
      next: () => {
        this.snackBar.open('Estado actualizado', 'OK', { duration: 3000 });
        this.applicationsResource.reload();
      },
      error: () => this.snackBar.open('Error al actualizar estado', 'Cerrar', { duration: 4000 }),
    });
  }
}
