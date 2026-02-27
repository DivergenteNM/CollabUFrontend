import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'app-footer',
    'role': 'contentinfo',
  },
  template: `
    <footer class="footer">
      <span>&copy; 2026 Collab-U — Universidad de Nariño</span>
    </footer>
  `,
  styles: `
    :host {
      display: block;
    }

    .footer {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px 24px;
      font-size: 13px;
      color: var(--mat-sys-on-surface-variant);
      border-top: 1px solid var(--mat-sys-outline-variant);
    }
  `,
})
export class FooterComponent {}
