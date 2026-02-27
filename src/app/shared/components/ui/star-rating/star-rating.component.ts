import { Component, ChangeDetectionStrategy, input, model, computed, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-star-rating',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  host: {
    'class': 'star-rating',
    '[class]': '"star-rating--" + size()',
    'role': 'slider',
    '[attr.aria-valuenow]': 'value()',
    '[attr.aria-valuemin]': '0',
    '[attr.aria-valuemax]': 'maxStars()',
    '[attr.aria-label]': '"Calificación: " + value() + " de " + maxStars()',
    '[attr.aria-readonly]': 'readonly()',
    'tabindex': '0',
    '(keydown.arrowRight)': 'increment()',
    '(keydown.arrowUp)': 'increment()',
    '(keydown.arrowLeft)': 'decrement()',
    '(keydown.arrowDown)': 'decrement()',
  },
  template: `
    <div class="star-rating__stars">
      @for (star of starsArray(); track star) {
        <mat-icon
          class="star-rating__star"
          [class.filled]="star <= displayValue()"
          [class.half]="star === Math.ceil(value()) && value() % 1 >= 0.25 && value() % 1 < 0.75 && readonly()"
          [class.interactive]="!readonly()"
          (mouseenter)="onHover(star)"
          (mouseleave)="onLeave()"
          (click)="onSelect(star)">
          {{ getIcon(star) }}
        </mat-icon>
      }
    </div>
    @if (readonly() && value() > 0) {
      <span class="star-rating__value">{{ value().toFixed(1) }}</span>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .star-rating__stars {
      display: inline-flex;
      gap: 2px;
    }

    .star-rating__star {
      color: var(--mat-sys-outline-variant);
      cursor: default;
      transition: color 150ms, transform 150ms;
      user-select: none;

      &.filled {
        color: #ffc107;
      }

      &.interactive {
        cursor: pointer;

        &:hover {
          transform: scale(1.15);
        }
      }
    }

    :host(.star-rating--sm) .star-rating__star {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    :host(.star-rating--md) .star-rating__star {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    :host(.star-rating--lg) .star-rating__star {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .star-rating__value {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface);
      margin-left: 4px;
    }
  `,
})
export class StarRatingComponent {
  readonly value = model<number>(0);
  readonly maxStars = input<number>(5);
  readonly readonly = input<boolean>(false);
  readonly size = input<'sm' | 'md' | 'lg'>('md');

  protected readonly Math = Math;
  protected readonly hoverValue = signal<number>(0);

  readonly starsArray = computed(() =>
    Array.from({ length: this.maxStars() }, (_, i) => i + 1)
  );

  readonly displayValue = computed(() =>
    !this.readonly() && this.hoverValue() > 0 ? this.hoverValue() : this.value()
  );

  getIcon(star: number): string {
    const val = this.displayValue();
    if (star <= Math.floor(val)) return 'star';
    if (star === Math.ceil(val) && val % 1 >= 0.25) return 'star_half';
    return 'star_border';
  }

  onHover(star: number): void {
    if (!this.readonly()) {
      this.hoverValue.set(star);
    }
  }

  onLeave(): void {
    this.hoverValue.set(0);
  }

  onSelect(star: number): void {
    if (!this.readonly()) {
      this.value.set(star);
    }
  }

  increment(): void {
    if (!this.readonly() && this.value() < this.maxStars()) {
      this.value.update((v) => v + 1);
    }
  }

  decrement(): void {
    if (!this.readonly() && this.value() > 0) {
      this.value.update((v) => v - 1);
    }
  }
}
