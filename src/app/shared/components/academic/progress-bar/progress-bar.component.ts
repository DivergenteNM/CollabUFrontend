import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ProgressData } from '../../../../features/applications/services/application.service';

@Component({
  selector: 'app-progress-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="progress-bar" [class]="'progress-bar--' + progress().alertLevel">
      <div class="progress-bar__header">
        <span class="progress-bar__label">
          <mat-icon>{{ icon() }}</mat-icon>
          {{ statusLabel() }}
        </span>
        <span class="progress-bar__value">{{ progress().overallProgress }}%</span>
      </div>
      <div class="progress-bar__track">
        <div class="progress-bar__fill" [style.width.%]="progress().overallProgress"></div>
      </div>
      <div class="progress-bar__legend">
        <span>Temporal: {{ progress().temporalProgress }}%</span>
        <span>Entregables: {{ progress().deliverableProgress }}%</span>
      </div>
    </div>
  `,
  styles: [`
    .progress-bar {
      padding: 14px 16px;
      border-radius: var(--border-radius-sm, 8px);
      background: var(--bg-card, #ffffff);
      border: 1px solid var(--border-subtle, #e2e9e3);
    }
    .progress-bar__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      font-size: 0.875rem;
      font-weight: 700;
    }
    .progress-bar__label {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--color-success, #2e854b);
    }
    .progress-bar__label mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .progress-bar__value { font-weight: 800; font-size: 1.125rem; color: var(--text-primary, #1a241c); }
    .progress-bar__track {
      height: 8px;
      border-radius: 4px;
      background: var(--bg-tertiary, #e3e8e0);
      overflow: hidden;
    }
    .progress-bar__fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.4s ease;
      background: linear-gradient(90deg, var(--color-primary, #388e53) 0%, var(--color-primary-light, #84c49b) 100%);
    }
    .progress-bar--at_risk .progress-bar__fill { background: linear-gradient(90deg, #d97706 0%, #fbbf24 100%); }
    .progress-bar--delayed .progress-bar__fill { background: linear-gradient(90deg, #dc2626 0%, #f87171 100%); }
    .progress-bar--at_risk .progress-bar__label { color: #d97706; }
    .progress-bar--delayed .progress-bar__label { color: #dc2626; }
    .progress-bar__legend {
      display: flex;
      justify-content: space-between;
      margin-top: 6px;
      font-size: 0.75rem;
      color: var(--text-tertiary, #6e7d70);
    }
  `],
})
export class ProgressBarComponent {
  readonly progress = input.required<ProgressData>();

  icon(): string {
    const map = { on_track: 'check_circle', at_risk: 'warning', delayed: 'error' };
    return map[this.progress().alertLevel];
  }

  statusLabel(): string {
    const map = { on_track: 'En curso', at_risk: 'En riesgo', delayed: 'Retrasado' };
    return map[this.progress().alertLevel];
  }
}
