import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthStore } from '../../state/auth.store';
import { UserRole } from '../enums';

export const authGuard: CanActivateFn = (_route, state) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

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
};
