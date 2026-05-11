import { CanActivateFn, Router } from '@angular/router';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';
import { AuthStore } from '../../state/auth.store';
import { UserRole } from '../enums';

export const authGuard: CanActivateFn = (_route, state) => {
  const platformId = inject(PLATFORM_ID);

  // On the server there is no localStorage — skip auth checks and let the browser decide after hydration
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const authStore = inject(AuthStore);
  const router = inject(Router);

  // Wait for auth initialization to complete before deciding
  return toObservable(authStore.authReady).pipe(
    filter((ready) => ready),
    take(1),
    map(() => {
      if (!authStore.isAuthenticated()) {
        return router.createUrlTree(['/auth/login']);
      }

      const role = authStore.role();
      const requiresOnboarding = role === UserRole.STUDENT || role === UserRole.COMPANY;

      if (!requiresOnboarding || !authStore.profileLoaded()) {
        return true;
      }

      if (authStore.onboardingRequired() && !state.url.startsWith('/onboarding')) {
        return router.createUrlTree(['/onboarding']);
      }

      if (!authStore.onboardingRequired() && state.url.startsWith('/onboarding')) {
        return router.createUrlTree(['/dashboard']);
      }

      return true;
    })
  );
};

