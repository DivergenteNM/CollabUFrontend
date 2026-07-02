import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { AuthService } from '../../../../core/services/auth.service';
import { CustomValidators } from '../../../../shared/validators/custom-validators';
import { getFormErrorMessage, markAllAsTouched } from '../../../../shared/utils/form.utils';

@Component({
  selector: 'app-change-password-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  templateUrl: './change-password-dialog.component.html',
  styleUrl: './change-password-dialog.component.scss',
})
export class ChangePasswordDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  readonly dialogRef = inject(MatDialogRef<ChangePasswordDialogComponent>);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly hideCurrent = signal(true);
  readonly hideNew = signal(true);
  readonly hideConfirm = signal(true);

  readonly form = this.fb.nonNullable.group(
    {
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, CustomValidators.strongPassword]],
      confirmPassword: ['', [Validators.required]],
    },
    {
      validators: [CustomValidators.passwordsMatch('newPassword', 'confirmPassword')],
    }
  );

  getErrorMessage(fieldName: string): string {
    const control = this.form.get(fieldName);
    const labelMap: Record<string, string> = {
      currentPassword: 'Contraseña actual',
      newPassword: 'Nueva contraseña',
      confirmPassword: 'Confirmar nueva contraseña',
    };
    return getFormErrorMessage(control, labelMap[fieldName]);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      markAllAsTouched(this.form);
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const { currentPassword, newPassword } = this.form.getRawValue();

    this.authService.changePassword({ currentPassword, newPassword }).subscribe({
      next: () => {
        this.loading.set(false);
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.loading.set(false);
        const backendMsg = err?.error?.message || 'Error al cambiar la contraseña. Verifica tus datos.';
        this.errorMessage.set(backendMsg);
      },
    });
  }
}
