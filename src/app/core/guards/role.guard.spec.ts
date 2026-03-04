import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { roleGuard } from './role.guard';
import { AuthStore } from '../../state/auth.store';
import { UserRole } from '../enums';
import { AuthUser } from '../models';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

const mockStudent: AuthUser = {
  id: '1',
  email: 'student@udenar.edu.co',
  role: UserRole.STUDENT,
  isEmailVerified: true,
  isActive: true,
};

const mockAdmin: AuthUser = {
  id: '2',
  email: 'admin@udenar.edu.co',
  role: UserRole.ADMIN,
  isEmailVerified: true,
  isActive: true,
};

describe('roleGuard', () => {
  let authStore: InstanceType<typeof AuthStore>;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });
    authStore = TestBed.inject(AuthStore);
  });

  it('should allow access for matching role (STUDENT)', () => {
    authStore.setAuth(mockStudent, 'token', 'refresh');
    const guard = roleGuard(UserRole.STUDENT);

    const result = TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );

    expect(result).toBe(true);
  });

  it('should allow access when role is in the allowed list', () => {
    authStore.setAuth(mockAdmin, 'token', 'refresh');
    const guard = roleGuard(UserRole.ADMIN, UserRole.FACULTY);

    const result = TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );

    expect(result).toBe(true);
  });

  it('should deny access for non-matching role', () => {
    authStore.setAuth(mockStudent, 'token', 'refresh');
    const guard = roleGuard(UserRole.ADMIN);

    const result = TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );

    expect(result).not.toBe(true);
    expect(result.toString()).toContain('dashboard');
  });

  it('should deny access when no user is set', () => {
    const guard = roleGuard(UserRole.STUDENT);

    const result = TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );

    expect(result).not.toBe(true);
  });
});
