import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AuthService } from '../../../../core/services/auth.service';
import { UserRole } from '../../../../core/enums';
import { CustomValidators } from '../../../../shared/validators';

@Component({
  selector: 'app-register-student',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatStepperModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    RouterLink,
  ],
  template: `
    @if (registrationSuccess()) {
      <div class="success-screen">
        <mat-icon class="success-screen__icon">mark_email_read</mat-icon>
        <h2>¡Revisa tu email!</h2>
        <p>Hemos enviado un enlace de verificación a <strong>{{ accountForm.controls.email.value }}</strong></p>
        <p class="success-screen__hint">Revisa tu bandeja de entrada y la carpeta de spam.</p>
        <a mat-flat-button color="primary" routerLink="/auth/login">Ir a Iniciar Sesión</a>
      </div>
    } @else {
      <h2 class="stepper-title">Registro Estudiante</h2>

      <mat-stepper linear #stepper class="register-stepper">
        <!-- Step 1: Account -->
        <mat-step [stepControl]="accountForm" label="Cuenta">
          <form [formGroup]="accountForm" class="step-form">
            <mat-form-field appearance="outline" class="step-form__field">
              <mat-label>Email institucional</mat-label>
              <input matInput formControlName="email" type="email" placeholder="usuario@udenar.edu.co" autocomplete="email" />
              <mat-icon matPrefix>email</mat-icon>
              @if (accountForm.controls.email.hasError('required')) {
                <mat-error>El email es requerido</mat-error>
              } @else if (accountForm.controls.email.hasError('udenarEmail')) {
                <mat-error>Debe ser un correo &#64;udenar.edu.co</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="step-form__field">
              <mat-label>Contraseña</mat-label>
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
              @if (accountForm.controls.password.hasError('required')) {
                <mat-error>La contraseña es requerida</mat-error>
              } @else if (accountForm.controls.password.hasError('strongPassword')) {
                <mat-error>Requiere mayúscula, minúscula, número y símbolo</mat-error>
              }
            </mat-form-field>

            <!-- Password strength indicator -->
            @let strength = passwordStrength();
            <div class="password-strength">
              <mat-progress-bar [value]="strength.percent" [color]="strength.color"></mat-progress-bar>
              <span class="password-strength__label" [style.color]="strength.textColor">{{ strength.label }}</span>
            </div>

            <mat-form-field appearance="outline" class="step-form__field">
              <mat-label>Confirmar contraseña</mat-label>
              <input
                matInput
                formControlName="confirmPassword"
                [type]="showPassword() ? 'text' : 'password'"
                autocomplete="new-password"
              />
              <mat-icon matPrefix>lock_outline</mat-icon>
              @if (accountForm.controls.confirmPassword.hasError('required')) {
                <mat-error>Confirma tu contraseña</mat-error>
              } @else if (accountForm.hasError('passwordsMismatch')) {
                <mat-error>Las contraseñas no coinciden</mat-error>
              }
            </mat-form-field>

            <div class="step-form__actions">
              <a mat-button routerLink="/auth/register">Volver</a>
              <button mat-flat-button color="primary" matStepperNext type="button">Siguiente</button>
            </div>
          </form>
        </mat-step>

        <!-- Step 2: Personal Data -->
        <mat-step [stepControl]="dataForm" label="Datos Personales">
          <form [formGroup]="dataForm" (ngSubmit)="onSubmit()" class="step-form">
            @if (errorMessage()) {
              <div class="step-form__error-banner">
                <mat-icon>error_outline</mat-icon>
                <span>{{ errorMessage() }}</span>
              </div>
            }

            <div class="step-form__row">
              <mat-form-field appearance="outline">
                <mat-label>Nombre</mat-label>
                <input matInput formControlName="firstName" autocomplete="given-name" />
                @if (dataForm.controls.firstName.hasError('required')) {
                  <mat-error>Requerido</mat-error>
                } @else if (dataForm.controls.firstName.hasError('minlength')) {
                  <mat-error>Mínimo 2 caracteres</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Apellido</mat-label>
                <input matInput formControlName="lastName" autocomplete="family-name" />
                @if (dataForm.controls.lastName.hasError('required')) {
                  <mat-error>Requerido</mat-error>
                } @else if (dataForm.controls.lastName.hasError('minlength')) {
                  <mat-error>Mínimo 2 caracteres</mat-error>
                }
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="step-form__field">
              <mat-label>Código estudiantil</mat-label>
              <input matInput formControlName="studentCode" />
              @if (dataForm.controls.studentCode.hasError('required')) {
                <mat-error>El código es requerido</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="step-form__field">
              <mat-label>Programa académico</mat-label>
              <input matInput formControlName="program" [matAutocomplete]="programAuto" />
              <mat-autocomplete #programAuto="matAutocomplete">
                @for (prog of filteredPrograms(); track prog) {
                  <mat-option [value]="prog">{{ prog }}</mat-option>
                }
              </mat-autocomplete>
              @if (dataForm.controls.program.hasError('required')) {
                <mat-error>Selecciona un programa</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="step-form__field">
              <mat-label>Semestre</mat-label>
              <mat-select formControlName="semester">
                @for (s of semesters; track s) {
                  <mat-option [value]="s">{{ s }}</mat-option>
                }
              </mat-select>
              @if (dataForm.controls.semester.hasError('required')) {
                <mat-error>Selecciona tu semestre</mat-error>
              }
            </mat-form-field>

            <div class="step-form__actions">
              <button mat-button matStepperPrevious type="button">Anterior</button>
              <button
                mat-flat-button
                color="primary"
                type="submit"
                [disabled]="isSubmitting()"
              >
                @if (isSubmitting()) {
                  <mat-spinner diameter="20"></mat-spinner>
                } @else {
                  Crear Cuenta
                }
              </button>
            </div>
          </form>
        </mat-step>
      </mat-stepper>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .stepper-title {
      font-size: 20px;
      font-weight: 600;
      text-align: center;
      margin: 0 0 16px;
      color: var(--mat-sys-on-surface);
    }

    .register-stepper {
      background: transparent;
    }

    .step-form {
      display: flex;
      flex-direction: column;
      padding-top: 16px;
    }

    .step-form__field {
      width: 100%;
    }

    .step-form__row {
      display: flex;
      gap: 12px;

      mat-form-field {
        flex: 1;
      }
    }

    .step-form__actions {
      display: flex;
      justify-content: space-between;
      margin-top: 8px;
    }

    .step-form__error-banner {
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

    .password-strength {
      margin: -8px 0 16px;
      display: flex;
      align-items: center;
      gap: 8px;

      mat-progress-bar {
        flex: 1;
      }
    }

    .password-strength__label {
      font-size: 12px;
      white-space: nowrap;
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
        margin: 0 0 8px;
      }
    }

    .success-screen__icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: var(--mat-sys-primary);
    }

    .success-screen__hint {
      margin-bottom: 24px !important;
    }

    @media (max-width: 400px) {
      .step-form__row {
        flex-direction: column;
        gap: 0;
      }
    }
  `,
})
export class RegisterStudentComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly semesters = Array.from({ length: 12 }, (_, i) => i + 1);
  readonly programs = [
    'Ingeniería de Sistemas',
    'Ingeniería Electrónica',
    'Ingeniería Civil',
    'Ingeniería Agroindustrial',
    'Ingeniería Ambiental',
    'Licenciatura en Matemáticas',
    'Licenciatura en Informática',
    'Administración de Empresas',
    'Contaduría Pública',
    'Economía',
    'Derecho',
    'Medicina',
    'Psicología',
    'Sociología',
    'Diseño Gráfico',
    'Comercio Internacional',
  ];

  showPassword = signal(false);
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);
  registrationSuccess = signal(false);

  accountForm = this.fb.nonNullable.group(
    {
      email: ['', [Validators.required, CustomValidators.udenarEmail]],
      password: ['', [Validators.required, CustomValidators.strongPassword]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: [CustomValidators.passwordsMatch] }
  );

  dataForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    studentCode: ['', [Validators.required]],
    program: ['', [Validators.required]],
    semester: [null as number | null, [Validators.required]],
  });

  passwordStrength = signal<{ percent: number; label: string; color: 'primary' | 'accent' | 'warn'; textColor: string }>({
    percent: 0,
    label: '',
    color: 'warn',
    textColor: '#999',
  });

  filteredPrograms = signal<string[]>(this.programs);

  constructor() {
    // Watch password changes to update strength
    this.accountForm.controls.password.valueChanges.subscribe((value) => {
      this.passwordStrength.set(this.calcPasswordStrength(value));
    });

    // Filter programs for autocomplete
    this.dataForm.controls.program.valueChanges.subscribe((value) => {
      const filter = (value ?? '').toLowerCase();
      this.filteredPrograms.set(
        this.programs.filter((p) => p.toLowerCase().includes(filter))
      );
    });
  }

  onSubmit(): void {
    if (this.accountForm.invalid || this.dataForm.invalid) {
      this.accountForm.markAllAsTouched();
      this.dataForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const account = this.accountForm.getRawValue();
    const data = this.dataForm.getRawValue();

    this.authService
      .register({
        email: account.email,
        password: account.password,
        role: UserRole.STUDENT,
        firstName: data.firstName,
        lastName: data.lastName,
      })
      .subscribe({
        next: () => {
          this.registrationSuccess.set(true);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(err.error?.message ?? 'Error al crear la cuenta');
        },
      });
  }

  private calcPasswordStrength(password: string): {
    percent: number;
    label: string;
    color: 'primary' | 'accent' | 'warn';
    textColor: string;
  } {
    if (!password) return { percent: 0, label: '', color: 'warn', textColor: '#999' };

    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { percent: 25, label: 'Débil', color: 'warn', textColor: '#d32f2f' };
    if (score <= 3) return { percent: 50, label: 'Regular', color: 'warn', textColor: '#f57c00' };
    if (score <= 4) return { percent: 75, label: 'Buena', color: 'accent', textColor: '#388e3c' };
    return { percent: 100, label: 'Fuerte', color: 'primary', textColor: '#1b5e20' };
  }
}
