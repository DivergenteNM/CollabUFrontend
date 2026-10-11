import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { Application } from '../../../../core/models';
import { ApplicationStatus } from '../../../../core/enums';
import { ApplicationService } from '../../services/application.service';
import { StatusBadgeComponent } from '../../../../shared/components/ui/status-badge/status-badge.component';

export interface CandidateProfileDialogData {
  application: Application;
}

@Component({
  selector: 'app-candidate-profile-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatChipsModule,
    MatTooltipModule,
    MatSnackBarModule,
    StatusBadgeComponent,
  ],
  templateUrl: './candidate-profile-dialog.component.html',
  styleUrl: './candidate-profile-dialog.component.scss',
})
export class CandidateProfileDialogComponent {
  readonly data = inject<CandidateProfileDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<CandidateProfileDialogComponent>);
  private readonly router = inject(Router);
  private readonly applicationService = inject(ApplicationService);
  private readonly snackBar = inject(MatSnackBar);

  readonly ApplicationStatus = ApplicationStatus;
  readonly privateNotes = signal<string>(this.data.application.notes || '');
  readonly isSavingNotes = signal<boolean>(false);

  get application(): Application {
    return this.data.application;
  }

  readonly fullName = computed(() => {
    const user = this.application.student?.user;
    if (user?.firstName) {
      return `${user.firstName} ${user.lastName || ''}`.trim();
    }
    const code = this.application.student?.studentCode;
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
    return this.application.student?.user?.avatarUrl || null;
  });

  readonly email = computed(() => {
    return (this.application.student?.user as any)?.email || null;
  });

  readonly phone = computed(() => {
    return this.application.student?.user?.phone || null;
  });

  readonly program = computed(() => {
    return this.application.student?.program || 'Programa Académico';
  });

  readonly institution = computed(() => {
    const student = this.application.student;
    if (student?.education && student.education.length > 0) {
      return student.education[0].institution;
    }
    return student?.faculty || 'Universidad';
  });

  readonly semester = computed(() => {
    const sem = this.application.student?.semester;
    return sem ? `${sem}.° semestre` : null;
  });

  readonly gpa = computed(() => {
    const g = this.application.student?.gpa;
    return g !== undefined && g !== null && g > 0 ? g.toFixed(1) : null;
  });

  readonly resumeUrl = computed(() => {
    return this.application.resumeUrl || this.application.student?.cvUrl || null;
  });

  readonly portfolioUrl = computed(() => {
    return this.application.portfolioUrl || this.application.student?.portfolioUrl || null;
  });

  readonly githubUrl = computed(() => {
    return this.application.student?.githubUrl || null;
  });

  readonly projectTitle = computed(() => {
    return this.application.project?.title || this.application.projectTitle || 'Proyecto';
  });

  readonly normalizedMatchScore = computed(() => {
    const score = this.application.matchScore;
    if (score === undefined || score === null || isNaN(score)) return null;
    return Math.max(0, Math.min(100, Math.round(score)));
  });

  readonly matchingSkills = computed(() => {
    const projectSkillNames = new Set(
      (this.application.project?.skills || []).map((s) => (s.name || '').toLowerCase().trim())
    );
    const studentSkills = this.application.student?.skills || [];
    return studentSkills.map((sk) => ({
      name: sk.name,
      isMatch: projectSkillNames.has((sk.name || '').toLowerCase().trim()),
      level: sk.proficiencyLevel,
    }));
  });

  readonly upcomingInterview = computed(() => {
    return this.application.interviews?.find((i) => i.status === 'scheduled');
  });

  saveNotes(): void {
    const notes = this.privateNotes().trim();
    this.isSavingNotes.set(true);
    this.applicationService.updateNotes(this.application.id, notes).subscribe({
      next: () => {
        this.isSavingNotes.set(false);
        this.snackBar.open('Notas privadas actualizadas', 'OK', { duration: 2500 });
      },
      error: () => {
        this.isSavingNotes.set(false);
        this.snackBar.open('Error al guardar notas', 'Cerrar', { duration: 3000 });
      },
    });
  }

  goToWorkspace(): void {
    this.dialogRef.close();
    this.router.navigate(['/workspace', this.application.id]);
  }

  actionChangeStatus(status: ApplicationStatus): void {
    this.dialogRef.close({ action: 'changeStatus', status });
  }

  actionScheduleInterview(): void {
    this.dialogRef.close({ action: 'scheduleInterview' });
  }

  actionReject(): void {
    this.dialogRef.close({ action: 'reject' });
  }
}
