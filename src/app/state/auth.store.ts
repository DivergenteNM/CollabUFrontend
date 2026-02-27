import {
  signalStore, withState, withMethods, withComputed, withHooks, patchState
} from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TokenService } from '../core/services/token.service';
import { AuthUser } from '../core/models';
import { UserRole } from '../core/enums';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: false,
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
    displayName: computed(() => {
      const user = store.user();
      return user ? `${(user as any).firstName ?? ''} ${(user as any).lastName ?? ''}`.trim() || user.email : '';
    }),
  })),

  withMethods((store) => {
    const tokenService = inject(TokenService);
    const router = inject(Router);

    return {
      setAuth(user: AuthUser, token: string, refreshToken: string): void {
        tokenService.saveTokens(token, refreshToken);
        tokenService.saveUser(user);
        patchState(store, { user, token, isLoading: false });
      },

      clearAuth(): void {
        tokenService.clearTokens();
        patchState(store, { user: null, token: null, isLoading: false });
        router.navigate(['/auth/login']);
      },

      setLoading(isLoading: boolean): void {
        patchState(store, { isLoading });
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
      }
    },
  })
);
