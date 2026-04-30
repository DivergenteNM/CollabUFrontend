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
  templateUrl: './star-rating.component.html',
  styleUrl: './star-rating.component.scss',
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
