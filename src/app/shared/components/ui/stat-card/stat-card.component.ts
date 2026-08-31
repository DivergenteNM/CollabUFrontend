import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-stat-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatIconModule, MatRippleModule, MatTooltipModule],
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
  /**
   * Explicación breve y opcional de qué representa el indicador. Introducido
   * a partir de las pruebas con usuarios finales (rol Empresa): las
   * funcionalidades estaban bien implementadas, pero faltaba mostrar al
   * usuario para qué sirve cada cosa. No se muestra nada si se omite —
   * evita saturar tarjetas cuyo significado ya es evidente por sí solo.
   */
  readonly hint = input<string>();
  readonly clicked = output<void>();

  handleClick(): void {
    if (this.clickable()) {
      this.clicked.emit();
    }
  }
}
