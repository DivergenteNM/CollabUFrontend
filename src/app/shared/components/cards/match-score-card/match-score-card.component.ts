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
    '[class.match-score-card--compact]': 'compact()',
  },
  templateUrl: './match-score-card.component.html',
  styleUrl: './match-score-card.component.scss',
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
