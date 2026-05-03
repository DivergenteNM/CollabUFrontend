import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { ApiResponse, UserProfile, normalizeApiResponse } from '../models';

export interface CreateUserProfilePayload {
  userId: string;
  role: string;
  firstName: string;
  lastName: string;
  phone?: string;
  phoneCountryCode?: string;
  dateOfBirth?: string;
  gender?: string;
  bio?: string;
  city?: string;
  department?: string;
  country?: string;
}

export type UpdateUserProfilePayload = Partial<Omit<CreateUserProfilePayload, 'role'>> & {
  address?: string;
  websiteUrl?: string;
  linkedinUrl?: string;
  avatarUrl?: string;
};

@Injectable({ providedIn: 'root' })
export class UserProfileService extends BaseApiService {
  protected readonly basePath = '/users';

  getMyProfile(): Observable<ApiResponse<UserProfile>> {
    return this.http
      .get<ApiResponse<UserProfile> | UserProfile>(`${this.apiUrl}/profile`)
      .pipe(map((res) => normalizeApiResponse<UserProfile>(res, 'Perfil obtenido')));
  }

  getProfileById(userId: string): Observable<ApiResponse<UserProfile>> {
    return this.http
      .get<ApiResponse<UserProfile> | UserProfile>(`${this.apiUrl}/profile/${userId}`)
      .pipe(map((res) => normalizeApiResponse<UserProfile>(res, 'Perfil obtenido')));
  }

  createProfile(data: CreateUserProfilePayload): Observable<ApiResponse<UserProfile>> {
    return this.http
      .post<ApiResponse<UserProfile> | UserProfile>(`${this.apiUrl}/profile`, data)
      .pipe(map((res) => normalizeApiResponse<UserProfile>(res, 'Perfil creado')));
  }

  updateProfile(data: UpdateUserProfilePayload): Observable<ApiResponse<UserProfile>> {
    return this.http
      .patch<ApiResponse<UserProfile> | UserProfile>(`${this.apiUrl}/profile`, data)
      .pipe(map((res) => normalizeApiResponse<UserProfile>(res, 'Perfil actualizado')));
  }
}
