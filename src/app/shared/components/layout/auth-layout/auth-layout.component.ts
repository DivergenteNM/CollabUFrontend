import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  template: `
    <div class="auth-container">
      <div class="auth-background"></div>
      <div class="auth-card-wrapper">
        <div class="auth-card">
          <div class="auth-logo">
            <span class="auth-logo__icon">🎓</span>
            <h1 class="auth-logo__title">Collab-U</h1>
            <p class="auth-logo__subtitle">Plataforma de Prácticas — Universidad de Nariño</p>
          </div>
          <router-outlet />
        </div>
        <p class="auth-footer">&copy; 2026 Collab-U — Universidad de Nariño</p>
      </div>
    </div>
  `,
  styles: `
    .auth-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      position: relative;
      overflow: hidden;
    }

    .auth-background {
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, #1b5e20 0%, #2e7d32 30%, #43a047 60%, #e8f5e9 100%);
      z-index: 0;
    }

    .auth-card-wrapper {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px;
      width: 100%;
      max-width: 520px;
    }

    .auth-card {
      width: 100%;
      background: var(--mat-sys-surface);
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.14);
      padding: 40px 32px;
    }

    .auth-logo {
      text-align: center;
      margin-bottom: 32px;
    }

    .auth-logo__icon {
      font-size: 48px;
      display: block;
      margin-bottom: 8px;
    }

    .auth-logo__title {
      font-size: 28px;
      font-weight: 700;
      color: var(--mat-sys-on-surface);
      margin: 0 0 4px;
    }

    .auth-logo__subtitle {
      font-size: 14px;
      color: var(--mat-sys-on-surface-variant);
      margin: 0;
    }

    .auth-footer {
      margin-top: 16px;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.75);
    }

    @media (max-width: 599px) {
      .auth-background {
        display: none;
      }

      .auth-container {
        background: var(--mat-sys-surface);
        align-items: flex-start;
      }

      .auth-card-wrapper {
        padding: 0;
        max-width: 100%;
      }

      .auth-card {
        border-radius: 0;
        box-shadow: none;
        min-height: 100vh;
        padding: 32px 20px;
      }

      .auth-footer {
        display: none;
      }
    }
  `,
})
export class AuthLayoutComponent {}
