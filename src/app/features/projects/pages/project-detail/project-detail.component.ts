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
  template: `
    <div class="detail">
      <!-- Back link -->
      <button mat-button class="detail__back" (click)="router.navigate(['/projects'])">
        <mat-icon>arrow_back</mat-icon> Volver a proyectos
      </button>

      @if (projectResource.isLoading()) {
        <app-skeleton width="100%" height="200px" />
        <app-skeleton width="100%" height="400px" />
      } @else if (project(); as p) {
        <!-- Header -->
        <mat-card class="detail__header">
          <mat-card-content>
            <div class="detail__header-top">
              <div class="detail__company">
                <mat-icon class="detail__company-icon">business</mat-icon>
                <div>
                  <h3 class="detail__company-name">{{ p.companyName }}</h3>
                  @if (p.supervisorName) {
                    <span class="detail__supervisor">Supervisor: {{ p.supervisorName }}</span>
                  }
                </div>
              </div>
              <app-status-badge [status]="p.status" />
            </div>

            <h1 class="detail__title">{{ p.title }}</h1>

            <div class="detail__meta">
              <span class="detail__meta-item">
                <mat-icon>label</mat-icon> {{ projectTypeLabel() }}
              </span>
              @if (p.location) {
                <span class="detail__meta-item">
                  <mat-icon>location_on</mat-icon> {{ p.location }}
                </span>
              }
              @if (p.isRemote) {
                <span class="detail__meta-item">
                  <mat-icon>laptop</mat-icon> Remoto
                </span>
              }
              <span class="detail__meta-item">
                <mat-icon>schedule</mat-icon> {{ p.weeklyHours }}h/semana
              </span>
              <span class="detail__meta-item">
                <mat-icon>hourglass_bottom</mat-icon> {{ p.totalHoursRequired }}h total
              </span>
              <span class="detail__meta-item">
                <mat-icon>event</mat-icon> {{ p.startDate | date:'d MMM yyyy' }} — {{ p.endDate | date:'d MMM yyyy' }}
              </span>
              <span class="detail__meta-item">
                <mat-icon>people</mat-icon> {{ p.positionsFilled }}/{{ p.positionsAvailable }} posiciones
              </span>
              <span class="detail__meta-item highlight">
                <mat-icon>event_busy</mat-icon> Aplicar antes: {{ p.applicationDeadline | date:'d MMM yyyy' }}
              </span>
            </div>

            @if (p.tags.length > 0) {
              <app-skill-chip-list [skills]="p.tags" [maxVisible]="8" />
            }
          </mat-card-content>
        </mat-card>

        <!-- Content + Sidebar layout -->
        <div class="detail__body">
          <!-- Main content - Tabs -->
          <div class="detail__content">
            <mat-tab-group>
              <!-- Description Tab -->
              <mat-tab label="Descripción">
                <div class="detail__tab-content">
                  <div class="detail__description" [innerHTML]="p.description"></div>
                </div>
              </mat-tab>

              <!-- Requirements Tab -->
              <mat-tab label="Requisitos">
                <div class="detail__tab-content">
                  @if (p.requirements.length === 0) {
                    <p class="detail__empty-tab">No se especificaron requisitos.</p>
                  } @else {
                    <div class="detail__requirements">
                      @for (req of p.requirements; track req.id) {
                        <div class="detail__requirement" [class.mandatory]="req.isMandatory">
                          <div class="detail__requirement-header">
                            <mat-icon>{{ getRequirementIcon(req.type) }}</mat-icon>
                            <span class="detail__requirement-name">{{ req.name }}</span>
                            @if (req.isMandatory) {
                              <span class="detail__requirement-badge">Obligatorio</span>
                            }
                          </div>
                          @if (req.description) {
                            <p class="detail__requirement-desc">{{ req.description }}</p>
                          }
                          <div class="detail__requirement-meta">
                            @if (req.proficiencyLevel) {
                              <span>Nivel: {{ proficiencyLabel(req.proficiencyLevel) }}</span>
                            }
                            @if (req.minimumYears) {
                              <span>Mín. {{ req.minimumYears }} año(s)</span>
                            }
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>
              </mat-tab>

              <!-- Company Tab -->
              <mat-tab label="Empresa">
                @defer (on viewport) {
                  <div class="detail__tab-content">
                    <div class="detail__company-info">
                      <mat-icon class="detail__company-icon--large">business</mat-icon>
                      <h3>{{ p.companyName }}</h3>
                      <p class="detail__company-stats">
                        {{ p.applicationsCount }} aplicaciones recibidas · {{ p.positionsAvailable }} posiciones
                      </p>
                    </div>
                  </div>
                } @placeholder {
                  <app-skeleton width="100%" height="200px" />
                }
              </mat-tab>
            </mat-tab-group>
          </div>

          <!-- Sidebar -->
          @if (authStore.isStudent()) {
            <aside class="detail__sidebar">
              @if (matchResource.value(); as matchData) {
                <app-match-score-card
                  [totalScore]="matchData.data.overallScore"
                  [breakdown]="matchBreakdown(matchData.data)" />
              }

              <mat-card class="detail__apply-card">
                <mat-card-content>
                  <button mat-flat-button class="detail__apply-btn"
                          (click)="openApplyDialog(p)">
                    <mat-icon>send</mat-icon> Aplicar a este proyecto
                  </button>
                  <p class="detail__apply-hint">
                    Fecha límite: {{ p.applicationDeadline | date:'d MMM yyyy' }}
                  </p>
                </mat-card-content>
              </mat-card>
            </aside>
          }
        </div>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .detail__back {
      margin-bottom: 16px;
    }

    .detail__header {
      margin-bottom: 24px;
    }

    .detail__header-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .detail__company {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .detail__company-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: var(--mat-sys-primary);
      background: var(--mat-sys-primary-container);
      border-radius: 50%;
      padding: 8px;
      box-sizing: content-box;
    }

    .detail__company-name {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
    }

    .detail__supervisor {
      font-size: 0.8125rem;
      color: var(--mat-sys-on-surface-variant);
    }

    .detail__title {
      font-size: 1.75rem;
      font-weight: 700;
      margin: 0 0 16px;
      color: var(--mat-sys-on-surface);
    }

    .detail__meta {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 20px;
      margin-bottom: 16px;
    }

    .detail__meta-item {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.875rem;
      color: var(--mat-sys-on-surface-variant);

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      &.highlight {
        color: var(--mat-sys-error);
        font-weight: 500;
      }
    }

    .detail__body {
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: 24px;

      @media (max-width: 960px) {
        grid-template-columns: 1fr;
      }
    }

    .detail__content {
      min-width: 0;
    }

    .detail__tab-content {
      padding: 24px 0;
    }

    .detail__description {
      font-size: 0.9375rem;
      line-height: 1.7;
      color: var(--mat-sys-on-surface);
    }

    .detail__empty-tab {
      color: var(--mat-sys-on-surface-variant);
      font-style: italic;
    }

    .detail__requirements {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .detail__requirement {
      padding: 12px 16px;
      border-radius: 8px;
      border: 1px solid var(--mat-sys-outline-variant);

      &.mandatory {
        border-left: 3px solid var(--mat-sys-primary);
      }
    }

    .detail__requirement-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: var(--mat-sys-primary);
      }
    }

    .detail__requirement-name {
      font-weight: 600;
      font-size: 0.9375rem;
    }

    .detail__requirement-badge {
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      padding: 2px 8px;
      border-radius: 4px;
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
    }

    .detail__requirement-desc {
      font-size: 0.8125rem;
      color: var(--mat-sys-on-surface-variant);
      margin: 4px 0;
    }

    .detail__requirement-meta {
      display: flex;
      gap: 16px;
      font-size: 0.75rem;
      color: var(--mat-sys-outline);
    }

    .detail__company-info {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 24px;
      text-align: center;

      h3 {
        margin: 0;
        font-size: 1.25rem;
      }
    }

    .detail__company-icon--large {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: var(--mat-sys-primary);
    }

    .detail__company-stats {
      font-size: 0.875rem;
      color: var(--mat-sys-on-surface-variant);
    }

    .detail__sidebar {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .detail__apply-card {
      text-align: center;
    }

    .detail__apply-btn {
      width: 100%;
      margin-bottom: 8px;
    }

    .detail__apply-hint {
      font-size: 0.8125rem;
      color: var(--mat-sys-on-surface-variant);
      margin: 0;
    }
  `,
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

  readonly project = computed(() => this.projectResource.value()?.data ?? null);

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
