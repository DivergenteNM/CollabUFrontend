import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `
    <div class="not-found">
      <mat-icon class="not-found__icon">explore_off</mat-icon>
      <h1 class="not-found__title">404</h1>
      <h2 class="not-found__subtitle">Página no encontrada</h2>
      <p class="not-found__text">
        Lo sentimos, la página que buscas no existe o fue movida a otra ubicación.
      </p>
      <a mat-flat-button color="primary" routerLink="/dashboard" class="not-found__action">
        <mat-icon>home</mat-icon>
        Ir al Dashboard
      </a>
    </div>
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: var(--mat-sys-surface);
    }

    .not-found {
      text-align: center;
      padding: 48px 24px;
      max-width: 420px;
    }

    .not-found__icon {
      font-size: 80px;
      width: 80px;
      height: 80px;
      color: var(--mat-sys-outline);
      margin-bottom: 16px;
    }

    .not-found__title {
      font-size: 72px;
      font-weight: 800;
      color: var(--mat-sys-primary);
      margin: 0;
      line-height: 1;
    }

    .not-found__subtitle {
      font-size: 24px;
      font-weight: 600;
      color: var(--mat-sys-on-surface);
      margin: 8px 0 12px;
    }

    .not-found__text {
      font-size: 14px;
      color: var(--mat-sys-on-surface-variant);
      line-height: 1.6;
      margin: 0 0 32px;
    }

    .not-found__action {
      height: 44px;
    }
  `,
})
export class NotFoundComponent {}
