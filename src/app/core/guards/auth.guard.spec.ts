import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { firstValueFrom, isObservable } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { authGuard } from './auth.guard';
import { AuthStore } from '../../state/auth.store';
import { AuthUser } from '../../core/models';
import { UserRole } from '../../core/enums/user-role.enum';

const mockUser: AuthUser = {
  id: '1',
  email: 'test@udenar.edu.co',
  role: UserRole.STUDENT,
  isEmailVerified: true,
  isActive: true,
};

describe('authGuard', () => {
  let authStore: InstanceType<typeof AuthStore>;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: '**', component: class {} }]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    authStore = TestBed.inject(AuthStore);
  });

  it('should allow navigation to any requested route when authenticated', async () => {
    authStore.setAuth(mockUser, 'token', 'refresh');
    authStore.setProfile({
      id: 'p1',
      userId: '1',
      firstName: 'Juan',
      lastName: 'Pérez',
      isOnboardingComplete: true,
    } as any);

    const guardResult = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url: '/projects/123' } as RouterStateSnapshot)
    );

    const result = isObservable(guardResult) ? await firstValueFrom(guardResult) : guardResult;
    expect(result).toBe(true);
  });

  it('should preserve requested target route without forcing onboarding', async () => {
    authStore.setAuth(mockUser, 'token', 'refresh');
    authStore.setProfile({
      id: 'p1',
      userId: '1',
      firstName: '',
      lastName: '',
      profileCompleteness: 0,
      isOnboardingComplete: false,
    } as any);

    const guardResult = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url: '/dashboard' } as RouterStateSnapshot)
    );

    const result = isObservable(guardResult) ? await firstValueFrom(guardResult) : guardResult;
    expect(result).toBe(true);
  });

  it('should redirect to login with returnUrl when not authenticated', async () => {
    authStore.clearAuth();

    const guardResult = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url: '/projects/detail/1' } as RouterStateSnapshot)
    );

    const result = isObservable(guardResult) ? await firstValueFrom(guardResult) : guardResult;
    expect(result instanceof UrlTree).toBe(true);
    expect((result as UrlTree).toString()).toContain('/auth/login');
    expect((result as UrlTree).queryParams['returnUrl']).toBe('/projects/detail/1');
  });
});
