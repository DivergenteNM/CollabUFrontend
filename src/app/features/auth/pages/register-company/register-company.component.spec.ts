import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterCompanyComponent } from './register-company.component';
import { AuthService } from '../../../../core/services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { of } from 'rxjs';
import { UserRole } from '../../../../core/enums';
import { TermsPolicyDialogComponent } from '../../../../shared/components/ui/terms-policy-dialog/terms-policy-dialog.component';

describe('RegisterCompanyComponent', () => {
  let fixture: ComponentFixture<RegisterCompanyComponent>;
  let component: RegisterCompanyComponent;
  let mockAuthService: { register: ReturnType<typeof vi.fn> };
  let mockDialog: { open: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockAuthService = {
      register: vi.fn().mockReturnValue(of({ success: true })),
    };
    mockDialog = {
      open: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [RegisterCompanyComponent],
      providers: [
        provideRouter([]),
        provideAnimationsAsync(),
        { provide: AuthService, useValue: mockAuthService },
      ],
    })
      .overrideProvider(MatDialog, { useValue: mockDialog })
      .compileComponents();

    fixture = TestBed.createComponent(RegisterCompanyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize with termsAccepted as false and invalid', () => {
    expect(component.accountForm.controls.termsAccepted.value).toBe(false);
    expect(component.accountForm.controls.termsAccepted.valid).toBe(false);
    expect(component.accountForm.invalid).toBe(true);
  });

  it('should disable submit button when termsAccepted is false', () => {
    component.accountForm.controls.email.setValue('company@corp.com');
    component.accountForm.controls.password.setValue('Password123!');
    component.accountForm.controls.confirmPassword.setValue('Password123!');
    fixture.detectChanges();

    const submitBtn: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(submitBtn.disabled).toBe(true);

    component.accountForm.controls.termsAccepted.setValue(true);
    fixture.detectChanges();
    expect(submitBtn.disabled).toBe(false);
  });

  it('should call openTerms with tab 0 when clicking terms link', () => {
    const event = new MouseEvent('click');
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
    const stopPropagationSpy = vi.spyOn(event, 'stopPropagation');

    component.openTerms(0, event);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(stopPropagationSpy).toHaveBeenCalled();
    expect(mockDialog.open).toHaveBeenCalledWith(
      TermsPolicyDialogComponent,
      expect.objectContaining({
        data: { defaultTab: 0 },
      })
    );
  });

  it('should call openTerms with tab 1 when clicking privacy policy link', () => {
    component.openTerms(1);

    expect(mockDialog.open).toHaveBeenCalledWith(
      TermsPolicyDialogComponent,
      expect.objectContaining({
        data: { defaultTab: 1 },
      })
    );
  });

  it('should not submit if termsAccepted is false', () => {
    component.accountForm.controls.email.setValue('company@corp.com');
    component.accountForm.controls.password.setValue('Password123!');
    component.accountForm.controls.confirmPassword.setValue('Password123!');
    component.accountForm.controls.termsAccepted.setValue(false);

    component.onSubmit();

    expect(mockAuthService.register).not.toHaveBeenCalled();
    expect(component.accountForm.controls.termsAccepted.touched).toBe(true);
  });

  it('should submit successfully when form and terms are valid', () => {
    component.accountForm.controls.email.setValue('company@corp.com');
    component.accountForm.controls.password.setValue('Password123!');
    component.accountForm.controls.confirmPassword.setValue('Password123!');
    component.accountForm.controls.termsAccepted.setValue(true);

    component.onSubmit();

    expect(mockAuthService.register).toHaveBeenCalledWith({
      email: 'company@corp.com',
      password: 'Password123!',
      role: UserRole.COMPANY,
    });
  });
});
