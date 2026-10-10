import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';

import { Application } from '../../../../core/models';
import { ApplicationStatus } from '../../../../core/enums';
import { StatusBadgeComponent } from '../../../../shared/components/ui/status-badge/status-badge.component';

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
    MatChipsModule,
    StatusBadgeComponent,
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

  readonly circumference = 2 * Math.PI * 24; // r = 24 for gauge

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

  readonly institution = computed(() => {
    const student = this.application().student;
    if (student?.education && student.education.length > 0) {
      return student.education[0].institution;
    }
    return student?.faculty || 'Universidad';
  });

  readonly semester = computed(() => {
    const sem = this.application().student?.semester;
    return sem ? `${sem}.° semestre` : null;
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

  readonly strokeDashoffset = computed(() => {
    const score = this.normalizedMatchScore();
    if (score === null) return this.circumference;
    return this.circumference - (score / 100) * this.circumference;
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
        return 'Excelente afinidad';
      case 'high':
        return 'Alta afinidad';
      case 'moderate':
        return 'Afinidad moderada';
      default:
        return 'Afinidad inicial';
    }
  });

  readonly skillsList = computed<SkillMatchInfo[]>(() => {
    const projectSkillNames = new Set(
      (this.application().project?.skills || []).map((s) => (s.name || '').toLowerCase().trim())
    );
    const studentSkills = this.application().student?.skills || [];
    return studentSkills.slice(0, 6).map((sk) => ({
      name: sk.name,
      isMatch: projectSkillNames.has((sk.name || '').toLowerCase().trim()),
    }));
  });

  readonly matchingSkillsCount = computed(() => {
    return this.skillsList().filter((s) => s.isMatch).length;
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

  readonly coverLetterSnippet = computed(() => {
    const cl = this.application().coverLetter;
    if (!cl) return null;
    return cl.length > 130 ? `${cl.substring(0, 130)}...` : cl;
  });

  // Action capabilities
  readonly canReview = computed(() => {
    return this.application().status === ApplicationStatus.PENDING;
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
}
