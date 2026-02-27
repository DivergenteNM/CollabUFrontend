import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  template: `
    <div class="auth-layout">
      <div class="auth-layout__card">
        <div class="auth-layout__logo">
          <span class="auth-layout__icon">🎓</span>
          <h1 class="auth-layout__title">Collab-U</h1>
          <p class="auth-layout__subtitle">Plataforma de Prácticas — Universidad de Nariño</p>
        </div>
        <router-outlet />
      </div>
    </div>
  `,
  styles: `
    .auth-layout {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
      background: linear-gradient(135deg, #1b5e20 0%, #2e7d32 40%, #43a047 70%, #ffffff 100%);
    }

    .auth-layout__card {
      width: 100%;
      max-width: 480px;
      background: var(--mat-sys-surface);
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
      padding: 40px 32px;
    }

    .auth-layout__logo {
      text-align: center;
      margin-bottom: 32px;
    }

    .auth-layout__icon {
      font-size: 48px;
      display: block;
      margin-bottom: 8px;
    }

    .auth-layout__title {
      font-size: 28px;
      font-weight: 700;
      color: var(--mat-sys-on-surface);
      margin: 0 0 4px;
    }

    .auth-layout__subtitle {
      font-size: 14px;
      color: var(--mat-sys-on-surface-variant);
      margin: 0;
    }

    @media (max-width: 599px) {
      .auth-layout {
        padding: 0;
        align-items: stretch;
        background: var(--mat-sys-surface);
      }

      .auth-layout__card {
        max-width: 100%;
        border-radius: 0;
        box-shadow: none;
        min-height: 100vh;
        padding: 32px 20px;
      }
    }
  `,
})
export class AuthLayoutComponent {}
