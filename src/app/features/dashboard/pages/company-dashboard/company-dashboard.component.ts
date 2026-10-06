import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
  signal,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser, DatePipe, UpperCasePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { httpResource } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { forkJoin, of } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { environment } from '../../../../../environments/environment';
import {
  PaginatedResponse,
  Project,
  Application,
  CompanyProfile,
  CompanyMetrics,
  normalizeApiResponse,
} from '../../../../core/models';
import { ApplicationStatus } from '../../../../core/enums';
import { ApplicationService } from '../../../../features/applications/services/application.service';
import { ToastService } from '../../../../core/services/toast.service';
import { NotificationsStore } from '../../../../state/notifications.store';
import { AuthStore } from '../../../../state/auth.store';
import { StatCardComponent } from '../../../../shared/components/ui/stat-card/stat-card.component';
import { StatusBadgeComponent } from '../../../../shared/components/ui/status-badge/status-badge.component';
import { MatchScoreBarComponent } from '../../../../shared/components/ui/match-score-bar/match-score-bar.component';
import { SkeletonComponent } from '../../../../shared/components/ui/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state.component';
import { RelativeTimePipe, ImageUrlPipe } from '../../../../shared/pipes';

@Component({
  selector: 'app-company-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    DatePipe,
    UpperCasePipe,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressBarModule,
    StatCardComponent,
    StatusBadgeComponent,
    MatchScoreBarComponent,
    SkeletonComponent,
    EmptyStateComponent,
    RelativeTimePipe,
    ImageUrlPipe,
  ],
  templateUrl: './company-dashboard.component.html',
  styleUrl: './company-dashboard.component.scss',
})
export class CompanyDashboardComponent {
  readonly router = inject(Router);
  readonly authStore = inject(AuthStore);
  readonly notificationsStore = inject(NotificationsStore);
  private readonly applicationService = inject(ApplicationService);
  private readonly toastService = inject(ToastService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  // --- Perfil de la empresa ---
  readonly companyProfileResource = httpResource<any>(
    () => (this.isBrowser ? { url: `${environment.apiUrl}/companies/profile` } : undefined)
  );

  readonly companyProfile = computed(() => {
    const val = this.companyProfileResource.value();
    return val ? normalizeApiResponse<CompanyProfile>(val).data : null;
  });

  readonly companyName = computed(() => {
    return this.companyProfile()?.companyName || this.authStore.displayName() || 'Empresa';
  });

  readonly logoUrl = computed(() => {
    return this.companyProfile()?.logoUrl || this.authStore.profile()?.avatarUrl || null;
  });

  readonly companyInitials = computed(() => {
    const name = this.companyName();
    if (!name) return 'CO';
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  });

  readonly isVerified = computed(() => {
    const p = this.companyProfile();
    return p?.verificationStatus === 'verified' || p?.isVerified === true;
  });

  readonly companySizeLabel = computed(() => {
    const size = this.companyProfile()?.companySize;
    if (!size) return '';
    const map: Record<string, string> = {
      startup: 'Startup',
      micro: 'Microempresa',
      small: 'Pequeña empresa',
      medium: 'Mediana empresa',
      large: 'Gran empresa',
      enterprise: 'Corporación',
    };
    return map[size] || size.toUpperCase();
  });

  readonly greetingTime = computed(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return '¡Buenos días';
    if (hour >= 12 && hour < 19) return '¡Buenas tardes';
    return '¡Buenas noches';
  });

  // --- Proyectos publicados / activos ---
  readonly projectsResource = httpResource<PaginatedResponse<Project>>(
    () =>
      this.isBrowser
        ? { url: `${environment.apiUrl}/projects/my-projects`, params: { status: 'published' } }
        : undefined
  );

  readonly projects = computed<Project[]>(() => {
    return this.projectsResource.value()?.data ?? [];
  });

  readonly activeProjectsCount = computed(() => {
    const val = this.projectsResource.value();
    return (val as any)?.total ?? val?.meta?.total ?? this.projects().length;
  });

  readonly activeStudentsCount = computed(() => {
    const projects = this.projects();
    return projects.reduce((sum, p) => sum + (p.positionsFilled || 0), 0);
  });

  // --- Aplicaciones recibidas pendientes ---
  readonly applicationsResource = rxResource({
    params: () => (this.isBrowser ? { status: 'pending', limit: '6' } : undefined),
    stream: ({ params }) => {
      if (!params) return of({ data: [], total: 0 } as any);
      return this.applicationService.getReceivedApplications(params as any).pipe(
        switchMap((res) => {
          if (!res.data || res.data.length === 0) return of(res);
          return forkJoin(
            res.data.map((app) => this.applicationService.enrichApplication(app))
          ).pipe(
            map((enrichedApps) => ({ ...res, data: enrichedApps })),
            catchError(() => of(res))
          );
        }),
        catchError(() => of({ data: [], total: 0 } as any))
      );
    },
  });

  readonly pendingApplications = computed<Application[]>(() => {
    return this.applicationsResource.value()?.data ?? [];
  });

  readonly pendingApplicationsCount = computed(() => {
    const val = this.applicationsResource.value();
    return (val as any)?.total ?? val?.meta?.total ?? this.pendingApplications().length;
  });

  // --- Métricas y Analytics ---
  readonly metricsResource = httpResource<CompanyMetrics>(() => {
    if (!this.isBrowser) return undefined;
    const userId = this.authStore.user()?.id;
    if (!userId) return undefined;
    return { url: `${environment.apiUrl}/analytics/companies/${userId}/summary` };
  });

  readonly avgRating = computed(() => {
    const rating = this.metricsResource.value()?.avgEvaluationReceived;
    return rating != null ? (+rating).toFixed(1) : '—';
  });

  readonly completionRate = computed(() => {
    const rate = this.metricsResource.value()?.completionRate;
    return rate != null ? `${Math.round(rate)}%` : null;
  });

  // --- Helpers de vista ---
  getFillPercentage(proj: Project): number {
    if (!proj.positionsAvailable || proj.positionsAvailable <= 0) return 0;
    return Math.min(
      100,
      Math.round(((proj.positionsFilled || 0) / proj.positionsAvailable) * 100)
    );
  }

  getScoreBadgeClass(score?: number): string {
    if (score == null) return 'score-pill--neutral';
    if (score >= 80) return 'score-pill--high';
    if (score >= 60) return 'score-pill--medium';
    return 'score-pill--low';
  }

  getStudentDisplayName(app: Application): string {
    const u = app.student?.user;
    if (u?.firstName || u?.lastName) {
      return `${u.firstName || ''} ${u.lastName || ''}`.trim();
    }
    return app.student?.studentCode
      ? `Estudiante #${app.student.studentCode}`
      : 'Candidato Estudiante';
  }

  getStudentInitials(app: Application): string {
    const u = app.student?.user;
    if (u?.firstName && u?.lastName) {
      return `${u.firstName[0]}${u.lastName[0]}`.toUpperCase();
    }
    if (u?.firstName) {
      return u.firstName.slice(0, 2).toUpperCase();
    }
    return 'ES';
  }
}
