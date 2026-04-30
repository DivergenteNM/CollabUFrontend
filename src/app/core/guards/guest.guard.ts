import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthStore } from '../../state/auth.store';
import { UserRole } from '../enums';

export const guestGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (!authStore.isAuthenticated()) {
    return true;
  }

  const role = authStore.role();
  const requiresOnboarding = role === UserRole.STUDENT || role === UserRole.COMPANY;

  if (requiresOnboarding && authStore.profileLoaded() && authStore.onboardingRequired()) {
    return router.createUrlTree(['/onboarding']);
  }

  return router.createUrlTree(['/dashboard']);
};
