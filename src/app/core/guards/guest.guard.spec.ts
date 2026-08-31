import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { firstValueFrom, isObservable } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { guestGuard } from './guest.guard';
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

describe('guestGuard', () => {
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

  it('should allow navigation when NOT authenticated', async () => {
    authStore.clearAuth();

    const guardResult = TestBed.runInInjectionContext(() =>
      guestGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );

    const result = isObservable(guardResult) ? await firstValueFrom(guardResult) : guardResult;
    expect(result).toBe(true);
  });

  it('should redirect to dashboard when authenticated and onboarding complete', async () => {
    authStore.setAuth(mockUser, 'token', 'refresh');
    authStore.setProfile({
      id: 'p1',
      userId: '1',
      firstName: 'Juan',
      lastName: 'Pérez',
      isOnboardingComplete: true,
    } as any);

    const guardResult = TestBed.runInInjectionContext(() =>
      guestGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );

    const result = isObservable(guardResult) ? await firstValueFrom(guardResult) : guardResult;
    expect(result instanceof UrlTree).toBe(true);
    expect((result as UrlTree).toString()).toBe('/dashboard');
  });

  it('should redirect to dashboard when authenticated regardless of onboarding flag', async () => {
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
      guestGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );

    const result = isObservable(guardResult) ? await firstValueFrom(guardResult) : guardResult;
    expect(result instanceof UrlTree).toBe(true);
    expect((result as UrlTree).toString()).toBe('/dashboard');
  });
});
