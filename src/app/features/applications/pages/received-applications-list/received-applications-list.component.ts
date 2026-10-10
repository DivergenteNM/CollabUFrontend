import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { of, forkJoin } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';

import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { Application, Project } from '../../../../core/models';
import { ApplicationStatus } from '../../../../core/enums';
import { ApplicationService } from '../../services/application.service';
import { ProjectService } from '../../../projects/services/project.service';

import { CandidateCardComponent } from '../../components/candidate-card/candidate-card.component';
import { CandidateProfileDialogComponent } from '../../components/candidate-profile-dialog/candidate-profile-dialog.component';
import { CoverLetterDialogComponent } from '../../components/cover-letter-dialog/cover-letter-dialog.component';
import { ScheduleInterviewDialogComponent, ScheduleInterviewResult } from '../../../selection-workspace/components/schedule-interview-dialog/schedule-interview-dialog.component';
import { RejectApplicationDialogComponent } from '../../../selection-workspace/components/reject-application-dialog/reject-application-dialog.component';

import { StatusBadgeComponent } from '../../../../shared/components/ui/status-badge/status-badge.component';
import { PaginatorComponent } from '../../../../shared/components/ui/paginator/paginator.component';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../../shared/components/ui/skeleton/skeleton.component';

export type FunnelStage =
  | 'all'
  | 'pending_review'
  | 'shortlisted'
  | 'interview'
  | 'accepted'
  | 'rejected';

