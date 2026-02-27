import { Component, ChangeDetectionStrategy, inject, signal, input, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../../core/services/auth.service';
import { CustomValidators } from '../../../../shared/validators';

@Component({
  selector: 'app-reset-password',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterLink,
  ],
  template: `
    @if (resetSuccess()) {
      <div class="success-screen">
        <mat-icon class="success-screen__icon">check_circle</mat-icon>
        <h2>¡Contraseña restablecida!</h2>
        <p>Tu contraseña ha sido actualizada exitosamente.</p>
        <a mat-flat-button color="primary" routerLink="/auth/login">Ir a Iniciar Sesión</a>
      </div>
    } @else {
      <h2 class="page-title">Restablecer contraseña</h2>
      <p class="page-subtitle">Ingresa tu nueva contraseña.</p>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="reset-form" novalidate>
        @if (errorMessage()) {
          <div class="reset-form__error-banner">
            <mat-icon>error_outline</mat-icon>
            <span>{{ errorMessage() }}</span>
          </div>
        }

        <mat-form-field appearance="outline" class="reset-form__field">
          <mat-label>Nueva contraseña</mat-label>
          <input
            matInput
            formControlName="password"
            [type]="showPassword() ? 'text' : 'password'"
            autocomplete="new-password"
          />
          <mat-icon matPrefix>lock</mat-icon>
          <button
            mat-icon-button
            matSuffix
            type="button"
            (click)="showPassword.set(!showPassword())"
            [attr.aria-label]="showPassword() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
          >
            <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
          @if (form.controls.password.hasError('required')) {
            <mat-error>La contraseña es requerida</mat-error>
          } @else if (form.controls.password.hasError('strongPassword')) {
            <mat-error>Requiere mayúscula, minúscula, número y símbolo</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="reset-form__field">
          <mat-label>Confirmar contraseña</mat-label>
          <input
            matInput
            formControlName="confirmPassword"
            [type]="showPassword() ? 'text' : 'password'"
            autocomplete="new-password"
          />
          <mat-icon matPrefix>lock_outline</mat-icon>
          @if (form.controls.confirmPassword.hasError('required')) {
            <mat-error>Confirma tu contraseña</mat-error>
          } @else if (form.hasError('passwordsMismatch')) {
            <mat-error>Las contraseñas no coinciden</mat-error>
          }
        </mat-form-field>

        <button
          mat-flat-button
          color="primary"
          type="submit"
          class="reset-form__submit"
          [disabled]="isSubmitting()"
        >
          @if (isSubmitting()) {
            <mat-spinner diameter="20"></mat-spinner>
          } @else {
            Restablecer Contraseña
          }
        </button>

        <div class="reset-form__back">
          <a routerLink="/auth/login">
            <mat-icon>arrow_back</mat-icon>
            Volver a Iniciar Sesión
          </a>
        </div>
      </form>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .page-title {
      font-size: 20px;
      font-weight: 600;
      text-align: center;
      margin: 0 0 4px;
      color: var(--mat-sys-on-surface);
    }

    .page-subtitle {
      font-size: 14px;
      color: var(--mat-sys-on-surface-variant);
      text-align: center;
      margin: 0 0 24px;
    }

    .reset-form {
      display: flex;
      flex-direction: column;
    }

    .reset-form__field {
      width: 100%;
    }

    .reset-form__submit {
      height: 48px;
      font-size: 16px;
      font-weight: 500;
      margin-bottom: 16px;

      mat-spinner {
        margin: 0 auto;
      }
    }

    .reset-form__error-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      border-radius: 8px;
      background: var(--mat-sys-error-container);
      color: var(--mat-sys-on-error-container);
      margin-bottom: 16px;
      font-size: 14px;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    .reset-form__back {
      text-align: center;

      a {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: var(--mat-sys-primary);
        text-decoration: none;
        font-size: 14px;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }

        &:hover {
          text-decoration: underline;
        }
      }
    }

    .success-screen {
      text-align: center;
      padding: 24px 0;

      h2 {
        margin: 16px 0 8px;
        font-size: 22px;
      }

      p {
        color: var(--mat-sys-on-surface-variant);
        font-size: 14px;
        margin: 0 0 24px;
      }
    }

    .success-screen__icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: var(--mat-sys-primary);
    }
  `,
})
export class ResetPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  /** Token from query param ?token=xxx via withComponentInputBinding */
  token = input<string>();

  form = this.fb.nonNullable.group(
    {
      password: ['', [Validators.required, CustomValidators.strongPassword]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: [CustomValidators.passwordsMatch('password', 'confirmPassword')] }
  );

  showPassword = signal(false);
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);
  resetSuccess = signal(false);

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const tokenValue = this.token();
    if (!tokenValue) {
      this.errorMessage.set('Token de restablecimiento no proporcionado.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.authService
      .resetPassword({ token: tokenValue, newPassword: this.form.controls.password.value })
      .subscribe({
        next: () => {
          this.resetSuccess.set(true);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(err.error?.message ?? 'Error al restablecer la contraseña. El token puede ser inválido o haber expirado.');
        },
      });
  }
}
