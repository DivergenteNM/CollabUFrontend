import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../core/services/base-api.service';
import {
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  CompanyVerification,
  SupervisorAssignment,
  AcademicPeriod,
} from '../../../core/models';

@Injectable({ providedIn: 'root' })
export class AdminService extends BaseApiService {
  protected readonly basePath = '/admin';

  getVerifications(params: PaginationParams & { status?: string }): Observable<PaginatedResponse<CompanyVerification>> {
    return this.http.get<PaginatedResponse<CompanyVerification>>(`${this.apiUrl}/verifications`, {
      params: this.buildParams(params)
    });
  }

  reviewVerification(id: string, data: { status: 'approved' | 'rejected'; reason?: string }): Observable<ApiResponse<CompanyVerification>> {
    return this.http.patch<ApiResponse<CompanyVerification>>(`${this.apiUrl}/verifications/${id}`, data);
  }

  assignSupervisor(data: { studentId: string; facultyId: string; applicationId: string }): Observable<ApiResponse<SupervisorAssignment>> {
    return this.http.post<ApiResponse<SupervisorAssignment>>(`${this.apiUrl}/supervisors`, data);
  }

  getAssignments(params: PaginationParams): Observable<PaginatedResponse<SupervisorAssignment>> {
    return this.http.get<PaginatedResponse<SupervisorAssignment>>(`${this.apiUrl}/supervisors`, {
      params: this.buildParams(params)
    });
  }

  getPeriods(): Observable<ApiResponse<AcademicPeriod[]>> {
    return this.http.get<ApiResponse<AcademicPeriod[]>>(`${this.apiUrl}/periods`);
  }

  createPeriod(data: Partial<AcademicPeriod>): Observable<ApiResponse<AcademicPeriod>> {
    return this.http.post<ApiResponse<AcademicPeriod>>(`${this.apiUrl}/periods`, data);
  }
}
