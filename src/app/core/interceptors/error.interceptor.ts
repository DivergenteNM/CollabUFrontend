import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { AuthStore } from '../../state/auth.store';
import { MatSnackBar } from '@angular/material/snack-bar';

// Module-level state to deduplicate concurrent refresh attempts
let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);

  // On the server there is no token/session — just propagate errors without redirecting
  if (!isPlatformBrowser(platformId)) {
    return next(req);
  }

  const authService = inject(AuthService);
  const authStore = inject(AuthStore);
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      switch (error.status) {
        case 401:
          // Don't try to refresh if it's the refresh or login call itself
          if (!req.url.includes('/auth/refresh') && !req.url.includes('/auth/login')) {
            if (!isRefreshing) {
              isRefreshing = true;
              refreshTokenSubject.next(null);

              return authService.refreshToken().pipe(
                switchMap((res) => {
                  isRefreshing = false;
                  // Save new tokens in store + localStorage
                  authStore.updateTokens(res.accessToken, res.refreshToken);
                  refreshTokenSubject.next(res.accessToken);
                  return next(req.clone({ setHeaders: { Authorization: `Bearer ${res.accessToken}` } }));
                }),
                catchError((refreshError) => {
                  isRefreshing = false;
                  refreshTokenSubject.next(null);
                  // clearAuth clears localStorage tokens, in-memory state, and navigates to /auth/login
                  authStore.clearAuth();
                  return throwError(() => refreshError);
                })
              );
            } else {
              // Another request already triggered a refresh — wait for it to finish
              return refreshTokenSubject.pipe(
                filter((token) => token !== null),
                take(1),
                switchMap((token) =>
                  next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }))
                )
              );
            }
          }
          // Refresh or login endpoint returned 401 — session is dead
          authStore.clearAuth();
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

