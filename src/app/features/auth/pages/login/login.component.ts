import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../../core/services/auth.service';
import { AuthStore } from '../../../../state/auth.store';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterLink,
  ],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="login-form" novalidate>
      @if (errorMessage()) {
        <div class="login-form__error-banner">
          <mat-icon>error_outline</mat-icon>
          <span>{{ errorMessage() }}</span>
        </div>
      }

      <mat-form-field appearance="outline" class="login-form__field">
        <mat-label>Email</mat-label>
        <input matInput formControlName="email" type="email" autocomplete="email" />
        <mat-icon matPrefix>email</mat-icon>
        @if (form.controls.email.hasError('required')) {
          <mat-error>El email es requerido</mat-error>
        } @else if (form.controls.email.hasError('email')) {
          <mat-error>Ingresa un email válido</mat-error>
        }
      </mat-form-field>

      <mat-form-field appearance="outline" class="login-form__field">
        <mat-label>Contraseña</mat-label>
        <input
          matInput
          formControlName="password"
          [type]="showPassword() ? 'text' : 'password'"
          autocomplete="current-password"
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
        } @else if (form.controls.password.hasError('minlength')) {
          <mat-error>Mínimo 8 caracteres</mat-error>
        }
      </mat-form-field>

      <mat-checkbox formControlName="rememberMe" class="login-form__remember">
        Recordarme
      </mat-checkbox>

      <button
        mat-flat-button
        color="primary"
        type="submit"
        class="login-form__submit"
        [disabled]="isSubmitting()"
      >
        @if (isSubmitting()) {
          <mat-spinner diameter="20"></mat-spinner>
        } @else {
          Iniciar Sesión
        }
      </button>

      <div class="login-form__link">
        <a routerLink="/auth/forgot-password">¿Olvidaste tu contraseña?</a>
      </div>

      <div class="login-form__divider">
        <span>o continuar con</span>
      </div>

      <button mat-stroked-button type="button" class="login-form__oauth">
        <mat-icon>school</mat-icon>
        Iniciar con correo UDENAR
      </button>

      <p class="login-form__register">
        ¿No tienes cuenta?
        <a routerLink="/auth/register">Regístrate</a>
      </p>
    </form>
  `,
  styles: `
    :host {
      display: block;
    }

    .login-form {
      display: flex;
      flex-direction: column;
    }

    .login-form__error-banner {
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

    .login-form__field {
      width: 100%;
    }

    .login-form__remember {
      margin: -8px 0 16px;
    }

    .login-form__submit {
      height: 48px;
      font-size: 16px;
      font-weight: 500;
      margin-bottom: 16px;

      mat-spinner {
        margin: 0 auto;
      }
    }

    .login-form__link {
      text-align: center;
      margin-bottom: 24px;

      a {
        color: var(--mat-sys-primary);
        text-decoration: none;
        font-size: 14px;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    .login-form__divider {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
      color: var(--mat-sys-on-surface-variant);
      font-size: 13px;

      &::before,
      &::after {
        content: '';
        flex: 1;
        height: 1px;
        background: var(--mat-sys-outline-variant);
      }
    }

    .login-form__oauth {
      width: 100%;
      height: 44px;
      margin-bottom: 24px;
    }

    .login-form__register {
      text-align: center;
      font-size: 14px;
      color: var(--mat-sys-on-surface-variant);
      margin: 0;

      a {
        color: var(--mat-sys-primary);
        font-weight: 500;
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }
    }
  `,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    rememberMe: [false],
  });

  showPassword = signal(false);
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.form.getRawValue();

    this.authService.login({ email, password }).subscribe({
      next: (res) => {
        if (!res?.user || !res?.accessToken || !res?.refreshToken) {
          this.isSubmitting.set(false);
          this.errorMessage.set('La respuesta de autenticación es inválida. Intenta de nuevo.');
          return;
        }

        this.authStore.setAuth(res.user, res.accessToken, res.refreshToken);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message ?? 'Error al iniciar sesión');
      },
    });
  }
}
