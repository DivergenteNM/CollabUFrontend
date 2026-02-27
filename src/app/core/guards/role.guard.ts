import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthStore } from '../../state/auth.store';
import { UserRole } from '../enums';

export const roleGuard = (...allowedRoles: UserRole[]): CanActivateFn => {
  return () => {
    const authStore = inject(AuthStore);
    const router = inject(Router);

    const userRole = authStore.role();
    if (userRole && allowedRoles.includes(userRole as UserRole)) {
      return true;
    }
    return router.createUrlTree(['/dashboard']);
  };
};
