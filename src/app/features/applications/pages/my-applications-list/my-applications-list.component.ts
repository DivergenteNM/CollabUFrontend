import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { forkJoin, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { DatePipe } from '@angular/common';

import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';

import { Application } from '../../../../core/models';
import { ApplicationStatus } from '../../../../core/enums';
import { ApplicationService } from '../../services/application.service';
import { resolveApplicationPhase } from '../../utils/application-phases.utils';
import { ApplicationCardComponent } from '../../../../shared/components/cards/application-card/application-card.component';
import { PaginatorComponent } from '../../../../shared/components/ui/paginator/paginator.component';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../../shared/components/ui/skeleton/skeleton.component';
import { StatusBadgeComponent } from '../../../../shared/components/ui/status-badge/status-badge.component';
import {
  WithdrawDialogComponent,
  WithdrawDialogData,
  WithdrawDialogResult,
} from '../../components/withdraw-dialog/withdraw-dialog.component';
import {
  CoverLetterDialogComponent,
  CoverLetterDialogData,
} from '../../components/cover-letter-dialog/cover-letter-dialog.component';

export type ApplicationFilterCategory =
  | 'all'
  | 'phase_recruitment'
  | 'phase_academic'
  | 'phase_workspace'
  | 'history'
  | 'interview';

@Component({
  selector: 'app-my-applications-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    DatePipe,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatMenuModule,
    ApplicationCardComponent,
    PaginatorComponent,
    EmptyStateComponent,
    SkeletonComponent,
    StatusBadgeComponent,
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

  // View state signals
  readonly selectedCategory = signal<ApplicationFilterCategory>('all');
  readonly statusFilter = signal<string>('');
  readonly searchQuery = signal<string>('');
  readonly sortBy = signal<'recent' | 'match' | 'company' | 'title'>('recent');
  readonly viewMode = signal<'grid' | 'list'>('grid');
  readonly page = signal(1);
  readonly pageSize = signal(20);

  // Applications resource enriched with project details
  readonly applicationsResource = rxResource({
    params: () => {
      const p: Record<string, string | number> = {
        page: this.page(),
        limit: this.pageSize(),
      };
      if (this.statusFilter()) p['status'] = this.statusFilter();
      return p;
    },
    stream: ({ params }) => {
      return this.applicationService.getMyApplications(params as any).pipe(
        switchMap((res) => {
          if (!res.data || res.data.length === 0) return of(res);
          return forkJoin(
            res.data.map((app) => this.applicationService.enrichApplication(app)),
          ).pipe(
            map((enrichedApps) => ({
              ...res,
              data: enrichedApps,
            })),
          );
        }),
      );
    },
  });

  readonly rawApplications = computed<Application[]>(() =>
    (this.applicationsResource.value() as any)?.data ?? [],
  );

  readonly totalItems = computed<number>(() =>
    (this.applicationsResource.value() as any)?.meta?.total ??
    (this.applicationsResource.value() as any)?.total ??
    this.rawApplications().length,
  );

  // Computed metrics / KPI pipeline numbers
  readonly counts = computed(() => {
    const apps = this.rawApplications();
    const counts = {
      total: apps.length,
      // Conteo exacto y no solapado por Macro-Fases
      recruitment: 0,
      academic: 0,
      workspace: 0,
      history: 0,
      interview: 0,
    };

    for (const app of apps) {
      const s = app.status;
      const hasInterview =
        s === ApplicationStatus.INTERVIEW ||
        !!app.interviews?.some((i) => i.status === 'scheduled');

      if (hasInterview) {
        counts.interview++;
      }

      if (
        s === ApplicationStatus.REJECTED ||
        s === ApplicationStatus.CANCELLED ||
        s === ApplicationStatus.WITHDRAWN
      ) {
        counts.history++;
      } else if (
        s === ApplicationStatus.IN_PROGRESS ||
        s === ApplicationStatus.COMPLETED
      ) {
        counts.workspace++;
      } else if (
        s === ApplicationStatus.ACCEPTED ||
        s === ApplicationStatus.PENDING_SUPERVISOR
      ) {
        counts.academic++;
      } else {
        counts.recruitment++;
      }
    }
    return counts;
  });

  // Client-side instant filter and sort over enriched data
  readonly filteredApplications = computed<Application[]>(() => {
    let list = [...this.rawApplications()];
    const category = this.selectedCategory();
    const query = this.searchQuery().trim().toLowerCase();
    const sort = this.sortBy();

    // 1. Category Filter (alineado 1:1 con Macro-Fases)
    if (category !== 'all') {
      list = list.filter((app) => {
        const s = app.status;
        switch (category) {
          case 'phase_recruitment':
            return (
              s === ApplicationStatus.PENDING ||
              s === ApplicationStatus.UNDER_REVIEW ||
              s === ApplicationStatus.SHORTLISTED ||
              s === ApplicationStatus.INTERVIEW
            );
          case 'phase_academic':
            return (
              s === ApplicationStatus.ACCEPTED ||
              s === ApplicationStatus.PENDING_SUPERVISOR
            );
          case 'phase_workspace':
            return (
              s === ApplicationStatus.IN_PROGRESS ||
              s === ApplicationStatus.COMPLETED
            );
          case 'history':
            return (
              s === ApplicationStatus.REJECTED ||
              s === ApplicationStatus.CANCELLED ||
              s === ApplicationStatus.WITHDRAWN
            );
          case 'interview':
            return (
              s === ApplicationStatus.INTERVIEW ||
              !!app.interviews?.some((i) => i.status === 'scheduled')
            );
          default:
            return true;
        }
      });
    }

    // 2. Search Query (title, company, description, skills)
    if (query) {
      list = list.filter((app) => {
        const projectTitle = (
          app.project?.title ||
          app.projectTitle ||
          ''
        ).toLowerCase();
        const company = (
          app.companyName ||
          app.project?.companyName ||
          ''
        ).toLowerCase();
        const cover = (app.coverLetter || '').toLowerCase();
        const skills = (app.project?.skills || [])
          .map((s) => s.name.toLowerCase())
          .join(' ');

        return (
          projectTitle.includes(query) ||
          company.includes(query) ||
          cover.includes(query) ||
          skills.includes(query)
        );
      });
    }

    // 3. Sorting
    list.sort((a, b) => {
      if (sort === 'recent') {
        return (
          new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
        );
      }
      if (sort === 'match') {
        const scoreA = a.matchScore ?? 0;
        const scoreB = b.matchScore ?? 0;
        return scoreB - scoreA;
      }
      if (sort === 'company') {
        const compA = a.companyName || a.project?.companyName || '';
        const compB = b.companyName || b.project?.companyName || '';
        return compA.localeCompare(compB);
      }
      if (sort === 'title') {
        const titA = a.project?.title || a.projectTitle || '';
        const titB = b.project?.title || b.projectTitle || '';
        return titA.localeCompare(titB);
      }
      return 0;
    });

    return list;
  });

  // Check if any filter is currently active
  readonly hasActiveFilters = computed<boolean>(() => {
    return (
      this.selectedCategory() !== 'all' ||
      !!this.searchQuery().trim() ||
      !!this.statusFilter()
    );
  });

  setCategory(category: ApplicationFilterCategory): void {
    this.selectedCategory.set(category);
  }

  toggleCategory(category: ApplicationFilterCategory): void {
    if (this.selectedCategory() === category) {
      this.selectedCategory.set('all');
    } else {
      this.selectedCategory.set(category);
    }
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedCategory.set('all');
    this.statusFilter.set('');
    this.sortBy.set('recent');
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
  }

  getActionConfig(app: Application) {
    const hasInterview = !!app.interviews?.some((i) => i.status === 'scheduled');
    return resolveApplicationPhase(app.status, hasInterview).ctaConfig;
  }

  getApplicationPhaseInfo(app: Application) {
    const hasInterview = !!app.interviews?.some((i) => i.status === 'scheduled');
    return resolveApplicationPhase(app.status, hasInterview);
  }

  openCoverLetter(app: Application): void {
    this.dialog.open(CoverLetterDialogComponent, {
      data: { application: app } satisfies CoverLetterDialogData,
      width: '620px',
      maxWidth: '92vw',
    });
  }

  onPageChanged(event: { page: number; limit: number }): void {
    this.page.set(event.page);
    this.pageSize.set(event.limit);
  }

  withdrawApplication(id: string): void {
    const app = this.rawApplications().find((a) => a.id === id);
    const projectTitle =
      app?.project?.title || app?.projectTitle || 'el proyecto seleccionado';
    const company =
      app?.companyName || app?.project?.companyName || 'la empresa aliada';

    const ref = this.dialog.open(WithdrawDialogComponent, {
      data: {
        projectTitle,
        companyName: company,
      } satisfies WithdrawDialogData,
      width: '580px',
      maxWidth: '92vw',
    });

    ref.afterClosed().subscribe((res: WithdrawDialogResult | undefined) => {
      if (res?.confirmed) {
        this.applicationService.withdraw(id, res.reason).subscribe({
          next: () => {
            this.snackBar.open('Postulación retirada correctamente', 'Cerrar', {
              duration: 3500,
            });
            this.applicationsResource.reload();
          },
          error: (err) => {
            const errorMsg =
              err?.error?.message ||
              'No se pudo retirar la postulación. Intenta nuevamente.';
            this.snackBar.open(
              Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg,
              'Cerrar',
              { duration: 4000 },
            );
          },
        });
      }
    });
  }
}