@Component({
  selector: 'app-received-applications-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatMenuModule,
    MatDialogModule,
    MatSnackBarModule,
    CandidateCardComponent,
    StatusBadgeComponent,
    PaginatorComponent,
    EmptyStateComponent,
    SkeletonComponent,
  ],
  templateUrl: './received-applications-list.component.html',
  styleUrl: './received-applications-list.component.scss',
})
export class ReceivedApplicationsListComponent {
  readonly router = inject(Router);
  private readonly applicationService = inject(ApplicationService);
  private readonly projectService = inject(ProjectService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly ApplicationStatus = ApplicationStatus;

  // Filter signals
  readonly searchQuery = signal<string>('');
  readonly selectedFunnelStage = signal<FunnelStage>('all');
  readonly selectedProjectId = signal<string>('');
  readonly minMatch = signal<string>('');
  readonly sortBy = signal<'appliedAt' | 'matchScore' | 'name'>('appliedAt');
  readonly viewMode = signal<'grid' | 'list'>('grid');
  readonly page = signal<number>(1);
  readonly pageSize = signal<number>(12);

  // Proyectos de la empresa para el selector de proyectos
  readonly companyProjectsResource = rxResource({
    stream: () =>
      this.projectService.getMyProjects({ page: 1, limit: 50 }).pipe(
        map((res) => res.data ?? []),
      ),
  });

  readonly companyProjects = computed<Project[]>(() =>
    this.companyProjectsResource.value() ?? [],
  );

  // Postulaciones recibidas enriquecidas con estudiantes y proyectos
  readonly applicationsResource = rxResource({
    params: () => {
      const p: Record<string, string | number> = {
        page: this.page(),
        limit: 50, // Permite evaluar fluidamente con filtrado ágil
        sortBy: this.sortBy() === 'name' ? 'appliedAt' : this.sortBy(),
      };
      const projId = this.selectedProjectId();
      if (projId) p['projectId'] = projId;
      const mm = this.minMatch();
      if (mm) p['minMatchScore'] = mm;
      return p;
    },
    stream: ({ params }) =>
      this.applicationService.getReceivedApplications(params as any).pipe(
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
      ),
  });

  readonly rawApplications = computed<Application[]>(() =>
    (this.applicationsResource.value() as any)?.data ?? [],
  );

  readonly totalItems = computed<number>(() =>
    (this.applicationsResource.value() as any)?.total ??
    this.rawApplications().length,
  );

  // Embudo de métricas / KPIs
  readonly counts = computed(() => {
    const list = this.rawApplications();
    const stats = {
      total: list.length,
      pendingReview: 0,
      shortlisted: 0,
      interview: 0,
      accepted: 0,
      rejected: 0,
      avgMatch: 0,
    };

    let totalScore = 0;
    let scoredCount = 0;

    for (const app of list) {
      const s = app.status;
      if (s === ApplicationStatus.PENDING || s === ApplicationStatus.UNDER_REVIEW) {
        stats.pendingReview++;
      } else if (s === ApplicationStatus.SHORTLISTED) {
        stats.shortlisted++;
      } else if (
        s === ApplicationStatus.INTERVIEW ||
        app.interviews?.some((i) => i.status === 'scheduled')
      ) {
        stats.interview++;
      } else if (
        s === ApplicationStatus.ACCEPTED ||
        s === ApplicationStatus.IN_PROGRESS ||
        s === ApplicationStatus.COMPLETED
      ) {
        stats.accepted++;
      } else if (
        s === ApplicationStatus.REJECTED ||
        s === ApplicationStatus.CANCELLED ||
        s === ApplicationStatus.WITHDRAWN
      ) {
        stats.rejected++;
      }

      if (app.matchScore !== undefined && app.matchScore !== null) {
        totalScore += app.matchScore;
        scoredCount++;
      }
    }

    stats.avgMatch = scoredCount > 0 ? Math.round(totalScore / scoredCount) : 0;
    return stats;
  });

  // Filtrado instantáneo por buscador y etapa del embudo
  readonly filteredApplications = computed<Application[]>(() => {
    let list = [...this.rawApplications()];
    const stage = this.selectedFunnelStage();
    const query = this.searchQuery().trim().toLowerCase();
    const sort = this.sortBy();

    // 1. Filtro por etapa del embudo
    if (stage !== 'all') {
      list = list.filter((app) => {
        const s = app.status;
        switch (stage) {
          case 'pending_review':
            return s === ApplicationStatus.PENDING || s === ApplicationStatus.UNDER_REVIEW;
          case 'shortlisted':
            return s === ApplicationStatus.SHORTLISTED;
          case 'interview':
            return (
              s === ApplicationStatus.INTERVIEW ||
              !!app.interviews?.some((i) => i.status === 'scheduled')
            );
          case 'accepted':
            return (
              s === ApplicationStatus.ACCEPTED ||
              s === ApplicationStatus.IN_PROGRESS ||
              s === ApplicationStatus.COMPLETED
            );
          case 'rejected':
            return (
              s === ApplicationStatus.REJECTED ||
              s === ApplicationStatus.CANCELLED ||
              s === ApplicationStatus.WITHDRAWN
            );
          default:
            return true;
        }
      });
    }

    // 2. Filtro de búsqueda en tiempo real
    if (query) {
      list = list.filter((app) => {
        const user = app.student?.user;
        const studentName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.toLowerCase();
        const code = (app.student?.studentCode ?? '').toLowerCase();
        const program = (app.student?.program ?? '').toLowerCase();
        const projectTitle = (app.project?.title ?? app.projectTitle ?? '').toLowerCase();
        const skills = (app.student?.skills ?? []).map((s) => s.name.toLowerCase()).join(' ');

        return (
          studentName.includes(query) ||
          code.includes(query) ||
          program.includes(query) ||
          projectTitle.includes(query) ||
          skills.includes(query)
        );
      });
    }

    // 3. Ordenamiento
    if (sort === 'matchScore') {
      list.sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
    } else if (sort === 'name') {
      list.sort((a, b) => {
        const nameA = `${a.student?.user?.firstName ?? ''} ${a.student?.user?.lastName ?? ''}`.trim();
        const nameB = `${b.student?.user?.firstName ?? ''} ${b.student?.user?.lastName ?? ''}`.trim();
        return nameA.localeCompare(nameB);
      });
    } else {
      // 'appliedAt' más recientes primero
      list.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
    }

    return list;
  });

  readonly hasActiveFilters = computed(() => {
    return (
      this.selectedFunnelStage() !== 'all' ||
      !!this.searchQuery().trim() ||
      !!this.selectedProjectId() ||
      !!this.minMatch()
    );
  });

  // Métodos de acción
  setFunnelStage(stage: FunnelStage): void {
    this.selectedFunnelStage.set(stage);
  }

  resetFilters(): void {
    this.selectedFunnelStage.set('all');
    this.searchQuery.set('');
    this.selectedProjectId.set('');
    this.minMatch.set('');
    this.sortBy.set('appliedAt');
    this.page.set(1);
  }

  onPageChanged(event: { page: number; limit: number }): void {
    this.page.set(event.page);
  }

  onChangeStatus(event: { id: string; status: ApplicationStatus; notes?: string }): void {
    this.applicationService.changeStatus(event.id, event.status, event.notes).subscribe({
      next: () => {
        this.snackBar.open('Estado de postulación actualizado', 'OK', { duration: 3000 });
        this.applicationsResource.reload();
      },
      error: () => this.snackBar.open('Error al actualizar estado', 'Cerrar', { duration: 4000 }),
    });
  }

  openCandidateProfile(app: Application): void {
    const ref = this.dialog.open(CandidateProfileDialogComponent, {
      data: { application: app },
      width: '800px',
      maxWidth: '95vw',
      panelClass: 'candidate-profile-modal-container',
    });

    ref.afterClosed().subscribe((res) => {
      if (!res) return;
      if (res.action === 'changeStatus') {
        this.onChangeStatus({ id: app.id, status: res.status });
      } else if (res.action === 'scheduleInterview') {
        this.openScheduleInterview(app);
      } else if (res.action === 'reject') {
        this.openRejectDialog(app);
      }
    });
  }

  openScheduleInterview(app: Application): void {
    const ref = this.dialog.open(ScheduleInterviewDialogComponent, { width: '520px' });
    ref.afterClosed().subscribe((result: ScheduleInterviewResult | undefined) => {
      if (!result) return;
      this.applicationService.scheduleInterview(app.id, result).subscribe({
        next: () => {
          this.snackBar.open('Entrevista agendada exitosamente', 'OK', { duration: 3500 });
          this.applicationsResource.reload();
        },
        error: () => this.snackBar.open('No se pudo programar la entrevista', 'Cerrar', { duration: 4000 }),
      });
    });
  }

  openRejectDialog(app: Application): void {
    const ref = this.dialog.open(RejectApplicationDialogComponent);
    ref.afterClosed().subscribe((reason: string | undefined) => {
      if (!reason) return;
      this.applicationService.changeStatus(app.id, ApplicationStatus.REJECTED, reason).subscribe({
        next: () => {
          this.snackBar.open('Postulación descartada', 'OK', { duration: 3000 });
          this.applicationsResource.reload();
        },
        error: () => this.snackBar.open('No se pudo descartar la postulación', 'Cerrar', { duration: 4000 }),
      });
    });
  }

  openCoverLetter(app: Application): void {
    this.dialog.open(CoverLetterDialogComponent, {
      data: { application: app },
      width: '600px',
    });
  }

  goToWorkspace(id: string): void {
    this.router.navigate(['/workspace', id]);
  }
}
