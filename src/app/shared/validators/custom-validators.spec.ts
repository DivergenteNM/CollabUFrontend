import { FormControl, FormGroup } from '@angular/forms';
import { CustomValidators } from './custom-validators';

describe('CustomValidators', () => {
  describe('strongPassword', () => {
    it('should return null for strong password', () => {
      const control = new FormControl('MyStr0ng!Pass');
      expect(CustomValidators.strongPassword(control)).toBeNull();
    });

    it('should return error for short password', () => {
      const control = new FormControl('Ab1!');
      const errors = CustomValidators.strongPassword(control);
      expect(errors?.['strongPassword']?.['minLength']).toBe(true);
    });

    it('should return error for missing uppercase', () => {
      const control = new FormControl('mypassword1!');
      const errors = CustomValidators.strongPassword(control);
      expect(errors?.['strongPassword']?.['uppercase']).toBe(true);
    });

    it('should return error for missing lowercase', () => {
      const control = new FormControl('MYPASSWORD1!');
      const errors = CustomValidators.strongPassword(control);
      expect(errors?.['strongPassword']?.['lowercase']).toBe(true);
    });

    it('should return error for missing number', () => {
      const control = new FormControl('MyPassword!');
      const errors = CustomValidators.strongPassword(control);
      expect(errors?.['strongPassword']?.['number']).toBe(true);
    });

    it('should return error for missing special char', () => {
      const control = new FormControl('MyPassword1');
      const errors = CustomValidators.strongPassword(control);
      expect(errors?.['strongPassword']?.['special']).toBe(true);
    });

    it('should return null for empty value', () => {
      const control = new FormControl('');
      expect(CustomValidators.strongPassword(control)).toBeNull();
    });
  });

  describe('passwordsMatch', () => {
    it('should return null when passwords match', () => {
      const group = new FormGroup(
        {
          password: new FormControl('MyStr0ng!'),
          confirm: new FormControl('MyStr0ng!'),
        },
        { validators: CustomValidators.passwordsMatch('password', 'confirm') }
      );
      expect(group.errors).toBeNull();
    });

    it('should return error when passwords do not match', () => {
      const group = new FormGroup(
        {
          password: new FormControl('MyStr0ng!'),
          confirm: new FormControl('Different1!'),
        },
        { validators: CustomValidators.passwordsMatch('password', 'confirm') }
      );
      expect(group.errors).toEqual({ passwordsMismatch: true });
      expect(group.get('confirm')?.hasError('passwordsMismatch')).toBe(true);
    });

    it('should return null when either control is empty', () => {
      const group = new FormGroup(
        {
          password: new FormControl('MyStr0ng!'),
          confirm: new FormControl(''),
        },
        { validators: CustomValidators.passwordsMatch('password', 'confirm') }
      );
      expect(group.errors).toBeNull();
    });
  });

  describe('nit', () => {
    it('should accept 900123456-1 format', () => {
      const control = new FormControl('900123456-1');
      expect(CustomValidators.nit(control)).toBeNull();
    });

    it('should accept 900.123.456-7 format', () => {
      const control = new FormControl('900.123.456-7');
      expect(CustomValidators.nit(control)).toBeNull();
    });

    it('should reject invalid NIT', () => {
      const control = new FormControl('abc');
      expect(CustomValidators.nit(control)).toEqual({ nit: true });
    });

    it('should return null for empty value', () => {
      const control = new FormControl('');
      expect(CustomValidators.nit(control)).toBeNull();
    });
  });

  describe('dateAfter', () => {
    it('should return null when date is after reference', () => {
      const group = new FormGroup({
        start: new FormControl('2025-01-01'),
        end: new FormControl('2025-06-01'),
      });
      const validator = CustomValidators.dateAfter('start');
      expect(validator(group.get('end')!)).toBeNull();
    });

    it('should return error when date is before reference', () => {
      const group = new FormGroup({
        start: new FormControl('2025-06-01'),
        end: new FormControl('2025-01-01'),
      });
      const validator = CustomValidators.dateAfter('start');
      expect(validator(group.get('end')!)).toEqual({ dateNotAfter: true });
    });

    it('should return null when either value is empty', () => {
      const group = new FormGroup({
        start: new FormControl(''),
        end: new FormControl('2025-06-01'),
      });
      const validator = CustomValidators.dateAfter('start');
      expect(validator(group.get('end')!)).toBeNull();
    });
  });
});
