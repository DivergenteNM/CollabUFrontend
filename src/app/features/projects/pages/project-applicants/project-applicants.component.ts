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
  templateUrl: './project-applicants.component.html',
  styleUrl: './project-applicants.component.scss',
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
