import {
  Component, ChangeDetectionStrategy, inject, signal, computed,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { of, forkJoin } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
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
  templateUrl: './received-applications-list.component.html',
  styleUrl: './received-applications-list.component.scss',
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

  readonly applicationsResource = rxResource({
    params: () => {
      const p: Record<string, string | number> = {
        page: this.page(),
        limit: 10,
        sortBy: this.sortBy(),
      };
      const status = this.statusFilter();
      if (status) p['status'] = status;
      const mm = this.minMatch();
      if (mm) p['minMatchScore'] = mm;
      return p;
    },
    stream: ({ params }) => this.applicationService.getReceivedApplications(params as any).pipe(
      switchMap(res => {
        if (!res.data || res.data.length === 0) return of(res);
        return forkJoin(res.data.map(app => this.applicationService.enrichApplication(app))).pipe(
          map(enrichedApps => ({ ...res, data: enrichedApps }))
        );
      })
    )
  });

  readonly applications = computed(() =>
    (this.applicationsResource.value() as any)?.data ?? [],
  );

  readonly totalItems = computed(() =>
    (this.applicationsResource.value() as any)?.total ?? 0,
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
