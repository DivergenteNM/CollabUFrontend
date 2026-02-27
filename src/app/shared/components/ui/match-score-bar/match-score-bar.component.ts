import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

@Component({
  selector: 'app-match-score-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'match-score-bar',
    '[class]': '"match-score-bar--" + size()',
    'role': 'meter',
    '[attr.aria-valuenow]': 'score()',
    '[attr.aria-valuemin]': '0',
    '[attr.aria-valuemax]': '100',
    '[attr.aria-label]': 'label() || "Puntuación de coincidencia"',
  },
  template: `
    @if (label()) {
      <span class="match-score-bar__label">{{ label() }}</span>
    }
    <div class="match-score-bar__track">
      <div
        class="match-score-bar__fill"
        [style.width.%]="clampedScore()"
        [style.background-color]="barColor()">
      </div>
    </div>
    @if (showPercentage()) {
      <span class="match-score-bar__percent" [style.color]="barColor()">
        {{ clampedScore() }}%
      </span>
    }
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
    }

    .match-score-bar__label {
      flex-shrink: 0;
      min-width: 80px;
      font-size: 0.8125rem;
      color: var(--mat-sys-on-surface-variant);
    }

    .match-score-bar__track {
      flex: 1;
      background-color: var(--mat-sys-surface-variant);
      border-radius: 999px;
      overflow: hidden;
    }

    :host(.match-score-bar--sm) .match-score-bar__track { height: 6px; }
    :host(.match-score-bar--md) .match-score-bar__track { height: 10px; }
    :host(.match-score-bar--lg) .match-score-bar__track { height: 14px; }

    .match-score-bar__fill {
      height: 100%;
      border-radius: 999px;
      transition: width 400ms ease;
    }

    .match-score-bar__percent {
      flex-shrink: 0;
      min-width: 38px;
      text-align: right;
      font-weight: 600;
      font-size: 0.8125rem;
    }
  `,
})
export class MatchScoreBarComponent {
  readonly score = input.required<number>();
  readonly label = input<string>();
  readonly showPercentage = input<boolean>(true);
  readonly size = input<'sm' | 'md' | 'lg'>('md');

  readonly clampedScore = computed(() => Math.max(0, Math.min(100, Math.round(this.score()))));

  readonly barColor = computed(() => {
    const s = this.clampedScore();
    if (s >= 90) return '#4caf50';
    if (s >= 70) return '#2196f3';
    if (s >= 50) return '#ff9800';
    return '#f44336';
  });
}
