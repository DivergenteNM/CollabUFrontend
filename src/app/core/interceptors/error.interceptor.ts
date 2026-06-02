import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);

  // On the server there is no token/session — just propagate errors without redirecting
  if (!isPlatformBrowser(platformId)) {
    return next(req);
  }

  const authService = inject(AuthService);
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      switch (error.status) {
        case 401:
          // Intentar refresh token
          if (!req.url.includes('/auth/refresh') && !req.url.includes('/auth/login')) {
            return authService.refreshToken().pipe(
              switchMap(() => {
                const token = authService.getAccessToken();
                const cloned = req.clone({
                  setHeaders: { Authorization: `Bearer ${token}` }
                });
                return next(cloned);
              }),
              catchError(() => {
                authService.logout();
                router.navigate(['/auth/login']);
                return throwError(() => error);
              })
            );
          }
          authService.logout();
          router.navigate(['/auth/login']);
          break;

        case 403:
          snackBar.open('No tienes permiso para realizar esta acción', 'Cerrar', {
            duration: 5000,
            panelClass: ['snackbar-error']
          });
          break;

        case 404:
          // No mostrar snackbar, el componente maneja
          break;

        case 409:
          snackBar.open(error.error?.message || 'Conflicto: el recurso ya existe', 'Cerrar', {
            duration: 5000,
            panelClass: ['snackbar-warning']
          });
          break;

        case 422:
          // Errores de validación — el formulario los maneja
          break;

        case 429:
          snackBar.open('Demasiadas solicitudes. Por favor, espera un momento.', 'Cerrar', {
            duration: 5000,
            panelClass: ['snackbar-warning']
          });
          break;

        case 500:
        case 502:
        case 503:
          snackBar.open('Error del servidor. Intenta de nuevo más tarde.', 'Cerrar', {
            duration: 5000,
            panelClass: ['snackbar-error']
          });
          break;

        case 0:
          snackBar.open('Sin conexión a internet', 'Cerrar', {
            duration: 5000,
            panelClass: ['snackbar-error']
          });
          break;
      }

      return throwError(() => error);
    })
  );
};

