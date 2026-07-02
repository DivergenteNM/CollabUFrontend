import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatButtonModule],
  host: { 'class': 'empty-state' },
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss',
})
export class EmptyStateComponent {
  readonly icon = input<string>('inbox');
  readonly title = input.required<string>();
  readonly message = input<string>();
  readonly actionLabel = input<string>();
  readonly actionClicked = output<void>();
}
