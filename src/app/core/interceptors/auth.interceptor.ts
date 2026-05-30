import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TokenService } from '../services/token.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);

  // On the server localStorage doesn't exist — skip token injection
  if (!isPlatformBrowser(platformId)) {
    return next(req);
  }

  const tokenService = inject(TokenService);
  const token = tokenService.getAccessToken();

  const publicUrls = ['/auth/login', '/auth/register', '/auth/forgot-password',
                       '/auth/reset-password', '/auth/verify-email'];
  const isPublic = publicUrls.some(url => req.url.includes(url));

  // No inyectar el AccessToken si la llamada es para refrescar el token
  if (token && !isPublic && !req.url.includes('/auth/refresh')) {
    const cloned = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
    return next(cloned);
  }

  // Si vas a refrescar el token, inyecta el RefreshToken
  if (!isPublic && req.url.includes('/auth/refresh')) {
    const refreshToken = tokenService.getRefreshToken();
    if (refreshToken) {
      const cloned = req.clone({
        setHeaders: { Authorization: `Bearer ${refreshToken}` }
      });
      return next(cloned);
    }
  }

  return next(req);
};
