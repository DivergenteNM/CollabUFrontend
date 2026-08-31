import { Component, ChangeDetectionStrategy, inject, input, signal, computed } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { forkJoin, of } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { Application } from '../../../../core/models';
import { ApplicationStatus } from '../../../../core/enums';
import { ApplicationService } from '../../../applications/services/application.service';
import { StatusBadgeComponent } from '../../../../shared/components/ui/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../../shared/components/ui/skeleton/skeleton.component';

@Component({
  selector: 'app-project-applicants',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe, MatButtonModule, MatIconModule, MatMenuModule, MatCardModule,
    MatSnackBarModule, StatusBadgeComponent, EmptyStateComponent, SkeletonComponent,
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

  readonly applicantsResource = rxResource({
    params: () => ({ projectId: this.id(), page: this.page(), limit: 10 }),
    stream: ({ params }) => this.applicationService.getReceivedApplications(params as any).pipe(
      switchMap((res: any) => {
        if (!res.data || res.data.length === 0) return of(res);
        const enrich$ = forkJoin(
          (res.data as Application[]).map((app) => this.applicationService.enrichApplication(app)),
        );
        return enrich$.pipe(map((enrichedApps) => ({ ...res, data: enrichedApps }))) as any;
      }),
    ),
  });

  readonly applicants = computed<Application[]>(() => (this.applicantsResource.value() as any)?.data ?? []);
  readonly totalItems = computed(() => (this.applicantsResource.value() as any)?.meta?.total ?? 0);
  readonly isLoading = computed(() => this.applicantsResource.isLoading());

  studentName(row: Application): string {
    const s: any = (row as any).student;
    return s?.user ? `${s.user.firstName ?? ''} ${s.user.lastName ?? ''}`.trim() : `Estudiante #${row.studentId}`;
  }

  scoreClass(score: number | null | undefined): string {
    if (score == null) return '';
    if (score >= 80) return 'high';
    if (score >= 50) return 'mid';
    return 'low';
  }

  openDetail(row: Application): void {
    this.router.navigate(['/received-applications', row.id]);
  }

  changeStatus(applicationId: string, status: ApplicationStatus, event?: Event): void {
    event?.stopPropagation();
    this.applicationService.changeStatus(applicationId, status).subscribe({
      next: () => {
        this.snackBar.open('Estado actualizado', 'OK', { duration: 3000 });
        this.applicantsResource.reload();
      },
      error: (err: any) => {
        const raw = err?.error?.message;
        const msg = Array.isArray(raw) ? raw.join('; ') : raw ?? 'Error al actualizar estado';
        this.snackBar.open(msg, 'Cerrar', { duration: 6000 });
      },
    });
  }

  onPagePrev(): void { if (this.page() > 1) this.page.set(this.page() - 1); }
  onPageNext(): void { if (this.applicants().length >= 10) this.page.set(this.page() + 1); }
}
