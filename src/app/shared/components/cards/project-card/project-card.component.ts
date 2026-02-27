import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { DatePipe } from '@angular/common';
import { Project } from '../../../../core/models';
import { MatchScoreBarComponent } from '../../ui/match-score-bar/match-score-bar.component';
import { StatusBadgeComponent } from '../../ui/status-badge/status-badge.component';

@Component({
  selector: 'app-project-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatIconModule, MatButtonModule, MatChipsModule, DatePipe, MatchScoreBarComponent, StatusBadgeComponent],
  host: { 'class': 'project-card' },
  template: `
    <mat-card>
      <mat-card-header>
        <mat-icon mat-card-avatar class="project-card__company-icon">business</mat-icon>
        <mat-card-title>{{ project().companyName }}</mat-card-title>
        <mat-card-subtitle>
          <app-status-badge [status]="project().status" size="sm" />
        </mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <h3 class="project-card__title">{{ project().title }}</h3>

        <div class="project-card__meta">
          <span><mat-icon>label</mat-icon> {{ projectTypeLabel() }}</span>
          @if (project().location) {
            <span><mat-icon>location_on</mat-icon> {{ project().location }}</span>
          }
          @if (project().isRemote) {
            <span><mat-icon>laptop</mat-icon> Remoto</span>
          }
          <span><mat-icon>schedule</mat-icon> {{ project().weeklyHours }}h/sem</span>
          <span><mat-icon>event</mat-icon> Hasta: {{ project().applicationDeadline | date:'d MMM yyyy' }}</span>
        </div>

        <mat-chip-set class="project-card__tags">
          @for (tag of project().tags.slice(0, 3); track tag) {
            <mat-chip>{{ tag }}</mat-chip>
          }
          @if (project().tags.length > 3) {
            <mat-chip>+{{ project().tags.length - 3 }}</mat-chip>
          }
        </mat-chip-set>

        <div class="project-card__stats">
          <span>{{ project().positionsAvailable }} posiciones</span>
          <span>{{ project().applicationsCount }} aplicaciones</span>
        </div>

        @if (matchScore() !== undefined) {
          <app-match-score-bar [score]="matchScore()!" label="Match" size="sm" />
        }
      </mat-card-content>

      @if (showActions()) {
        <mat-card-actions align="end">
          <button mat-button (click)="viewDetail.emit(project().id)">
            <mat-icon>visibility</mat-icon> Ver Detalle
          </button>
          <button mat-flat-button (click)="apply.emit(project().id)">
            <mat-icon>send</mat-icon> Aplicar
          </button>
        </mat-card-actions>
      }
    </mat-card>
  `,
  styles: `
    :host {
      display: block;
    }

    mat-card {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    mat-card-content {
      flex: 1;
    }

    .project-card__company-icon {
      background-color: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
      border-radius: 50%;
      padding: 6px;
      font-size: 20px;
    }

    .project-card__title {
      font-size: 1.0625rem;
      font-weight: 600;
      margin: 8px 0 12px;
      color: var(--mat-sys-on-surface);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .project-card__meta {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 16px;
      margin-bottom: 12px;

      span {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 0.8125rem;
        color: var(--mat-sys-on-surface-variant);

        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }
    }

    .project-card__tags {
      margin-bottom: 12px;
    }

    .project-card__stats {
      display: flex;
      gap: 16px;
      font-size: 0.8125rem;
      color: var(--mat-sys-on-surface-variant);
      margin-bottom: 8px;
    }
  `,
})
export class ProjectCardComponent {
  readonly project = input.required<Project>();
  readonly matchScore = input<number>();
  readonly showActions = input<boolean>(true);
  readonly viewDetail = output<string>();
  readonly apply = output<string>();

  readonly projectTypeLabel = computed(() => {
    const map: Record<string, string> = {
      professional_practice: 'Práctica Profesional',
      social_service: 'Servicio Social',
      research: 'Investigación',
      internship: 'Pasantía',
    };
    return map[this.project().projectType] || this.project().projectType;
  });
}
