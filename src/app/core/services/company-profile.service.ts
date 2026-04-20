import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BaseApiService } from './base-api.service';
import {
  ApiResponse,
  CompanyBusinessArea,
  CompanyContact,
  CompanyProfile,
  normalizeApiResponse,
} from '../models';

export interface CreateCompanyProfilePayload {
  companyName: string;
  legalName?: string;
  nit?: string;
  industry?: string;
  companySize?: CompanyProfile['companySize'];
  description?: string;
  website?: string;
  foundedYear?: number;
  headquartersCity?: string;
  headquartersState?: string;
  employeeCount?: number;
}

export interface UpdateCompanyProfilePayload extends Partial<CreateCompanyProfilePayload> {}

export interface CreateCompanyContactPayload {
  firstName: string;
  lastName: string;
  email: string;
  position?: string;
  phone?: string;
  isPrimary?: boolean;
}

export interface CreateBusinessAreaPayload {
  areaName: string;
  description?: string;
  displayOrder?: number;
}

@Injectable({ providedIn: 'root' })
export class CompanyProfileService extends BaseApiService {
  protected readonly basePath = '/companies';

  getProfile(): Observable<ApiResponse<CompanyProfile>> {
    return this.http
      .get<ApiResponse<CompanyProfile> | CompanyProfile>(`${this.apiUrl}/profile`)
      .pipe(map((res) => normalizeApiResponse<CompanyProfile>(res, 'Perfil de empresa obtenido')));
  }

  createProfile(data: CreateCompanyProfilePayload): Observable<ApiResponse<CompanyProfile>> {
    const payload = this.sanitizeCompanyPayload(data);

    return this.http
      .post<ApiResponse<CompanyProfile> | CompanyProfile>(`${this.apiUrl}/profile`, payload)
      .pipe(map((res) => normalizeApiResponse<CompanyProfile>(res, 'Perfil de empresa creado')));
  }

  updateProfile(data: UpdateCompanyProfilePayload): Observable<ApiResponse<CompanyProfile>> {
    const payload = this.sanitizeCompanyPayload(data);

    return this.http
      .patch<ApiResponse<CompanyProfile> | CompanyProfile>(`${this.apiUrl}/profile`, payload)
      .pipe(map((res) => normalizeApiResponse<CompanyProfile>(res, 'Perfil de empresa actualizado')));
  }

  getContacts(): Observable<ApiResponse<CompanyContact[]>> {
    return this.http
      .get<ApiResponse<CompanyContact[]> | CompanyContact[]>(`${this.apiUrl}/contacts`)
      .pipe(map((res) => normalizeApiResponse<CompanyContact[]>(res, 'Contactos obtenidos')));
  }

  addContact(data: CreateCompanyContactPayload): Observable<ApiResponse<CompanyContact>> {
    return this.http
      .post<ApiResponse<CompanyContact> | CompanyContact>(`${this.apiUrl}/contacts`, data)
      .pipe(map((res) => normalizeApiResponse<CompanyContact>(res, 'Contacto agregado')));
  }

  getBusinessAreas(): Observable<ApiResponse<CompanyBusinessArea[]>> {
    return this.http
      .get<ApiResponse<CompanyBusinessArea[]> | CompanyBusinessArea[]>(`${this.apiUrl}/business-areas`)
      .pipe(map((res) => normalizeApiResponse<CompanyBusinessArea[]>(res, 'Áreas de negocio obtenidas')));
  }

  addBusinessArea(data: CreateBusinessAreaPayload): Observable<ApiResponse<CompanyBusinessArea>> {
    return this.http
      .post<ApiResponse<CompanyBusinessArea> | CompanyBusinessArea>(`${this.apiUrl}/business-areas`, data)
      .pipe(map((res) => normalizeApiResponse<CompanyBusinessArea>(res, 'Área de negocio agregada')));
  }

  private sanitizeCompanyPayload(
    data: CreateCompanyProfilePayload | UpdateCompanyProfilePayload,
  ): Record<string, unknown> {
    return Object.entries(data).reduce<Record<string, unknown>>((acc, [key, value]) => {
      if (key === 'userId') {
        return acc;
      }

      if (value === undefined || value === null) {
        return acc;
      }

      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) {
          return acc;
        }

        acc[key] = trimmed;
        return acc;
      }

      acc[key] = value;
      return acc;
    }, {});
  }
}
