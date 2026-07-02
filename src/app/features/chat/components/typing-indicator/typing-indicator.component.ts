import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-typing-indicator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'class': 'typing-indicator' },
  templateUrl: './typing-indicator.component.html',
  styleUrl: './typing-indicator.component.scss',
})
export class TypingIndicatorComponent {
  readonly userName = input.required<string>();
}
