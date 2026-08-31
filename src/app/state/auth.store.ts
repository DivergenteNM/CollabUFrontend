import {
  signalStore, withState, withMethods, withComputed, withHooks, patchState
} from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { TokenService } from '../core/services/token.service';
import { UserProfileService } from '../core/services/user-profile.service';
import { AuthUser, UserProfile } from '../core/models';
import { UserRole } from '../core/enums';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  profile: UserProfile | null;
  profileLoaded: boolean;
  profileLoading: boolean;
  isLoading: boolean;
  authReady: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  profile: null,
  profileLoaded: false,
  profileLoading: false,
  isLoading: false,
  authReady: false,
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),

  withComputed((store) => ({
    isAuthenticated: computed(() => !!store.token() && !!store.user()),
    role: computed(() => store.user()?.role ?? null),
    isStudent: computed(() => store.user()?.role === UserRole.STUDENT),
    isCompany: computed(() => store.user()?.role === UserRole.COMPANY),
    isFaculty: computed(() => store.user()?.role === UserRole.FACULTY),
    isAdmin: computed(() => store.user()?.role === UserRole.ADMIN),
    isFacultyAdmin: computed(() => {
      const role = store.user()?.role;
      return role === UserRole.FACULTY || role === UserRole.ADMIN || (role as string) === 'faculty_admin';
    }),
    onboardingRequired: computed(() => {
      const role = store.user()?.role;
      const requiresOnboarding =
        role === UserRole.STUDENT || role === UserRole.COMPANY || role === UserRole.FACULTY;

      if (!requiresOnboarding || !store.token() || !store.user() || !store.profileLoaded()) {
        return false;
      }

      const profile = store.profile();
      if (!profile) {
        return true;
      }

      // Si ya está explícitamente marcado como completo
      if (profile.isOnboardingComplete) {
        return false;
      }

      // Si el perfil ya cuenta con datos básicos (nombres o completitud > 0),
      // el usuario no debe ser forzado al onboarding.
      const hasBaseData = Boolean(
        (profile.firstName && profile.firstName.trim().length > 0) ||
        (profile.lastName && profile.lastName.trim().length > 0) ||
        (profile.profileCompleteness && profile.profileCompleteness > 0)
      );

      if (hasBaseData) {
        return false;
      }

      return true;
    }),
    displayName: computed(() => {
      const profile = store.profile();
      if (profile) {
        return `${profile.firstName} ${profile.lastName}`.trim();
      }

      const user = store.user();
      return user ? user.email : '';
    }),
  })),

  withMethods((store) => {
    const tokenService = inject(TokenService);
    const router = inject(Router);
    const userProfileService = inject(UserProfileService);

    const loadUserProfile = (): void => {
      if (!store.isAuthenticated()) {
        patchState(store, {
          profile: null,
          profileLoaded: false,
          profileLoading: false,
          authReady: true,
        });
        return;
      }

      patchState(store, { profileLoading: true });

      userProfileService.getMyProfile().subscribe({
        next: (res) => {
          patchState(store, {
            profile: res.data,
            profileLoaded: true,
            profileLoading: false,
            authReady: true,
          });
        },
        error: (error: HttpErrorResponse) => {
          patchState(store, {
            profile: null,
            profileLoaded: true,
            profileLoading: false,
            authReady: true,
          });

          // 404 significa que el perfil base aún no existe y debe completarse en onboarding.
          if (error.status !== 404) {
            console.warn('No se pudo cargar el perfil de usuario', error);
          }
        },
      });
    };

    return {
      setAuth(user: AuthUser, token: string, refreshToken: string): void {
        tokenService.saveTokens(token, refreshToken);
        tokenService.saveUser(user);
        patchState(store, {
          user,
          token,
          profile: null,
          profileLoaded: false,
          profileLoading: false,
          isLoading: false,
          authReady: false,
        });

        loadUserProfile();
      },

      clearAuth(): void {
        tokenService.clearTokens();
        patchState(store, {
          user: null,
          token: null,
          profile: null,
          profileLoaded: false,
          profileLoading: false,
          isLoading: false,
          authReady: true,
        });
        router.navigate(['/auth/login']);
      },

      setLoading(isLoading: boolean): void {
        patchState(store, { isLoading });
      },

      setProfile(profile: UserProfile | null): void {
        patchState(store, {
          profile,
          profileLoaded: true,
          profileLoading: false,
          authReady: true,
        });
      },

      loadUserProfile(): void {
        loadUserProfile();
      },

      refreshProfile(): void {
        loadUserProfile();
      },

      updateTokens(accessToken: string, refreshToken: string): void {
        tokenService.saveTokens(accessToken, refreshToken);
        patchState(store, { token: accessToken });
      },
    };
  }),

  withHooks({
    onInit(store) {
      const tokenService = inject(TokenService);
      const token = tokenService.getAccessToken();
      const user = tokenService.getUser();
      if (token && user) {
        patchState(store, { user, token });
        store.loadUserProfile();
      } else {
        patchState(store, { authReady: true });
      }
    },
  })
);
