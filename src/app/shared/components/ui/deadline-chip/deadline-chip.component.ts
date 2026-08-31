import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export type DeadlineUrgency = 'ok' | 'soon' | 'overdue';

@Component({
  selector: 'app-deadline-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, MatIconModule],
  template: `
    @if (date()) {
      <span class="deadline" [class]="'deadline--' + urgency()">
        <mat-icon>schedule</mat-icon>
        <ng-content />
        {{ date() | date:'d MMM yyyy' }}
        <span class="deadline__days">({{ remainingLabel() }})</span>
      </span>
    }
  `,
  styles: [`
    .deadline {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: .8125rem; line-height: 1.4;
    }
    .deadline mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .deadline__days { opacity: .85; }
    .deadline--ok { color: var(--text-secondary); }
    .deadline--soon { color: var(--color-warning); }
    .deadline--overdue { color: var(--color-error); font-weight: 600; }
  `],
})
export class DeadlineChipComponent {
  readonly date = input<string | null>(null);

  readonly daysRemaining = computed<number | null>(() => {
    const d = this.date();
    if (!d) return null;
    return Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000);
  });

  readonly urgency = computed<DeadlineUrgency>(() => {
    const days = this.daysRemaining();
    if (days === null) return 'ok';
    if (days < 0) return 'overdue';
    if (days <= 3) return 'soon';
    return 'ok';
  });

  readonly remainingLabel = computed(() => {
    const days = this.daysRemaining();
    if (days === null) return '';
    if (days < 0) return `vencido hace ${Math.abs(days)} día(s)`;
    if (days === 0) return 'vence hoy';
    return `quedan ${days} día(s)`;
  });
}
