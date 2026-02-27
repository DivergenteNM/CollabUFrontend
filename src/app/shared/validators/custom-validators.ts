import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class CustomValidators {
  /**
   * Validates that the email ends with @udenar.edu.co
   */
  static udenarEmail(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const valid = /^[a-zA-Z0-9._%+-]+@udenar\.edu\.co$/i.test(control.value);
    return valid ? null : { udenarEmail: true };
  }

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
   * Validates that the 'confirmPassword' field matches the 'password' field.
   * Apply at group level.
   */
  static passwordsMatch(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirm = control.get('confirmPassword')?.value;
    if (!password || !confirm) return null;
    return password === confirm ? null : { passwordsMismatch: true };
  }

  /**
   * Validates Colombian NIT format: digits with optional verification digit (e.g., 900123456-1)
   */
  static nit(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const valid = /^\d{9,10}(-\d)?$/.test(control.value);
    return valid ? null : { nit: true };
  }
}
