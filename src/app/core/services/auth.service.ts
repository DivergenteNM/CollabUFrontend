import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { TokenService } from './token.service';
import {
  ApiResponse,
  AuthResponse,
  RefreshAuthResponse,
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService extends BaseApiService {
  protected readonly basePath = '/auth';
  private readonly tokenService = inject(TokenService);

  private extractResponseData<T>(res: ApiResponse<T> | T): T {
    return ((res as ApiResponse<T>)?.data ?? res) as T;
  }

  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<ApiResponse<AuthResponse> | AuthResponse>(`${this.apiUrl}/login`, data)
      .pipe(map((res) => this.extractResponseData<AuthResponse>(res)));
  }

  register(data: RegisterRequest): Observable<ApiResponse<{ message: string }>> {
    return this.http.post<ApiResponse<{ message: string }>>(`${this.apiUrl}/register`, data);
  }

  refreshToken(): Observable<RefreshAuthResponse> {
    const refreshToken = this.tokenService.getRefreshToken();
    return this.http
      .post<ApiResponse<RefreshAuthResponse> | RefreshAuthResponse>(`${this.apiUrl}/refresh`, { refreshToken })
      .pipe(map((res) => this.extractResponseData<RefreshAuthResponse>(res)));
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
