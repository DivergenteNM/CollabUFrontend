import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AuthService } from '../../../../core/services/auth.service';
import { UserRole } from '../../../../core/enums';
import { CustomValidators } from '../../../../shared/validators';

@Component({
  selector: 'app-register-company',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatStepperModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    RouterLink,
  ],
  templateUrl: './register-company.component.html',
  styleUrl: './register-company.component.scss',
})
export class RegisterCompanyComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly industries = [
    'Tecnología',
    'Educación',
    'Salud',
    'Finanzas',
    'Construcción',
    'Agroindustria',
    'Comercio',
    'Servicios',
    'Manufactura',
    'Telecomunicaciones',
    'Energía',
    'Transporte',
    'Gobierno',
    'ONG / Fundación',
    'Otra',
  ];

  showPassword = signal(false);
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);
  registrationSuccess = signal(false);

  accountForm = this.fb.nonNullable.group(
    {
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, CustomValidators.strongPassword]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: [CustomValidators.passwordsMatch('password', 'confirmPassword')] }
  );

  companyForm = this.fb.nonNullable.group({
    companyName: ['', [Validators.required]],
    nit: ['', [Validators.required, CustomValidators.nit]],
    industry: ['', [Validators.required]],
    contactName: ['', [Validators.required]],
    contactPosition: ['', [Validators.required]],
    contactPhone: ['', [Validators.required]],
  });

  passwordStrength = signal<{ percent: number; label: string; color: 'primary' | 'accent' | 'warn'; textColor: string }>({
    percent: 0,
    label: '',
    color: 'warn',
    textColor: '#999',
  });

  constructor() {
    this.accountForm.controls.password.valueChanges.subscribe((value) => {
      this.passwordStrength.set(this.calcPasswordStrength(value));
    });
  }

  onSubmit(): void {
    if (this.accountForm.invalid || this.companyForm.invalid) {
      this.accountForm.markAllAsTouched();
      this.companyForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const account = this.accountForm.getRawValue();
    const company = this.companyForm.getRawValue();

    this.authService
      .register({
        email: account.email,
        password: account.password,
        role: UserRole.COMPANY,
        firstName: company.contactName,
        lastName: company.companyName,
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
