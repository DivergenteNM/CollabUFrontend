import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
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
    @if (emailSent()) {
      <div class="success-screen">
        <mat-icon class="success-screen__icon">mark_email_read</mat-icon>
        <h2>Revisa tu correo</h2>
        <p>Si el email existe en nuestro sistema, recibirás instrucciones para restablecer tu contraseña.</p>
        <a mat-flat-button color="primary" routerLink="/auth/login">Volver a Iniciar Sesión</a>
      </div>
    } @else {
      <h2 class="page-title">Recuperar contraseña</h2>
      <p class="page-subtitle">Ingresa tu email y te enviaremos instrucciones para restablecer tu contraseña.</p>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="forgot-form" novalidate>
        @if (errorMessage()) {
          <div class="forgot-form__error-banner">
            <mat-icon>error_outline</mat-icon>
            <span>{{ errorMessage() }}</span>
          </div>
        }

        <mat-form-field appearance="outline" class="forgot-form__field">
          <mat-label>Email</mat-label>
          <input matInput formControlName="email" type="email" autocomplete="email" />
          <mat-icon matPrefix>email</mat-icon>
          @if (form.controls.email.hasError('required')) {
            <mat-error>El email es requerido</mat-error>
          } @else if (form.controls.email.hasError('email')) {
            <mat-error>Ingresa un email válido</mat-error>
          }
        </mat-form-field>

        <button
          mat-flat-button
          color="primary"
          type="submit"
          class="forgot-form__submit"
          [disabled]="isSubmitting()"
        >
          @if (isSubmitting()) {
            <mat-spinner diameter="20"></mat-spinner>
          } @else {
            Enviar instrucciones
          }
        </button>

        <div class="forgot-form__back">
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

    .forgot-form {
      display: flex;
      flex-direction: column;
    }

    .forgot-form__field {
      width: 100%;
    }

    .forgot-form__submit {
      height: 48px;
      font-size: 16px;
      font-weight: 500;
      margin-bottom: 16px;

      mat-spinner {
        margin: 0 auto;
      }
    }

    .forgot-form__error-banner {
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

    .forgot-form__back {
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
        line-height: 1.5;
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
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);
  emailSent = signal(false);

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.authService.forgotPassword({ email: this.form.controls.email.value }).subscribe({
      next: () => {
        this.emailSent.set(true);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        // Always show success message to avoid email enumeration
        this.emailSent.set(true);
      },
    });
  }
}
