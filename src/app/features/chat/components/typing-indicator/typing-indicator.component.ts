import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-typing-indicator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'class': 'typing-indicator' },
  template: `
    <span class="typing-indicator__text">{{ userName() }} está escribiendo</span>
    <span class="typing-indicator__dots">
      <span class="dot"></span>
      <span class="dot"></span>
      <span class="dot"></span>
    </span>
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 16px;
      font-size: 0.8125rem;
      color: var(--mat-sys-on-surface-variant);
      font-style: italic;
    }

    .typing-indicator__dots {
      display: inline-flex;
      gap: 3px;
      align-items: center;
    }

    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--mat-sys-on-surface-variant);
      animation: bounce 1.4s infinite ease-in-out both;
    }

    .dot:nth-child(1) { animation-delay: 0s; }
    .dot:nth-child(2) { animation-delay: 0.16s; }
    .dot:nth-child(3) { animation-delay: 0.32s; }

    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0); opacity: 0.4; }
      40% { transform: scale(1); opacity: 1; }
    }
  `,
})
export class TypingIndicatorComponent {
  readonly userName = input.required<string>();
}
