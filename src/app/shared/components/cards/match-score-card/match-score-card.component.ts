import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatchBreakdown } from '../../../../core/models';
import { MatchScoreBarComponent } from '../../ui/match-score-bar/match-score-bar.component';

interface BreakdownItem {
  label: string;
  score: number;
}

@Component({
  selector: 'app-match-score-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatIconModule, MatchScoreBarComponent],
  host: {
    'class': 'match-score-card',
    '[class.compact]': 'compact()',
  },
  template: `
    <mat-card>
      <mat-card-content>
        <div class="match-score-card__header">
          <mat-icon class="match-score-card__star">star</mat-icon>
          <span class="match-score-card__total">Match Score: {{ totalScore() }}%</span>
        </div>

        @if (!compact()) {
          <div class="match-score-card__bars">
            @for (item of breakdownItems(); track item.label) {
              <app-match-score-bar [score]="item.score" [label]="item.label" size="sm" />
            }
          </div>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    :host {
      display: block;
    }

    .match-score-card__header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
    }

    .match-score-card__star {
      color: #ffc107;
      font-size: 24px;
    }

    .match-score-card__total {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--mat-sys-on-surface);
    }

    .match-score-card__bars {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    :host(.compact) .match-score-card__header {
      margin-bottom: 0;
    }

    :host(.compact) .match-score-card__total {
      font-size: 0.9375rem;
    }
  `,
})
export class MatchScoreCardComponent {
  readonly totalScore = input.required<number>();
  readonly breakdown = input.required<MatchBreakdown>();
  readonly compact = input<boolean>(false);

  readonly breakdownItems = computed<BreakdownItem[]>(() => {
    const b = this.breakdown();
    return [
      { label: 'Skills',        score: b.skill },
      { label: 'Experiencia',   score: b.experience },
      { label: 'Educación',     score: b.education },
      { label: 'Disponibilidad', score: b.availability },
      { label: 'Rating',        score: b.rating },
    ];
  });
}
