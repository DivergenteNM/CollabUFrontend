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
    .progress-bar { padding: 12px 0; }
    .progress-bar__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: .875rem; font-weight: 600; }
    .progress-bar__label { display: flex; align-items: center; gap: 6px; }
    .progress-bar__label mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .progress-bar__track { height: 10px; border-radius: 6px; background: #f3f4f6; overflow: hidden; }
    .progress-bar__fill { height: 100%; border-radius: 6px; transition: width .3s ease; background: #16a34a; }
    .progress-bar--at_risk .progress-bar__fill { background: #d97706; }
    .progress-bar--delayed .progress-bar__fill { background: #dc2626; }
    .progress-bar--at_risk .progress-bar__label { color: #d97706; }
    .progress-bar--delayed .progress-bar__label { color: #dc2626; }
    .progress-bar__legend { display: flex; justify-content: space-between; margin-top: 4px; font-size: .75rem; color: #6b7280; }
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
