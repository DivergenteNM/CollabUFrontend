import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatResultBreakdown } from '../../../../core/models';
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
  readonly breakdown = input.required<MatResultBreakdown>();
  readonly compact = input<boolean>(false);

  readonly breakdownItems = computed<BreakdownItem[]>(() => {
    const b = this.breakdown();
    return [
      { label: 'Skills',         score: b.skillsScore ?? 0 },
      { label: 'Nivel',          score: b.proficiencyScore ?? 0 },
      { label: 'Programa',       score: b.programScore ?? 0 },
      { label: 'Semestre',       score: b.semesterScore ?? 0 },
      { label: 'Disponibilidad', score: b.availabilityScore ?? 0 },
      { label: 'Idioma',         score: b.languageScore ?? 0 },
    ];
  });
}
