import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Application } from '../../../../core/models';
import { ApplicationStatus } from '../../../../core/enums';
import { StatusBadgeComponent } from '../../../../shared/components/ui/status-badge/status-badge.component';
import { MacroPhaseStepperComponent } from '../../../../shared/components/ui/macro-phase-stepper/macro-phase-stepper.component';

export interface SkillMatchInfo {
  name: string;
  isMatch: boolean;
}

@Component({
  selector: 'app-candidate-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    MatTooltipModule,
    StatusBadgeComponent,
    MacroPhaseStepperComponent,
  ],
  host: { 'class': 'candidate-card-host' },
  templateUrl: './candidate-card.component.html',
  styleUrl: './candidate-card.component.scss',
})
export class CandidateCardComponent {
  readonly application = input.required<Application>();
  readonly isEvaluating = input<boolean>(false);

  readonly viewDetail = output<string>();
  readonly changeStatus = output<{ id: string; status: ApplicationStatus; notes?: string }>();
  readonly scheduleInterview = output<Application>();
  readonly rejectApplication = output<Application>();
  readonly viewProfile = output<Application>();
  readonly viewCoverLetter = output<Application>();

  readonly ApplicationStatus = ApplicationStatus;

  readonly fullName = computed(() => {
    const user = this.application().student?.user;
    if (user?.firstName) {
      return `${user.firstName} ${user.lastName || ''}`.trim();
    }
    const code = this.application().student?.studentCode;
    if (code) return `Estudiante #${code}`;
    return 'Candidato Universitario';
  });

  readonly initials = computed(() => {
    const name = this.fullName();
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return (name[0] || 'C').toUpperCase();
  });

  readonly avatarUrl = computed(() => {
    return this.application().student?.user?.avatarUrl || null;
  });

  readonly program = computed(() => {
    return this.application().student?.program || 'Programa Académico';
  });

  readonly semester = computed(() => {
    const sem = this.application().student?.semester;
    return sem ? `Sem. ${sem}` : null;
  });

  readonly gpa = computed(() => {
    const g = this.application().student?.gpa;
    return g !== undefined && g !== null && g > 0 ? g.toFixed(1) : null;
  });

  readonly projectTitle = computed(() => {
    return this.application().project?.title || this.application().projectTitle || 'Proyecto sin título';
  });

  readonly normalizedMatchScore = computed(() => {
    const score = this.application().matchScore;
    if (score === undefined || score === null || isNaN(score)) return null;
    return Math.max(0, Math.min(100, Math.round(score)));
  });

  readonly matchTone = computed<'excellent' | 'high' | 'moderate' | 'low'>(() => {
    const score = this.normalizedMatchScore();
    if (score === null) return 'low';
    if (score >= 80) return 'excellent';
    if (score >= 65) return 'high';
    if (score >= 50) return 'moderate';
    return 'low';
  });

  readonly matchLabel = computed(() => {
    switch (this.matchTone()) {
      case 'excellent':
        return 'Excelente afinidad con el perfil';
      case 'high':
        return 'Alta afinidad con el perfil';
      case 'moderate':
        return 'Afinidad moderada con el perfil';
      default:
        return 'Afinidad inicial';
    }
  });

  readonly topSkills = computed<SkillMatchInfo[]>(() => {
    const projectSkillNames = new Set(
      (this.application().project?.skills || []).map((s) => (s.name || '').toLowerCase().trim())
    );
    const studentSkills = this.application().student?.skills || [];
    const matched = studentSkills
      .filter((sk) => projectSkillNames.has((sk.name || '').toLowerCase().trim()))
      .map((sk) => ({ name: sk.name, isMatch: true }));
    const unmatched = studentSkills
      .filter((sk) => !projectSkillNames.has((sk.name || '').toLowerCase().trim()))
      .map((sk) => ({ name: sk.name, isMatch: false }));

    return [...matched, ...unmatched].slice(0, 3);
  });

  readonly upcomingInterview = computed(() => {
    return this.application().interviews?.find((i) => i.status === 'scheduled');
  });

  readonly resumeUrl = computed(() => {
    return this.application().resumeUrl || this.application().student?.cvUrl || null;
  });

  readonly portfolioUrl = computed(() => {
    return this.application().portfolioUrl || this.application().student?.portfolioUrl || null;
  });

  readonly githubUrl = computed(() => {
    return this.application().student?.githubUrl || null;
  });

  readonly primaryAction = computed(() => {
    const s = this.application().status;
    switch (s) {
      case ApplicationStatus.PENDING:
        return { label: 'Revisar', icon: 'visibility', type: 'review' };
      case ApplicationStatus.UNDER_REVIEW:
        return { label: 'Entrevistar', icon: 'event', type: 'interview' };
      case ApplicationStatus.SHORTLISTED:
        return { label: 'Entrevistar', icon: 'event', type: 'interview' };
      case ApplicationStatus.INTERVIEW:
        return { label: 'Aceptar', icon: 'check_circle', type: 'accept' };
      case ApplicationStatus.ACCEPTED:
        return { label: 'Workspace', icon: 'rocket_launch', type: 'workspace' };
      case ApplicationStatus.REJECTED:
      case ApplicationStatus.CANCELLED:
      case ApplicationStatus.WITHDRAWN:
        return { label: 'Reconsiderar', icon: 'undo', type: 'reconsider' };
      default:
        return { label: 'Workspace', icon: 'arrow_forward', type: 'workspace' };
    }
  });

  readonly canShortlist = computed(() => {
    const s = this.application().status;
    return s === ApplicationStatus.PENDING || s === ApplicationStatus.UNDER_REVIEW;
  });

  readonly canScheduleInterview = computed(() => {
    const s = this.application().status;
    return (
      s === ApplicationStatus.PENDING ||
      s === ApplicationStatus.UNDER_REVIEW ||
      s === ApplicationStatus.SHORTLISTED ||
      s === ApplicationStatus.INTERVIEW
    );
  });

  readonly canAccept = computed(() => {
    const s = this.application().status;
    return (
      s === ApplicationStatus.PENDING ||
      s === ApplicationStatus.UNDER_REVIEW ||
      s === ApplicationStatus.SHORTLISTED ||
      s === ApplicationStatus.INTERVIEW
    );
  });

  readonly canReject = computed(() => {
    const s = this.application().status;
    return (
      s !== ApplicationStatus.REJECTED &&
      s !== ApplicationStatus.CANCELLED &&
      s !== ApplicationStatus.WITHDRAWN &&
      s !== ApplicationStatus.COMPLETED
    );
  });

  readonly isAccepted = computed(() => {
    return this.application().status === ApplicationStatus.ACCEPTED;
  });

  readonly isRejected = computed(() => {
    const s = this.application().status;
    return (
      s === ApplicationStatus.REJECTED ||
      s === ApplicationStatus.CANCELLED ||
      s === ApplicationStatus.WITHDRAWN
    );
  });

  onPrimaryAction(): void {
    const action = this.primaryAction();
    switch (action.type) {
      case 'review':
        this.changeStatus.emit({ id: this.application().id, status: ApplicationStatus.UNDER_REVIEW });
        break;
      case 'interview':
        this.scheduleInterview.emit(this.application());
        break;
      case 'accept':
        this.changeStatus.emit({ id: this.application().id, status: ApplicationStatus.ACCEPTED });
        break;
      case 'reconsider':
        this.changeStatus.emit({ id: this.application().id, status: ApplicationStatus.UNDER_REVIEW });
        break;
      case 'workspace':
      default:
        this.viewDetail.emit(this.application().id);
        break;
    }
  }
}
