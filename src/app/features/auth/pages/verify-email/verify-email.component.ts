import { Component, ChangeDetectionStrategy, inject, signal, input, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-verify-email',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="verify-email">
      @if (isLoading()) {
        <mat-spinner diameter="48"></mat-spinner>
        <p class="verify-email__loading">Verificando tu email...</p>
      } @else if (success()) {
        <mat-icon class="verify-email__icon verify-email__icon--success">check_circle</mat-icon>
        <h2>¡Email verificado!</h2>
        <p>Tu correo electrónico ha sido verificado exitosamente. Ya puedes iniciar sesión.</p>
        <a mat-flat-button color="primary" routerLink="/auth/login">Ir a Iniciar Sesión</a>
      } @else {
        <mat-icon class="verify-email__icon verify-email__icon--error">error</mat-icon>
        <h2>Verificación fallida</h2>
        <p>{{ errorMessage() }}</p>
        <div class="verify-email__actions">
          <a mat-flat-button color="primary" routerLink="/auth/login">Ir a Iniciar Sesión</a>
        </div>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .verify-email {
      text-align: center;
      padding: 24px 0;

      h2 {
        margin: 16px 0 8px;
        font-size: 22px;
        color: var(--mat-sys-on-surface);
      }

      p {
        color: var(--mat-sys-on-surface-variant);
        font-size: 14px;
        margin: 0 0 24px;
        line-height: 1.5;
      }

      mat-spinner {
        margin: 0 auto 16px;
      }
    }

    .verify-email__loading {
      color: var(--mat-sys-on-surface-variant);
      font-size: 14px;
    }

    .verify-email__icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
    }

    .verify-email__icon--success {
      color: var(--mat-sys-primary);
    }

    .verify-email__icon--error {
      color: var(--mat-sys-error);
    }

    .verify-email__actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: center;
    }
  `,
})
export class VerifyEmailComponent implements OnInit {
  private readonly authService = inject(AuthService);

  /** Token from query param ?token=xxx via withComponentInputBinding */
  token = input<string>();

  isLoading = signal(true);
  success = signal(false);
  errorMessage = signal('El enlace de verificación es inválido o ha expirado.');

  ngOnInit(): void {
    const tokenValue = this.token();
    if (!tokenValue) {
      this.isLoading.set(false);
      this.errorMessage.set('No se proporcionó un token de verificación.');
      return;
    }

    this.authService.verifyEmail(tokenValue).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.success.set(true);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.success.set(false);
        this.errorMessage.set(
          err.error?.message ?? 'El enlace de verificación es inválido o ha expirado.'
        );
      },
    });
  }
}
