import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { TokenService } from './token.service';
import {
  ApiResponse,
  AuthUser,
  AuthResponse,
  RefreshAuthResponse,
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  unwrapApiResponse,
} from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService extends BaseApiService {
  protected readonly basePath = '/auth';
  private readonly tokenService = inject(TokenService);

  private normalizeAuthUser(user: AuthUser): AuthUser {
    const verified = user.isVerified ?? user.isEmailVerified ?? false;
    return {
      ...user,
      isVerified: verified,
      isEmailVerified: verified,
    };
  }

  private normalizeAuthResponse(response: AuthResponse): AuthResponse {
    return {
      ...response,
      user: this.normalizeAuthUser(response.user),
    };
  }

  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<ApiResponse<AuthResponse> | AuthResponse>(`${this.apiUrl}/login`, data)
      .pipe(
        map((res) => unwrapApiResponse<AuthResponse>(res)),
        map((res) => this.normalizeAuthResponse(res)),
      );
  }

  register(data: RegisterRequest): Observable<ApiResponse<{ message: string }>> {
    return this.http.post<ApiResponse<{ message: string }>>(`${this.apiUrl}/register`, data);
  }

  refreshToken(): Observable<RefreshAuthResponse> {
    const refreshToken = this.tokenService.getRefreshToken();
    return this.http
      .post<ApiResponse<RefreshAuthResponse> | RefreshAuthResponse>(`${this.apiUrl}/refresh`, { refreshToken })
      .pipe(map((res) => unwrapApiResponse<RefreshAuthResponse>(res)));
  }

  forgotPassword(data: ForgotPasswordRequest): Observable<ApiResponse<{ message: string }>> {
    return this.http.post<ApiResponse<{ message: string }>>(`${this.apiUrl}/forgot-password`, data);
  }

  resetPassword(data: ResetPasswordRequest): Observable<ApiResponse<{ message: string }>> {
    return this.http.post<ApiResponse<{ message: string }>>(`${this.apiUrl}/reset-password`, data);
  }

  changePassword(data: ChangePasswordRequest): Observable<ApiResponse<{ message: string }>> {
    return this.http.post<ApiResponse<{ message: string }>>(`${this.apiUrl}/change-password`, data);
  }

  verifyEmail(token: string): Observable<ApiResponse<{ message: string }>> {
    return this.http.post<ApiResponse<{ message: string }>>(`${this.apiUrl}/verify-email`, { token });
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/logout`, {});
  }

  getAccessToken(): string | null {
    return this.tokenService.getAccessToken();
  }
}
