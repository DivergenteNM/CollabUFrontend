import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthStore } from './auth.store';
import { TokenService } from '../core/services/token.service';
import { UserRole } from '../core/enums';
import { AuthUser } from '../core/models';

const mockUser: AuthUser = {
  id: '1',
  email: 'test@udenar.edu.co',
  role: UserRole.STUDENT,
  isEmailVerified: true,
  isActive: true,
};

describe('AuthStore', () => {
  let store: InstanceType<typeof AuthStore>;
  let tokenService: TokenService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: '**', component: class {} }]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    store = TestBed.inject(AuthStore);
    tokenService = TestBed.inject(TokenService);
  });

  it('should start unauthenticated', () => {
    expect(store.isAuthenticated()).toBe(false);
    expect(store.user()).toBeNull();
    expect(store.token()).toBeNull();
  });

  it('should set auth and persist tokens', () => {
    store.setAuth(mockUser, 'access-token-123', 'refresh-token-456');

    expect(store.isAuthenticated()).toBe(true);
    expect(store.user()).toEqual(mockUser);
    expect(store.token()).toBe('access-token-123');
    expect(tokenService.getAccessToken()).toBe('access-token-123');
    expect(tokenService.getRefreshToken()).toBe('refresh-token-456');
  });

  it('should clear auth and remove tokens', () => {
    store.setAuth(mockUser, 'token', 'refresh');
    store.clearAuth();

    expect(store.isAuthenticated()).toBe(false);
    expect(store.user()).toBeNull();
    expect(store.token()).toBeNull();
    expect(tokenService.getAccessToken()).toBeNull();
  });

  it('should rehydrate from localStorage on init', () => {
    tokenService.saveTokens('saved-token', 'saved-refresh');
    tokenService.saveUser(mockUser);

    // Re-create the store to trigger onInit
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: '**', component: class {} }]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    const freshStore = TestBed.inject(AuthStore);

    expect(freshStore.isAuthenticated()).toBe(true);
    expect(freshStore.user()?.email).toBe('test@udenar.edu.co');
  });

  it('should compute isAuthenticated correctly', () => {
    expect(store.isAuthenticated()).toBe(false);
    store.setAuth(mockUser, 'token', 'refresh');
    expect(store.isAuthenticated()).toBe(true);
  });

  it('should compute role-specific flags for student', () => {
    store.setAuth(mockUser, 'token', 'refresh');

    expect(store.isStudent()).toBe(true);
    expect(store.isCompany()).toBe(false);
    expect(store.isFaculty()).toBe(false);
    expect(store.isAdmin()).toBe(false);
    expect(store.isFacultyAdmin()).toBe(false);
    expect(store.role()).toBe(UserRole.STUDENT);
  });

  it('should compute role-specific flags for company', () => {
    const companyUser = { ...mockUser, role: UserRole.COMPANY } as AuthUser;
    store.setAuth(companyUser, 'token', 'refresh');

    expect(store.isStudent()).toBe(false);
    expect(store.isCompany()).toBe(true);
    expect(store.isFacultyAdmin()).toBe(false);
  });

  it('should compute role-specific flags for faculty and admin', () => {
    const facultyUser = { ...mockUser, role: UserRole.FACULTY } as AuthUser;
    store.setAuth(facultyUser, 'token', 'refresh');
    expect(store.isFaculty()).toBe(true);
    expect(store.isFacultyAdmin()).toBe(true);

    const adminUser = { ...mockUser, role: UserRole.ADMIN } as AuthUser;
    store.setAuth(adminUser, 'token', 'refresh');
    expect(store.isAdmin()).toBe(true);
    expect(store.isFacultyAdmin()).toBe(true);
  });

  it('should compute displayName falling back to email', () => {
    store.setAuth(mockUser, 'token', 'refresh');
    expect(store.displayName()).toBe('test@udenar.edu.co');
  });

  it('should set loading state', () => {
    expect(store.isLoading()).toBe(false);
    store.setLoading(true);
    expect(store.isLoading()).toBe(true);
    store.setLoading(false);
    expect(store.isLoading()).toBe(false);
  });

  describe('onboardingRequired', () => {
    it('should be false when not authenticated', () => {
      expect(store.onboardingRequired()).toBe(false);
    });

    it('should be false for admin users', () => {
      store.setAuth({ ...mockUser, role: UserRole.ADMIN }, 'token', 'refresh');
      expect(store.onboardingRequired()).toBe(false);
    });

    it('should be true when student has no profile and profile is loaded', () => {
      store.setAuth(mockUser, 'token', 'refresh');
      store.setProfile(null);
      expect(store.onboardingRequired()).toBe(true);
    });

    it('should be true when student has empty profile', () => {
      store.setAuth(mockUser, 'token', 'refresh');
      store.setProfile({
        id: 'p1',
        userId: '1',
        firstName: '',
        lastName: '',
        profileCompleteness: 0,
        isOnboardingComplete: false,
      } as any);
      expect(store.onboardingRequired()).toBe(true);
    });

    it('should be false when student has base names (partially or totally complete)', () => {
      store.setAuth(mockUser, 'token', 'refresh');
      store.setProfile({
        id: 'p1',
        userId: '1',
        firstName: 'Juan',
        lastName: 'Pérez',
        profileCompleteness: 50,
        isOnboardingComplete: false,
      } as any);
      expect(store.onboardingRequired()).toBe(false);
    });

    it('should be false when student has isOnboardingComplete true', () => {
      store.setAuth(mockUser, 'token', 'refresh');
      store.setProfile({
        id: 'p1',
        userId: '1',
        firstName: 'Juan',
        lastName: 'Pérez',
        profileCompleteness: 100,
        isOnboardingComplete: true,
      } as any);
      expect(store.onboardingRequired()).toBe(false);
    });
  });
});
