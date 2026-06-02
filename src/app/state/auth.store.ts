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
    onboardingRequired: computed(() => {
      const role = store.user()?.role;
      const requiresOnboarding = role === UserRole.STUDENT || role === UserRole.COMPANY;

      if (!requiresOnboarding || !store.token() || !store.user() || !store.profileLoaded()) {
        return false;
      }

      if (!store.profile()) {
        return true;
      }

      return !store.profile()!.isOnboardingComplete;
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

    const enforceOnboardingNavigation = (): void => {
      const role = store.user()?.role;
      const requiresOnboardingRole = role === UserRole.STUDENT || role === UserRole.COMPANY;

      if (!requiresOnboardingRole || !store.profileLoaded()) {
        return;
      }

      const needsOnboarding = !store.profile() || !store.profile()!.isOnboardingComplete;
      const currentUrl = router.url;

      if (needsOnboarding && !currentUrl.startsWith('/onboarding')) {
        router.navigate(['/onboarding']);
      }

      if (!needsOnboarding && currentUrl.startsWith('/onboarding')) {
        router.navigate(['/dashboard']);
      }
    };

    const loadUserProfile = (): void => {
      if (!store.isAuthenticated()) {
        patchState(store, {
          profile: null,
          profileLoaded: false,
          profileLoading: false,
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
        });
      },

      loadUserProfile(): void {
        loadUserProfile();
      },

      refreshProfile(): void {
        loadUserProfile();
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
