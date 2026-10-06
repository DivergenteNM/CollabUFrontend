import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
  signal,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { httpResource } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { environment } from '../../../../../environments/environment';
import {
  StudentProfile,
  RecommendationsPage,
  Recommendation,
  Application,
  Interview,
  normalizeApiResponse,
} from '../../../../core/models';
import { ApplicationStatus } from '../../../../core/enums';
import { NotificationsStore } from '../../../../state/notifications.store';
import { AuthStore } from '../../../../state/auth.store';
import { StatCardComponent } from '../../../../shared/components/ui/stat-card/stat-card.component';
import { StatusBadgeComponent } from '../../../../shared/components/ui/status-badge/status-badge.component';
import { MatchScoreBarComponent } from '../../../../shared/components/ui/match-score-bar/match-score-bar.component';
import { SkeletonComponent } from '../../../../shared/components/ui/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state.component';
import { RelativeTimePipe, ImageUrlPipe } from '../../../../shared/pipes';

export type ApplicationFilterTab = 'all' | 'in_review' | 'interview' | 'accepted';

@Component({
  selector: 'app-student-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    DatePipe,
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
  templateUrl: './student-dashboard.component.html',
  styleUrl: './student-dashboard.component.scss',
})
export class StudentDashboardComponent {
  readonly router = inject(Router);
  readonly authStore = inject(AuthStore);
  readonly notificationsStore = inject(NotificationsStore);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  // --- Filtro interactivo de postulaciones ---
  readonly activeFilter = signal<ApplicationFilterTab>('all');

  // --- Avatar y Saludo ---
  readonly avatarUrl = computed(() => {
    return this.authStore.profile()?.avatarUrl || this.profile()?.user?.avatarUrl || null;
  });

  readonly userInitials = computed(() => {
    const p = this.authStore.profile() || this.profile()?.user;
    if (p?.firstName && p?.lastName) {
      return `${p.firstName[0]}${p.lastName[0]}`.toUpperCase();
    }
    if (p?.firstName) {
      return p.firstName.slice(0, 2).toUpperCase();
    }
    return 'ES';
  });

