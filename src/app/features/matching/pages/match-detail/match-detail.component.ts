import {
  Component, ChangeDetectionStrategy, inject, input, computed,
} from '@angular/core';
import { Router } from '@angular/router';
import { httpResource } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { environment } from '../../../../../environments/environment';
import { ApiResponse, MatchResult, Project } from '../../../../core/models';
import { MatchScoreCardComponent } from '../../../../shared/components/cards/match-score-card/match-score-card.component';
import { ProjectCardComponent } from '../../../../shared/components/cards/project-card/project-card.component';
import { SkeletonComponent } from '../../../../shared/components/ui/skeleton/skeleton.component';
import {
  ApplyDialogComponent,
  ApplyDialogData,
} from '../../../projects/components/apply-dialog/apply-dialog.component';

@Component({
  selector: 'app-match-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule, MatIconModule, MatCardModule, MatChipsModule, MatDividerModule, MatDialogModule,
    MatchScoreCardComponent, ProjectCardComponent, SkeletonComponent,
  ],
  templateUrl: './match-detail.component.html',
  styleUrl: './match-detail.component.scss',
})
export class MatchDetailComponent {
  readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  readonly projectId = input.required<string>();

  // matching-service no envuelve la respuesta en {data: ...} — sin TransformInterceptor global.
  readonly matchResource = httpResource<MatchResult | null>(
    () => ({
      url: `${environment.apiUrl}/matching/projects/${this.projectId()}/my-match`,
    }),
  );

  readonly match = computed(() => this.matchResource.value() ?? null);

  readonly projectResource = httpResource<ApiResponse<Project>>(
    () => ({ url: `${environment.apiUrl}/projects/${this.projectId()}` }),
  );

  readonly project = computed(() => {
    const res = this.projectResource.value() as any;
    return (res?.data ?? res ?? null) as Project | null;
  });

  readonly matchingSkillNames = computed(() =>
    this.match()?.skillsBreakdown?.matched.map((s) => s.name) ?? [],
  );

  readonly missingSkillNames = computed(() =>
    this.match()?.skillsBreakdown?.missing.map((s) => s.name) ?? [],
  );

  openApplyDialog(projectId: string, projectTitle: string): void {
    this.dialog.open(ApplyDialogComponent, {
      width: '560px',
      data: { projectId, projectTitle } satisfies ApplyDialogData,
    });
  }
}
