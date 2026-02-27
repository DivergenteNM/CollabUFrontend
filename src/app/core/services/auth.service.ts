import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { TokenService } from './token.service';
import {
  ApiResponse,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService extends BaseApiService {
  protected readonly basePath = '/auth';
  private readonly tokenService = inject(TokenService);

  login(data: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/login`, data);
  }

  register(data: RegisterRequest): Observable<ApiResponse<{ message: string }>> {
    return this.http.post<ApiResponse<{ message: string }>>(`${this.apiUrl}/register`, data);
  }

  refreshToken(): Observable<ApiResponse<AuthResponse>> {
    const refreshToken = this.tokenService.getRefreshToken();
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/refresh`, { refreshToken });
  }

  forgotPassword(data: ForgotPasswordRequest): Observable<ApiResponse<{ message: string }>> {
    return this.http.post<ApiResponse<{ message: string }>>(`${this.apiUrl}/forgot-password`, data);
  }

  resetPassword(data: ResetPasswordRequest): Observable<ApiResponse<{ message: string }>> {
    return this.http.post<ApiResponse<{ message: string }>>(`${this.apiUrl}/reset-password`, data);
  }

  verifyEmail(token: string): Observable<ApiResponse<{ message: string }>> {
    return this.http.get<ApiResponse<{ message: string }>>(`${this.apiUrl}/verify-email?token=${token}`);
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/logout`, {});
  }

  getAccessToken(): string | null {
    return this.tokenService.getAccessToken();
  }
}