  readonly greetingTime = computed(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return '¡Buenos días';
    if (hour >= 12 && hour < 19) return '¡Buenas tardes';
    return '¡Buenas noches';
  });

  // --- httpResource data loading (Browser-only for SSR safety) ---
  readonly profileResource = httpResource<any>(
    () => (this.isBrowser ? { url: `${environment.apiUrl}/students/profile` } : undefined)
  );

  readonly recommendationsResource = httpResource<RecommendationsPage>(
    () =>
      this.isBrowser
        ? { url: `${environment.apiUrl}/matching/recommendations`, params: { limit: '4' } }
        : undefined
  );

  readonly applicationsResource = httpResource<any>(
    () =>
      this.isBrowser
        ? { url: `${environment.apiUrl}/applications/my`, params: { limit: '10' } }
        : undefined
  );

  // --- Perfil del estudiante ---
  readonly profile = computed(() => {
    const val = this.profileResource.value();
    return val ? normalizeApiResponse<StudentProfile>(val).data : null;
  });

  readonly profileCompleteness = computed(() => {
    const p = this.profile();
    if (!p) return this.authStore.profile()?.profileCompleteness ?? 0;
    return p.profileCompleteness ?? 0;
  });

  // --- Recomendaciones de Smart Matching ---
  readonly recommendations = computed<Recommendation[]>(() => {
    return this.recommendationsResource.value()?.data ?? [];
  });

  readonly recommendationsCount = computed(() => {
    return this.recommendationsResource.value()?.total ?? this.recommendations().length;
  });

  readonly bestMatchScore = computed(() => {
    const recs = this.recommendations();
    if (recs.length === 0) return null;
    const scores = recs.map((r) => r.matchResult?.overallScore ?? 0);
    return Math.round(Math.max(...scores));
  });

  // --- Postulaciones ---
  readonly applications = computed<Application[]>(() => {
    const val = this.applicationsResource.value();
    if (!val) return [];
    if (Array.isArray(val.data)) return val.data;
    if (Array.isArray(val)) return val;
    return [];
  });

  readonly activeApplicationsCount = computed(() => {
    const val = this.applicationsResource.value();
    return (val as any)?.total ?? val?.meta?.total ?? this.applications().length;
  });

  // Resumen de estados para KPI
  readonly applicationCountsSummary = computed(() => {
    const apps = this.applications();
    let inReview = 0;
    let inInterview = 0;
    let accepted = 0;

    for (const app of apps) {
      if (
        app.status === ApplicationStatus.PENDING ||
        app.status === ApplicationStatus.UNDER_REVIEW ||
        app.status === ApplicationStatus.SHORTLISTED
      ) {
        inReview++;
      } else if (
        app.status === ApplicationStatus.INTERVIEW ||
        (app.status as string) === 'technical_test'
      ) {
        inInterview++;
      } else if (
        app.status === ApplicationStatus.ACCEPTED ||
        app.status === ApplicationStatus.IN_PROGRESS
      ) {
        accepted++;
      }
    }

    return { inReview, inInterview, accepted, total: apps.length };
  });

  // Postulaciones filtradas por pestaña
  readonly filteredApplications = computed(() => {
    const apps = this.applications();
    const filter = this.activeFilter();

    if (filter === 'all') return apps;

    if (filter === 'in_review') {
      return apps.filter(
        (a) =>
          a.status === ApplicationStatus.PENDING ||
          a.status === ApplicationStatus.UNDER_REVIEW ||
          a.status === ApplicationStatus.SHORTLISTED
      );
    }

    if (filter === 'interview') {
      return apps.filter(
        (a) =>
          a.status === ApplicationStatus.INTERVIEW ||
          (a.status as string) === 'technical_test'
      );
    }

    if (filter === 'accepted') {
      return apps.filter(
        (a) =>
          a.status === ApplicationStatus.ACCEPTED ||
          a.status === ApplicationStatus.IN_PROGRESS ||
          a.status === ApplicationStatus.COMPLETED
      );
    }

    return apps;
  });

  // --- Próxima Entrevista Programada ---
  readonly upcomingInterview = computed<{ app: Application; interview: Interview } | null>(() => {
    const apps = this.applications();
    const upcoming: { app: Application; interview: Interview }[] = [];

    for (const app of apps) {
      if (app.interviews && Array.isArray(app.interviews)) {
        for (const interview of app.interviews) {
          if (interview.status === 'scheduled') {
            upcoming.push({ app, interview });
          }
        }
      }
    }

    if (upcoming.length === 0) return null;

    upcoming.sort(
      (a, b) =>
        new Date(a.interview.scheduledAt).getTime() - new Date(b.interview.scheduledAt).getTime()
    );

    return upcoming[0];
  });

  // --- Pro-Tip contextual de estudiante ---
  readonly proTip = computed(() => {
    const completeness = this.profileCompleteness();
    if (completeness < 50) {
      return {
        icon: 'stars',
        tag: 'Primeros pasos',
        title: 'Impulsa tus oportunidades',
        text: 'Completa tu información académica y habilidades para que las empresas y nuestro algoritmo puedan recomendarte proyectos con máxima afinidad.',
        actionLabel: 'Completar perfil',
        link: '/profile/edit',
      };
    }
    if (completeness < 85) {
      return {
        icon: 'trending_up',
        tag: 'Recomendación Pro',
        title: 'Añade tu CV y enlaces clave',
        text: 'Los perfiles con enlaces a GitHub, portafolio y niveles de habilidad verificados tienen una tasa de respuesta 65% más alta en procesos de selección.',
        actionLabel: 'Actualizar CV y enlaces',
        link: '/profile/edit',
      };
    }
    return {
      icon: 'verified',
      tag: 'Perfil Destacado',
      title: '¡Tu perfil brilla!',
      text: 'Tu perfil tiene un nivel sobresaliente. Revisa tus recomendaciones frecuentemente y mantén tu disponibilidad al día para no perder vacantes.',
      actionLabel: 'Explorar proyectos',
      link: '/projects',
    };
  });

  // --- Métodos de interacción ---
  setFilter(tab: ApplicationFilterTab): void {
    this.activeFilter.set(tab);
  }

  getMatchedSkills(rec: Recommendation): string[] {
    const matched = rec.matchResult?.skillsBreakdown?.matched;
    if (Array.isArray(matched) && matched.length > 0) {
      return matched.slice(0, 3).map((s) => s.name);
    }
    return [];
  }

  getScoreBadgeClass(score: number): string {
    if (score >= 80) return 'score-pill--high';
    if (score >= 60) return 'score-pill--medium';
    return 'score-pill--low';
  }
}
