import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';

@Component({
  selector: 'app-stat-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatIconModule, MatRippleModule],
  host: {
    'class': 'stat-card',
    '[class.clickable]': 'clickable()',
    '(click)': 'handleClick()',
    '(keydown.enter)': 'handleClick()',
    '[attr.tabindex]': 'clickable() ? 0 : null',
    '[attr.role]': 'clickable() ? "button" : null',
  },
  templateUrl: './stat-card.component.html',
  styleUrl: './stat-card.component.scss',
})
export class StatCardComponent {
  readonly icon = input.required<string>();
  readonly value = input.required<string | number>();
  readonly label = input.required<string>();
  readonly trend = input<number>();
  readonly trendLabel = input<string>();
  readonly color = input<'primary' | 'accent' | 'warn'>('primary');
  readonly clickable = input<boolean>(false);
  readonly clicked = output<void>();

  handleClick(): void {
    if (this.clickable()) {
      this.clicked.emit();
    }
  }
}
