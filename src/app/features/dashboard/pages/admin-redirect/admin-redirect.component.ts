import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-redirect',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>Redirigiendo al panel de administración...</p>`,
  styles: `
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 200px;
      color: var(--mat-sys-on-surface-variant);
    }
  `,
})
export class AdminRedirectComponent implements OnInit {
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.router.navigate(['/admin/dashboard']);
  }
}
