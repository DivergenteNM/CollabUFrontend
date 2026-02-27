import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'skeleton',
    '[class.rounded]': 'rounded()',
    '[style.width]': 'width()',
    '[style.height]': 'height()',
    'aria-hidden': 'true',
  },
  template: ``,
  styles: `
    :host {
      display: block;
      background: linear-gradient(
        90deg,
        var(--mat-sys-surface-variant) 25%,
        color-mix(in srgb, var(--mat-sys-surface-variant) 60%, transparent) 50%,
        var(--mat-sys-surface-variant) 75%
      );
      background-size: 200% 100%;
      animation: shimmer 1.5s ease-in-out infinite;
      border-radius: 4px;
    }

    :host(.rounded) {
      border-radius: 50%;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `,
})
export class SkeletonComponent {
  readonly width = input<string>('100%');
  readonly height = input<string>('20px');
  readonly rounded = input<boolean>(false);
}
