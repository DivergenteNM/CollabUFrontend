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
import { ApiResponse, MatchDetail } from '../../../../core/models';
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
  template: `
    <div class="detail">
      @if (matchResource.isLoading()) {
        <app-skeleton width="100%" height="180px" />
        <app-skeleton width="100%" height="240px" />
        <app-skeleton width="100%" height="300px" />
      } @else if (match(); as m) {
        <!-- Back link -->
        <button mat-button class="detail__back" (click)="router.navigate(['/matching'])">
          <mat-icon>arrow_back</mat-icon> Volver a recomendaciones
        </button>

        <!-- Score Card -->
        <app-match-score-card
          [totalScore]="m.overallScore"
          [breakdown]="m.matchBreakdown" />

        <mat-divider />

        <!-- Skills Comparison -->
        <mat-card class="detail__skills">
          <mat-card-content>
            <h3><mat-icon>compare_arrows</mat-icon> Análisis de habilidades</h3>

            <div class="detail__skills-grid">
              <!-- Matching skills -->
              <div class="detail__skills-col detail__skills-col--match">
                <h4>
                  <mat-icon>check_circle</mat-icon>
                  Skills que coinciden ({{ m.matchingSkills.length }})
                </h4>
                <mat-chip-set>
                  @for (skill of m.matchingSkills; track skill) {
                    <mat-chip class="chip--match">{{ skill }}</mat-chip>
                  }
                  @empty {
                    <p class="detail__no-skills">Sin coincidencias aún</p>
                  }
                </mat-chip-set>
              </div>

              <!-- Missing skills -->
              <div class="detail__skills-col detail__skills-col--missing">
                <h4>
                  <mat-icon>cancel</mat-icon>
                  Skills que te faltan ({{ m.missingSkills.length }})
                </h4>
                <mat-chip-set>
                  @for (skill of m.missingSkills; track skill) {
                    <mat-chip class="chip--missing">{{ skill }}</mat-chip>
                  }
                  @empty {
                    <p class="detail__no-skills">¡Tienes todas las habilidades!</p>
                  }
                </mat-chip-set>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-divider />

        <!-- Project Card -->
        <section class="detail__project">
          <h3><mat-icon>work</mat-icon> Proyecto</h3>
          <app-project-card
            [project]="m.project"
            [matchScore]="m.overallScore"
            (viewDetail)="router.navigate(['/projects', m.project.id])"
            (apply)="openApplyDialog(m.project.id, m.project.title)" />
        </section>

        <!-- Actions -->
        <div class="detail__actions">
          <button mat-flat-button class="detail__apply" (click)="openApplyDialog(m.project.id, m.project.title)">
            <mat-icon>send</mat-icon> Aplicar a este proyecto
          </button>
          <button mat-stroked-button (click)="router.navigate(['/projects', m.project.id])">
            <mat-icon>open_in_new</mat-icon> Ver detalle completo del proyecto
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    :host { display: block; padding: 24px; max-width: 960px; margin: 0 auto; }

    .detail__back {
      margin-bottom: 16px;
    }

    app-match-score-card {
      margin-bottom: 24px;
    }

    mat-divider {
      margin: 24px 0;
    }

    .detail__skills {
      h3 {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 1.125rem;
        font-weight: 600;
        margin: 0 0 16px;
        mat-icon { color: var(--mat-sys-primary); }
      }
    }

    .detail__skills-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }

    .detail__skills-col {
      h4 {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.9375rem;
        font-weight: 600;
        margin: 0 0 12px;
      }
    }

    .detail__skills-col--match {
      h4 mat-icon { color: #4caf50; }
    }

    .detail__skills-col--missing {
      h4 mat-icon { color: #f44336; }
    }

    .chip--match {
      --mdc-chip-elevated-container-color: #e8f5e9;
      --mdc-chip-label-text-color: #2e7d32;
    }

    .chip--missing {
      --mdc-chip-elevated-container-color: #ffebee;
      --mdc-chip-label-text-color: #c62828;
    }

    .detail__no-skills {
      font-size: 0.875rem;
      color: var(--mat-sys-on-surface-variant);
      font-style: italic;
      margin: 0;
    }

    .detail__project {
      h3 {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 1.125rem;
        font-weight: 600;
        margin: 0 0 16px;
        mat-icon { color: var(--mat-sys-primary); }
      }

      app-project-card { max-width: 600px; }
    }

    .detail__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid var(--mat-sys-outline-variant);
    }

    .detail__apply {
      --mdc-filled-button-container-height: 44px;
    }

    @media (max-width: 600px) {
      :host { padding: 16px; }
      .detail__skills-grid { grid-template-columns: 1fr; }
    }
  `,
})
export class MatchDetailComponent {
  readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  readonly projectId = input.required<string>();

  readonly matchResource = httpResource<ApiResponse<MatchDetail>>(
    () => ({
      url: `${environment.apiUrl}/matching/projects/${this.projectId()}/my-match`,
    }),
  );

  readonly match = computed(() =>
    this.matchResource.value()?.data ?? null,
  );

  openApplyDialog(projectId: string, projectTitle: string): void {
    this.dialog.open(ApplyDialogComponent, {
      width: '560px',
      data: { projectId, projectTitle } satisfies ApplyDialogData,
    });
  }
}
