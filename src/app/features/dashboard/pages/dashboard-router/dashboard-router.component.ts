import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-dashboard-router',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dashboard-placeholder">
      <h1>Dashboard</h1>
      <p>Contenido del dashboard según rol (próxima fase).</p>
    </div>
  `,
  styles: `
    .dashboard-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      color: var(--mat-sys-on-surface-variant);
    }
  `,
})
export class DashboardRouterComponent {}
