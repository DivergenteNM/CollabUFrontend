import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';
import { AuthUser } from '../models';

@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly platformId = inject(PLATFORM_ID);

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  getAccessToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem(environment.tokenKey);
  }

  getRefreshToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem(environment.refreshTokenKey);
  }

  saveTokens(accessToken: string, refreshToken: string): void {
    if (!this.isBrowser) return;
    localStorage.setItem(environment.tokenKey, accessToken);
    localStorage.setItem(environment.refreshTokenKey, refreshToken);
  }

  clearTokens(): void {
    if (!this.isBrowser) return;
    localStorage.removeItem(environment.tokenKey);
    localStorage.removeItem(environment.refreshTokenKey);
    localStorage.removeItem('collabu_user');
  }

  saveUser(user: AuthUser): void {
    if (!this.isBrowser) return;
    localStorage.setItem('collabu_user', JSON.stringify(user));
  }

  getUser(): AuthUser | null {
    if (!this.isBrowser) return null;
    const raw = localStorage.getItem('collabu_user');
    return raw ? JSON.parse(raw) : null;
  }
}
