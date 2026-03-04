import {
  Component, ChangeDetectionStrategy, inject, input, signal, computed, TemplateRef, viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { httpResource } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';


import { environment } from '../../../../../environments/environment';
import { PaginatedResponse, Application, PaginationParams } from '../../../../core/models';
import { ApplicationStatus } from '../../../../core/enums';
import { ApplicationService } from '../../../applications/services/application.service';
import { DataTableComponent, ColumnDef } from '../../../../shared/components/ui/data-table/data-table.component';
import { StatusBadgeComponent } from '../../../../shared/components/ui/status-badge/status-badge.component';

@Component({
  selector: 'app-project-applicants',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DataTableComponent, StatusBadgeComponent, MatButtonModule,
    MatIconModule, MatMenuModule, MatSnackBarModule,
  ],
  template: `
    <div class="applicants">
      <header class="applicants__header">
        <button mat-icon-button aria-label="Volver" (click)="router.navigate(['/my-projects'])">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>Aplicantes del Proyecto</h1>
      </header>

      <app-data-table
        [data]="applicants()"
        [columns]="columns"
        [totalItems]="totalItems()"
        [pageSize]="10"
        [loading]="applicantsResource.isLoading()"
        (rowClicked)="onRowClicked($event)"
        (pageChanged)="onPageChanged($event)"
        (sortChanged)="onSortChanged($event)" />

      <!-- Student column template -->
      <ng-template #studentTpl let-row>
        <div class="applicants__student">
          <span class="applicants__student-name">{{ row.student?.firstName }} {{ row.student?.lastName }}</span>
        </div>
      </ng-template>

      <!-- Score column template -->
      <ng-template #scoreTpl let-row>
        @if (row.matchScore != null) {
          <span class="applicants__score"
                [class.high]="row.matchScore >= 80"
                [class.mid]="row.matchScore >= 50 && row.matchScore < 80"
                [class.low]="row.matchScore < 50">
            {{ row.matchScore }}%
          </span>
        } @else {
          <span class="applicants__score">—</span>
        }
      </ng-template>

      <!-- Status column template -->
      <ng-template #statusTpl let-row>
        <app-status-badge [status]="row.status" size="sm" />
      </ng-template>

      <!-- Actions column template -->
      <ng-template #actionsTpl let-row>
        <button mat-icon-button aria-label="Acciones" [matMenuTriggerFor]="actionsMenu" (click)="$event.stopPropagation()">
          <mat-icon>more_vert</mat-icon>
        </button>
        <mat-menu #actionsMenu="matMenu">
          @if (row.status === pendingStatus || row.status === underReviewStatus) {
            <button mat-menu-item (click)="changeStatus(row.id, acceptedStatus)">
              <mat-icon>check_circle</mat-icon> Aceptar
            </button>
            <button mat-menu-item (click)="changeStatus(row.id, interviewStatus)">
              <mat-icon>event</mat-icon> Programar Entrevista
            </button>
            <button mat-menu-item (click)="changeStatus(row.id, rejectedStatus)">
              <mat-icon>cancel</mat-icon> Rechazar
            </button>
          }
          <button mat-menu-item (click)="router.navigate(['/received-applications', row.id])">
            <mat-icon>visibility</mat-icon> Ver Detalle
          </button>
        </mat-menu>
      </ng-template>
    </div>
  `,
  styles: `
    :host { display: block; padding: 24px; max-width: 1200px; margin: 0 auto; }

    .applicants__header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 24px;

      h1 {
        font-size: 1.5rem;
        font-weight: 700;
        margin: 0;
        color: var(--mat-sys-on-surface);
      }
    }

    .applicants__student {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .applicants__student-name {
      font-weight: 500;
    }

    .applicants__score {
      font-weight: 600;
      font-size: 0.875rem;

      &.high { color: var(--mat-sys-primary); }
      &.mid { color: #f59e0b; }
      &.low { color: var(--mat-sys-error); }
    }
  `,
})
export class ProjectApplicantsComponent {
  readonly router = inject(Router);
  private readonly applicationService = inject(ApplicationService);
  private readonly snackBar = inject(MatSnackBar);

  readonly id = input.required<string>();

  readonly pendingStatus = ApplicationStatus.PENDING;
  readonly underReviewStatus = ApplicationStatus.UNDER_REVIEW;
  readonly acceptedStatus = ApplicationStatus.ACCEPTED;
  readonly rejectedStatus = ApplicationStatus.REJECTED;
  readonly interviewStatus = ApplicationStatus.INTERVIEW;

  readonly page = signal(1);
  readonly sortBy = signal<string>('');
  readonly sortDir = signal<'asc' | 'desc'>('desc');

  readonly studentTpl = viewChild<TemplateRef<any>>('studentTpl');
  readonly scoreTpl = viewChild<TemplateRef<any>>('scoreTpl');
  readonly statusTpl = viewChild<TemplateRef<any>>('statusTpl');
  readonly actionsTpl = viewChild<TemplateRef<any>>('actionsTpl');

  get columns(): ColumnDef<Application>[] {
    return [
      { key: 'student', header: 'Estudiante', template: this.studentTpl()!, sortable: false },
      { key: 'matchScore', header: 'Match', template: this.scoreTpl()!, sortable: true, width: '100px' },
      { key: 'status', header: 'Estado', template: this.statusTpl()!, sortable: true, width: '140px' },
      { key: 'appliedAt', header: 'Fecha', type: 'date', sortable: true, width: '140px' },
      { key: 'actions', header: '', template: this.actionsTpl()!, sortable: false, width: '60px' },
    ];
  }

  readonly applicantsResource = httpResource<PaginatedResponse<Application>>(
    () => ({
      url: `${environment.apiUrl}/applications/received`,
      params: {
        projectId: this.id(),
        page: this.page(),
        limit: 10,
        ...(this.sortBy() ? { sortBy: this.sortBy(), sortOrder: this.sortDir().toUpperCase() } : {}),
      },
    }),
  );

  readonly applicants = computed(() =>
    this.applicantsResource.value()?.data ?? [],
  );

  readonly totalItems = computed(() =>
    this.applicantsResource.value()?.meta?.total ?? 0,
  );

  onRowClicked(row: Application): void {
    this.router.navigate(['/received-applications', row.id]);
  }

  onPageChanged(event: PaginationParams): void {
    this.page.set(event.page ?? 1);
  }

  onSortChanged(event: { column: string; direction: 'asc' | 'desc' }): void {
    this.sortBy.set(event.column);
    this.sortDir.set(event.direction);
  }

  changeStatus(applicationId: string, status: ApplicationStatus): void {
    this.applicationService.changeStatus(applicationId, status).subscribe({
      next: () => {
        this.snackBar.open('Estado actualizado', 'OK', { duration: 3000 });
        this.applicantsResource.reload();
      },
      error: () => {
        this.snackBar.open('Error al actualizar estado', 'Cerrar', { duration: 4000 });
      },
    });
  }
}
