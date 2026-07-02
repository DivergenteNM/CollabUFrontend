import { CanActivateFn, Router } from '@angular/router';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';
import { AuthStore } from '../../state/auth.store';
import { UserRole } from '../enums';

export const roleGuard = (...allowedRoles: UserRole[]): CanActivateFn => {
  return () => {
    const platformId = inject(PLATFORM_ID);

    // On the server there is no localStorage — skip role checks and let the browser decide after hydration
    if (!isPlatformBrowser(platformId)) {
      return true;
    }

    const authStore = inject(AuthStore);
    const router = inject(Router);

    return toObservable(authStore.authReady).pipe(
      filter((ready) => ready),
      take(1),
      map(() => {
        const userRole = authStore.role();
        if (userRole && allowedRoles.includes(userRole as UserRole)) {
          return true;
        }
        return router.createUrlTree(['/dashboard']);
      })
    );
  };
};

