import { CanActivateFn, Router } from '@angular/router';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';
import { AuthStore } from '../../state/auth.store';

/** Solo el administrador de Facultad (superadmin). Un admin de departamento vuelve al dashboard. */
export const superAdminGuard: CanActivateFn = () => {
  const platformId = inject(PLATFORM_ID);
  if (!isPlatformBrowser(platformId)) return true;

  const authStore = inject(AuthStore);
  const router = inject(Router);

  return toObservable(authStore.authReady).pipe(
    filter((ready) => ready),
    take(1),
    map(() => (authStore.isSuperAdmin() ? true : router.createUrlTree(['/dashboard']))),
  );
};
