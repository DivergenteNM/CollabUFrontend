import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { firstValueFrom, isObservable } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { roleGuard } from './role.guard';
import { AuthStore } from '../../state/auth.store';
import { UserRole } from '../enums';
import { AuthUser } from '../models';

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
      providers: [
        provideRouter([{ path: '**', component: class {} }]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    authStore = TestBed.inject(AuthStore);
  });

  it('should allow access for matching role (STUDENT)', async () => {
    authStore.setAuth(mockStudent, 'token', 'refresh');
    authStore.setProfile({
      id: 'p1',
      userId: '1',
      firstName: 'Juan',
      lastName: 'Pérez',
      isOnboardingComplete: true,
    } as any);

    const guard = roleGuard(UserRole.STUDENT);

    const guardResult = TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );

    const result = isObservable(guardResult) ? await firstValueFrom(guardResult) : guardResult;
    expect(result).toBe(true);
  });

  it('should allow access when role is in the allowed list', async () => {
    authStore.setAuth(mockAdmin, 'token', 'refresh');
    authStore.setProfile({
      id: 'p2',
      userId: '2',
      firstName: 'Admin',
      lastName: 'UDENAR',
      isOnboardingComplete: true,
    } as any);

    const guard = roleGuard(UserRole.ADMIN, UserRole.FACULTY);

    const guardResult = TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );

    const result = isObservable(guardResult) ? await firstValueFrom(guardResult) : guardResult;
    expect(result).toBe(true);
  });

  it('should deny access and redirect to dashboard for non-matching role', async () => {
    authStore.setAuth(mockStudent, 'token', 'refresh');
    authStore.setProfile({
      id: 'p1',
      userId: '1',
      firstName: 'Juan',
      lastName: 'Pérez',
      isOnboardingComplete: true,
    } as any);

    const guard = roleGuard(UserRole.ADMIN);

    const guardResult = TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );

    const result = isObservable(guardResult) ? await firstValueFrom(guardResult) : guardResult;
    expect(result instanceof UrlTree).toBe(true);
    expect((result as UrlTree).toString()).toBe('/dashboard');
  });

  it('should deny access when no user is set', async () => {
    authStore.clearAuth();
    const guard = roleGuard(UserRole.STUDENT);

    const guardResult = TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );

    const result = isObservable(guardResult) ? await firstValueFrom(guardResult) : guardResult;
    expect(result instanceof UrlTree).toBe(true);
    expect((result as UrlTree).toString()).toBe('/dashboard');
  });
});
