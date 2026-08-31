import { AbstractControl, FormGroup } from '@angular/forms';

/**
 * Mark all controls in a form group as touched.
 * Useful for triggering validation messages on submit.
 */
export function markAllAsTouched(control: AbstractControl): void {
  if (control instanceof FormGroup) {
    Object.values(control.controls).forEach((c) => markAllAsTouched(c));
  }
  control.markAsTouched();
  control.markAsDirty();
}

/**
 * Get a user-friendly error message for the first validation error on a control.
 */
export function getFormErrorMessage(control: AbstractControl | null, fieldLabel: string = 'Campo'): string {
  if (!control || !control.errors) return '';

  const errors = control.errors;

  if (errors['required']) return `${fieldLabel} es obligatorio`;
  if (errors['email']) return `Ingresa un correo electrónico válido`;
  if (errors['minlength']) return `Mínimo ${errors['minlength'].requiredLength} caracteres`;
  if (errors['maxlength']) return `Máximo ${errors['maxlength'].requiredLength} caracteres`;
  if (errors['min']) return `El valor mínimo es ${errors['min'].min}`;
  if (errors['max']) return `El valor máximo es ${errors['max'].max}`;
  if (errors['pattern']) return `Formato no válido`;
  if (errors['passwordsMismatch']) return `Las contraseñas no coinciden`;
  if (errors['nit']) return `NIT no válido`;
  if (errors['dateNotAfter']) return `La fecha debe ser posterior`;
  if (errors['strongPassword']) {
    const p = errors['strongPassword'];
    if (p['minLength']) return `Mínimo 8 caracteres`;
    if (p['uppercase']) return `Incluye al menos una mayúscula`;
    if (p['lowercase']) return `Incluye al menos una minúscula`;
    if (p['number']) return `Incluye al menos un número`;
    if (p['special']) return `Incluye al menos un carácter especial`;
  }

  return `${fieldLabel} no es válido`;
}
