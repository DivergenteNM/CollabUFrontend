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
  template: `
    <mat-card [matRippleDisabled]="!clickable()" matRipple>
      <mat-card-content>
        <div class="stat-card__header">
          <div class="stat-card__icon" [class]="'stat-card__icon--' + color()">
            <mat-icon>{{ icon() }}</mat-icon>
          </div>
          @if (trend(); as t) {
            <span class="stat-card__trend" [class.positive]="t > 0" [class.negative]="t < 0">
              <mat-icon>{{ t > 0 ? 'trending_up' : 'trending_down' }}</mat-icon>
              {{ t > 0 ? '+' : '' }}{{ t }}%
              @if (trendLabel()) {
                <span class="stat-card__trend-label">{{ trendLabel() }}</span>
              }
            </span>
          }
        </div>
        <div class="stat-card__value">{{ value() }}</div>
        <div class="stat-card__label">{{ label() }}</div>
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    :host {
      display: block;
    }

    :host.clickable {
      cursor: pointer;
    }

    mat-card {
      height: 100%;
      transition: transform 200ms ease, box-shadow 200ms ease;
    }

    :host.clickable mat-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--mat-sys-level3, 0 4px 8px rgba(0,0,0,.12));
    }

    mat-card-content {
      padding: 20px !important;
    }

    .stat-card__header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .stat-card__icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
        color: white;
      }
    }

    .stat-card__icon--primary {
      background-color: var(--mat-sys-primary);
    }

    .stat-card__icon--accent {
      background-color: var(--mat-sys-tertiary);
    }

    .stat-card__icon--warn {
      background-color: var(--mat-sys-error);
    }

    .stat-card__trend {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      font-size: 13px;
      font-weight: 500;
      padding: 2px 8px;
      border-radius: 12px;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      &.positive {
        color: #2e7d32;
        background-color: #e8f5e9;
      }

      &.negative {
        color: #c62828;
        background-color: #ffebee;
      }
    }

    .stat-card__trend-label {
      font-size: 11px;
      font-weight: 400;
      opacity: 0.8;
    }

    .stat-card__value {
      font-size: 2rem;
      font-weight: 700;
      line-height: 1.2;
      color: var(--mat-sys-on-surface);
    }

    .stat-card__label {
      font-size: 0.875rem;
      color: var(--mat-sys-on-surface-variant);
      margin-top: 4px;
    }
  `,
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
