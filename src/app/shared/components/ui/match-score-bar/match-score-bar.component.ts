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
  templateUrl: './match-score-bar.component.html',
  styleUrl: './match-score-bar.component.scss',
})
export class MatchScoreBarComponent {
  readonly score = input.required<number>();
  readonly label = input<string>();
  readonly showPercentage = input<boolean>(true);
  readonly size = input<'sm' | 'md' | 'lg'>('md');

  readonly clampedScore = computed(() => Math.max(0, Math.min(100, Math.round(this.score()))));

  readonly barColor = computed(() => {
    const s = this.clampedScore();
    if (s >= 90) return '#388E53';
    if (s >= 70) return '#3282B2';
    if (s >= 50) return '#C2781B';
    return '#C93B3B';
  });
}
