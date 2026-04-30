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
  templateUrl: './my-applications-list.component.html',
  styleUrl: './my-applications-list.component.scss',
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
      return { url: `${environment.apiUrl}/applications/my`, params };
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
