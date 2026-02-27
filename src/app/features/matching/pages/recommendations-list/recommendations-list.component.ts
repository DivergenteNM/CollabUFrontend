import {
  Component, ChangeDetectionStrategy, inject, signal, computed,
} from '@angular/core';
import { Router } from '@angular/router';
import { httpResource } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { environment } from '../../../../../environments/environment';
import { PaginatedResponse, Recommendation } from '../../../../core/models';
import { MatchScoreBarComponent } from '../../../../shared/components/ui/match-score-bar/match-score-bar.component';
import { PaginatorComponent } from '../../../../shared/components/ui/paginator/paginator.component';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../../shared/components/ui/skeleton/skeleton.component';
import {
  ApplyDialogComponent,
  ApplyDialogData,
} from '../../../projects/components/apply-dialog/apply-dialog.component';

@Component({
  selector: 'app-recommendations-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule, MatIconModule, MatCardModule, MatChipsModule, MatDialogModule,
    MatchScoreBarComponent, PaginatorComponent, EmptyStateComponent, SkeletonComponent,
  ],
  template: `
    <div class="recs">
      <header class="recs__header">
        <div>
          <h1>Recomendaciones para ti</h1>
          <p class="recs__subtitle">Proyectos ordenados por compatibilidad con tu perfil</p>
        </div>
      </header>

      <!-- List -->
      <div class="recs__list">
        @if (recommendationsResource.isLoading()) {
          @for (_ of [1,2,3]; track $index) {
            <app-skeleton width="100%" height="280px" />
          }
        } @else if (recommendations().length === 0) {
          <app-empty-state
            icon="auto_awesome"
            title="Sin recomendaciones"
            message="Completa tu perfil para recibir recomendaciones de proyectos basadas en tus habilidades."
            actionLabel="Ver Proyectos"
            (actionClicked)="router.navigate(['/projects'])" />
        } @else {
          @for (rec of recommendations(); track rec.id; let i = $index) {
            <mat-card class="recs__card">
              <mat-card-content>
                <div class="recs__card-top">
                  <span class="recs__rank">#{{ (page() - 1) * 10 + i + 1 }}</span>
                  <div class="recs__card-info">
                    <h3 class="recs__project-title">{{ rec.project.title }}</h3>
                    <div class="recs__meta">
                      <span class="recs__company">
                        <mat-icon>business</mat-icon>
                        {{ rec.project.companyName }}
                      </span>
                      @if (rec.project.location) {
                        <span><mat-icon>location_on</mat-icon> {{ rec.project.location }}</span>
                      }
                      @if (rec.project.isRemote) {
                        <span><mat-icon>laptop</mat-icon> Remoto</span>
                      }
                    </div>

                    <mat-chip-set class="recs__tags">
                      @for (tag of rec.project.tags.slice(0, 4); track tag) {
                        <mat-chip>{{ tag }}</mat-chip>
                      }
                    </mat-chip-set>
                  </div>
                </div>

                <!-- Overall match bar -->
                <div class="recs__score-section">
                  <app-match-score-bar [score]="rec.matchScore" label="Match Total" size="lg" />
                </div>

                <!-- Breakdown bars -->
                <div class="recs__breakdown">
                  <app-match-score-bar [score]="rec.matchBreakdown.skill" label="Skills" size="sm" />
                  <app-match-score-bar [score]="rec.matchBreakdown.experience" label="Experiencia" size="sm" />
                  <app-match-score-bar [score]="rec.matchBreakdown.education" label="Educación" size="sm" />
                  <app-match-score-bar [score]="rec.matchBreakdown.availability" label="Disponibilidad" size="sm" />
                  <app-match-score-bar [score]="rec.matchBreakdown.rating" label="Rating" size="sm" />
                </div>

                <!-- Reason -->
                <p class="recs__reason">
                  <mat-icon>lightbulb</mat-icon>
                  {{ rec.reason }}
                </p>
              </mat-card-content>

              <mat-card-actions align="end">
                <button mat-button (click)="router.navigate(['/projects', rec.project.id])">
                  <mat-icon>visibility</mat-icon> Ver Proyecto
                </button>
                <button mat-button (click)="router.navigate(['/matching/project', rec.project.id])">
                  <mat-icon>analytics</mat-icon> Ver Match
                </button>
                <button mat-flat-button (click)="openApplyDialog(rec.project.id, rec.project.title)">
                  <mat-icon>send</mat-icon> Aplicar Ahora
                </button>
              </mat-card-actions>
            </mat-card>
          }
        }
      </div>

      @if (totalItems() > 0) {
        <app-paginator
          [totalItems]="totalItems()"
          [pageSize]="10"
          (pageChanged)="onPageChanged($event)" />
      }

      <!-- Tips section -->
      @if (!recommendationsResource.isLoading()) {
        <mat-card class="recs__tips">
          <mat-card-content>
            <h3><mat-icon>trending_up</mat-icon> Mejora tu match score</h3>
            <ul>
              <li>
                <mat-icon>add_circle</mat-icon>
                <span><strong>Agrega más habilidades</strong> — Cuantas más habilidades relevantes agregues, mejores recomendaciones recibirás.</span>
              </li>
              <li>
                <mat-icon>work</mat-icon>
                <span><strong>Completa tu experiencia laboral</strong> — Incluye prácticas previas, proyectos y trabajos relevantes.</span>
              </li>
              <li>
                <mat-icon>upload_file</mat-icon>
                <span><strong>Sube tu hoja de vida actualizada</strong> — Un CV completo aumenta tu puntuación de compatibilidad.</span>
              </li>
            </ul>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: `
    :host { display: block; padding: 24px; max-width: 1200px; margin: 0 auto; }

    .recs__header {
      margin-bottom: 24px;
      h1 { font-size: 1.75rem; font-weight: 700; margin: 0; color: var(--mat-sys-on-surface); }
    }

    .recs__subtitle {
      margin: 4px 0 0;
      color: var(--mat-sys-on-surface-variant);
      font-size: 0.9375rem;
    }

    .recs__list {
      display: flex;
      flex-direction: column;
      gap: 20px;
      margin-bottom: 24px;
    }

    .recs__card-top {
      display: flex;
      gap: 16px;
      align-items: flex-start;
      margin-bottom: 16px;
    }

    .recs__rank {
      flex-shrink: 0;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.9375rem;
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
    }

    .recs__card-info { flex: 1; }

    .recs__project-title {
      font-size: 1.125rem;
      font-weight: 600;
      margin: 0 0 6px;
      color: var(--mat-sys-on-surface);
    }

    .recs__meta {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 16px;
      margin-bottom: 8px;

      span {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 0.8125rem;
        color: var(--mat-sys-on-surface-variant);
        mat-icon { font-size: 16px; width: 16px; height: 16px; }
      }
    }

    .recs__company {
      font-weight: 500;
    }

    .recs__verified {
      color: #1976d2;
      font-size: 14px !important;
      width: 14px !important;
      height: 14px !important;
    }

    .recs__tags { margin-bottom: 4px; }

    .recs__score-section { margin-bottom: 12px; }

    .recs__breakdown {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 12px 16px;
      background: var(--mat-sys-surface-variant);
      border-radius: 12px;
      margin-bottom: 12px;
    }

    .recs__reason {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 0.875rem;
      color: var(--mat-sys-on-surface-variant);
      margin: 0;
      mat-icon { flex-shrink: 0; color: #ff9800; font-size: 20px; width: 20px; height: 20px; margin-top: 1px; }
    }

    .recs__tips {
      margin-top: 32px;
      background: var(--mat-sys-surface-container-low);

      h3 {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 1.0625rem;
        font-weight: 600;
        margin: 0 0 16px;
        mat-icon { color: var(--mat-sys-primary); }
      }

      ul {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      li {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        font-size: 0.875rem;
        color: var(--mat-sys-on-surface-variant);
        mat-icon { flex-shrink: 0; color: var(--mat-sys-primary); font-size: 20px; width: 20px; height: 20px; margin-top: 2px; }
      }
    }

    @media (max-width: 600px) {
      :host { padding: 16px; }
      .recs__card-top { flex-direction: column; gap: 8px; }
    }
  `,
})
export class RecommendationsListComponent {
  readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  readonly page = signal(1);

  readonly recommendationsResource = httpResource<PaginatedResponse<Recommendation>>(
    () => ({
      url: `${environment.apiUrl}/matching/recommendations`,
      params: { page: this.page(), limit: 10 },
    }),
  );

  readonly recommendations = computed(() =>
    this.recommendationsResource.value()?.data ?? [],
  );

  readonly totalItems = computed(() =>
    this.recommendationsResource.value()?.meta?.total ?? 0,
  );

  onPageChanged(event: { page: number; limit: number }): void {
    this.page.set(event.page);
  }

  openApplyDialog(projectId: string, projectTitle: string): void {
    this.dialog.open(ApplyDialogComponent, {
      width: '560px',
      data: { projectId, projectTitle } satisfies ApplyDialogData,
    });
  }
}
