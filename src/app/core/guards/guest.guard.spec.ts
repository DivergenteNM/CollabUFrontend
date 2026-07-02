import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { guestGuard } from './guest.guard';
import { AuthStore } from '../../state/auth.store';
import { AuthUser } from '../../core/models';
import { UserRole } from '../../core/enums/user-role.enum';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

const mockUser: AuthUser = {
  id: '1',
  email: 'test@udenar.edu.co',
  role: UserRole.STUDENT,
  isEmailVerified: true,
  isActive: true,
};

describe('guestGuard', () => {
  let authStore: InstanceType<typeof AuthStore>;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });
    authStore = TestBed.inject(AuthStore);
  });

  it('should allow navigation when NOT authenticated', () => {
    const result = TestBed.runInInjectionContext(() =>
      guestGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );
    expect(result).toBe(true);
  });

  it('should redirect to dashboard when authenticated', () => {
    authStore.setAuth(mockUser, 'token', 'refresh');

    const result = TestBed.runInInjectionContext(() =>
      guestGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );

    expect(result).not.toBe(true);
    expect(result.toString()).toContain('dashboard');
  });
});
