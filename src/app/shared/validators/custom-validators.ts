import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class CustomValidators {
  /**
   * Strong password: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
   */
  static strongPassword(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const value: string = control.value;

    const errors: Record<string, boolean> = {};
    if (value.length < 8) errors['minLength'] = true;
    if (!/[A-Z]/.test(value)) errors['uppercase'] = true;
    if (!/[a-z]/.test(value)) errors['lowercase'] = true;
    if (!/[0-9]/.test(value)) errors['number'] = true;
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) errors['special'] = true;

    return Object.keys(errors).length > 0 ? { strongPassword: errors } : null;
  }

  /**
   * Validates that two named controls in a group match.
   * Apply at group level: formGroup(controls, { validators: CustomValidators.passwordsMatch('password', 'confirmPassword') })
   */
  static passwordsMatch(controlName: string, matchingControlName: string): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const control = group.get(controlName);
      const matching = group.get(matchingControlName);
      if (!control?.value || !matching?.value) return null;
      if (control.value !== matching.value) {
        matching.setErrors({ passwordsMismatch: true });
        return { passwordsMismatch: true };
      }
      // Only clear if the error is ours
      if (matching.hasError('passwordsMismatch')) {
        matching.setErrors(null);
      }
      return null;
    };
  }

  /**
   * Validates Colombian NIT format: digits with optional verification digit (e.g., 900123456-1 or 900.123.456-7)
   */
  static nit(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const valid = /^\d{3}\.?\d{3}\.?\d{3}-?\d$/.test(control.value) || /^\d{9,10}(-\d)?$/.test(control.value);
    return valid ? null : { nit: true };
  }

  /**
   * Validates that a date is after the value of another control in the same form group.
   */
  static dateAfter(beforeControlName: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const parent = control.parent;
      if (!parent) return null;
      const beforeControl = parent.get(beforeControlName);
      if (!beforeControl?.value || !control.value) return null;
      return new Date(control.value) > new Date(beforeControl.value)
        ? null
        : { dateNotAfter: true };
    };
  }
}
