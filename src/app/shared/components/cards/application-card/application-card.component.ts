import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DatePipe } from '@angular/common';
import { Application } from '../../../../core/models';
import { ApplicationStatus } from '../../../../core/enums';
import { StatusBadgeComponent } from '../../ui/status-badge/status-badge.component';
import { ApplicationProgressStepperComponent } from '../../ui/application-progress-stepper/application-progress-stepper.component';

interface CardTheme {
  icon: string;
  bgClass: string;
  colorClass: string;
}

const ACTIVE_STATUSES = new Set<ApplicationStatus>([
  ApplicationStatus.PENDING,
  ApplicationStatus.UNDER_REVIEW,
  ApplicationStatus.SHORTLISTED,
  ApplicationStatus.INTERVIEW,
  ApplicationStatus.ACCEPTED,
  ApplicationStatus.PENDING_SUPERVISOR,
  ApplicationStatus.IN_PROGRESS,
]);

@Component({
  selector: 'app-application-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    MatTooltipModule,
    DatePipe,
    StatusBadgeComponent,
    ApplicationProgressStepperComponent,
  ],
  host: { 'class': 'application-card' },
  templateUrl: './application-card.component.html',
  styleUrl: './application-card.component.scss',
})
export class ApplicationCardComponent {
  readonly application = input.required<Application>();
  readonly viewMode = input<'student' | 'company'>('student');
  readonly viewDetail = output<string>();
  readonly changeStatus = output<{ id: string; status: ApplicationStatus }>();
  readonly withdraw = output<string>();
  readonly viewCoverLetter = output<Application>();

  readonly circumference = 2 * Math.PI * 26; // r = 26

  /** Mismo heurístico de temas que `ProjectCardComponent`, para consistencia visual entre catálogo y postulaciones. */
  readonly theme = computed<CardTheme>(() => {
    const project = this.application().project;
    const title = (project?.title || this.application().projectTitle || '').toLowerCase();
    const desc = (project?.description || '').toLowerCase();
    const skills = (project?.skills || []).map((s) => (s.name || '').toLowerCase()).join(' ');
    const combined = `${title} ${desc} ${skills}`;

    if (combined.includes('móvil') || combined.includes('movil') || combined.includes('mobile') || combined.includes('android') || combined.includes('ios') || combined.includes('flutter')) {
      return { icon: 'smartphone', bgClass: 'theme-green', colorClass: 'text-green' };
    }
    if (combined.includes('dato') || combined.includes('data') || combined.includes('analytics') || combined.includes('machine learning') || combined.includes('ia') || combined.includes('python')) {
      return { icon: 'pie_chart', bgClass: 'theme-purple', colorClass: 'text-purple' };
    }
    if (combined.includes('diseño') || combined.includes('ui') || combined.includes('ux') || combined.includes('figma') || combined.includes('prototipo')) {
      return { icon: 'palette', bgClass: 'theme-amber', colorClass: 'text-amber' };
    }
    if (combined.includes('inventario') || combined.includes('sistema') || combined.includes('gestión') || combined.includes('gestion') || combined.includes('logística')) {
      return { icon: 'inventory_2', bgClass: 'theme-blue', colorClass: 'text-blue' };
    }
    return { icon: 'work_outline', bgClass: 'theme-indigo', colorClass: 'text-indigo' };
  });

  readonly isActive = computed(() => ACTIVE_STATUSES.has(this.application().status));

  readonly normalizedMatchScore = computed(() => {
    const score = this.application().matchScore;
    if (score === undefined || score === null || isNaN(score)) return null;
    return Math.max(0, Math.min(100, Math.round(score)));
  });

  readonly strokeDashoffset = computed(() => {
    const score = this.normalizedMatchScore();
    if (score === null) return this.circumference;
    return this.circumference - (score / 100) * this.circumference;
  });

  readonly upcomingInterview = computed(() =>
    this.application().interviews?.find((i) => i.status === 'scheduled'),
  );

  readonly isAccepted = computed(
    () => this.application().status === ApplicationStatus.ACCEPTED,
  );

  readonly isInterview = computed(
    () =>
      this.application().status === ApplicationStatus.INTERVIEW ||
      !!this.upcomingInterview(),
  );

  readonly canWithdraw = computed(
    () =>
      this.viewMode() === 'student' &&
      (this.application().status === ApplicationStatus.PENDING ||
        this.application().status === ApplicationStatus.UNDER_REVIEW),
  );

  readonly projectSkills = computed(() =>
    this.application().project?.skills?.slice(0, 3) ?? [],
  );

  readonly locationTypeLabel = computed(() => {
    const loc = this.application().project?.locationType;
    if (loc === 'remote' || this.application().project?.isRemote) return 'Remoto';
    if (loc === 'hybrid') return 'Híbrido';
    if (loc === 'onsite') return 'Presencial';
    return null;
  });

  readonly primaryAction = computed(() => {
    const s = this.application().status;
    if (
      s === ApplicationStatus.ACCEPTED ||
      s === ApplicationStatus.IN_PROGRESS ||
      s === ApplicationStatus.PENDING_SUPERVISOR
    ) {
      return {
        label: 'Ir al Workspace',
        icon: 'rocket_launch',
        class: 'app-btn--workspace',
      };
    }
    if (s === ApplicationStatus.INTERVIEW || this.upcomingInterview()) {
      return {
        label: 'Ver Entrevista',
        icon: 'event',
        class: 'app-btn--interview',
      };
    }
    if (
      s === ApplicationStatus.UNDER_REVIEW ||
      s === ApplicationStatus.SHORTLISTED ||
      s === ApplicationStatus.PENDING
    ) {
      return {
        label: 'Ver Seguimiento',
        icon: 'visibility',
        class: 'app-btn--detail',
      };
    }
    return {
      label: 'Ver Detalle',
      icon: 'folder_open',
      class: 'app-btn--detail',
    };
  });

  readonly canChangeStatus = computed(() => {
    const s = this.application().status;
    return (
      s !== ApplicationStatus.COMPLETED &&
      s !== ApplicationStatus.CANCELLED &&
      s !== ApplicationStatus.WITHDRAWN &&
      s !== ApplicationStatus.IN_PROGRESS &&
      s !== ApplicationStatus.REJECTED
    );
  });

  readonly availableActions = computed(() => {
    const s = this.application().status;
    const actions: { status: ApplicationStatus; label: string; icon: string }[] = [];
    switch (s) {
      case ApplicationStatus.PENDING:
        actions.push(
          { status: ApplicationStatus.UNDER_REVIEW, label: 'Revisar', icon: 'visibility' },
          { status: ApplicationStatus.REJECTED, label: 'Rechazar', icon: 'cancel' },
        );
        break;
      case ApplicationStatus.UNDER_REVIEW:
        actions.push(
          { status: ApplicationStatus.INTERVIEW, label: 'Entrevistar', icon: 'event' },
          { status: ApplicationStatus.ACCEPTED, label: 'Aceptar', icon: 'check_circle' },
          { status: ApplicationStatus.REJECTED, label: 'Rechazar', icon: 'cancel' },
        );
        break;
      case ApplicationStatus.INTERVIEW:
        actions.push(
          { status: ApplicationStatus.ACCEPTED, label: 'Aceptar', icon: 'check_circle' },
          { status: ApplicationStatus.REJECTED, label: 'Rechazar', icon: 'cancel' },
        );
        break;
      case ApplicationStatus.ACCEPTED:
        actions.push(
          { status: ApplicationStatus.IN_PROGRESS, label: 'Iniciar', icon: 'play_circle' },
        );
        break;
    }
    return actions;
  });
}
