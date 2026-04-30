import {
  Component, ChangeDetectionStrategy, inject, input, computed, signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { httpResource } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { DatePipe } from '@angular/common';

import { environment } from '../../../../../environments/environment';
import { ApiResponse, Project, MatchBreakdown } from '../../../../core/models';
import { MatchResult } from '../../../../core/models/matching.model';
import { AuthStore } from '../../../../state/auth.store';
import { StatusBadgeComponent } from '../../../../shared/components/ui/status-badge/status-badge.component';
import { MatchScoreCardComponent } from '../../../../shared/components/cards/match-score-card/match-score-card.component';
import { SkillChipListComponent } from '../../../../shared/components/ui/skill-chip-list/skill-chip-list.component';
import { SkeletonComponent } from '../../../../shared/components/ui/skeleton/skeleton.component';
import { ApplyDialogComponent, ApplyDialogData } from '../../components/apply-dialog/apply-dialog.component';

@Component({
  selector: 'app-project-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule, MatIconModule, MatButtonModule, MatChipsModule,
    MatTabsModule, MatDividerModule, DatePipe,
    StatusBadgeComponent, MatchScoreCardComponent, SkillChipListComponent,
    SkeletonComponent,
  ],
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.scss',
})
export class ProjectDetailComponent {
  readonly router = inject(Router);
  readonly authStore = inject(AuthStore);
  private readonly dialog = inject(MatDialog);

  readonly id = input.required<string>();

  readonly projectResource = httpResource<ApiResponse<Project>>(
    () => ({ url: `${environment.apiUrl}/projects/${this.id()}` }),
  );

  readonly matchResource = httpResource<ApiResponse<MatchResult>>(
    () => this.authStore.isStudent()
      ? { url: `${environment.apiUrl}/matching/projects/${this.id()}/my-match` }
      : undefined,
  );

  readonly project = computed(() => {
    try {
      return this.projectResource.value()?.data ?? null;
    } catch {
      return null;
    }
  });

  readonly matchData = computed(() => {
    try {
      return this.matchResource.value()?.data ?? null;
    } catch {
      return null;
    }
  });

  readonly projectTypeLabel = computed(() => {
    const typeMap: Record<string, string> = {
      professional_practice: 'Práctica Profesional',
      social_service: 'Servicio Social',
      research: 'Investigación',
      internship: 'Pasantía',
    };
    return typeMap[this.project()?.projectType ?? ''] ?? '';
  });

  matchBreakdown(match: MatchResult): MatchBreakdown {
    return {
      overall: match.overallScore,
      skill: match.skillScore,
      experience: match.experienceScore,
      education: match.educationScore,
      availability: match.availabilityScore,
      rating: match.ratingScore,
    };
  }

  getRequirementIcon(type: string): string {
    const map: Record<string, string> = {
      skill: 'code',
      education: 'school',
      experience: 'work',
      language: 'translate',
      other: 'checklist',
    };
    return map[type] ?? 'check';
  }

  proficiencyLabel(level: string): string {
    const map: Record<string, string> = {
      basic: 'Básico',
      intermediate: 'Intermedio',
      advanced: 'Avanzado',
      expert: 'Experto',
    };
    return map[level] ?? level;
  }

  openApplyDialog(project: Project): void {
    this.dialog.open(ApplyDialogComponent, {
      data: { projectId: project.id, projectTitle: project.title } as ApplyDialogData,
      width: '600px',
      disableClose: true,
    });
  }
}
