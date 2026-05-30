import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { BaseApiService } from '../../../core/services/base-api.service';
import { environment } from '../../../../environments/environment';
import {
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  CompanyVerification,
  SupervisorAssignment,
  AcademicPeriod,
} from '../../../core/models';

export interface AdminUserRow {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  lastLogin: string | null;
  createdAt: string;
}

export interface PendingApplicationRow {
  id: string;
  projectId: string;
  studentId: string;
  status: string;
  matchScore: number | null;
  appliedAt: string;
  acceptedAt: string | null;
  studentName: string;
  projectTitle: string;
  companyId: string | null;
}

export interface SupervisorRow {
  id: string;
  userId: string;
  department: string;
  role: string;
  specialization: string;
  maxStudents: number;
  currentStudents: number;
  isActive: boolean;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
}

@Injectable({ providedIn: 'root' })
export class AdminService extends BaseApiService {
  protected readonly basePath = '/admin';

  getUsers(params: PaginationParams & { search?: string; role?: string; isActive?: string }): Observable<PaginatedResponse<AdminUserRow>> {
    return this.http.get<PaginatedResponse<AdminUserRow>>(`${environment.apiUrl}/auth/admin/users`, {
      params: this.buildParams(params)
    });
  }

  getVerifications(params: PaginationParams & { status?: string }): Observable<PaginatedResponse<CompanyVerification>> {
    return this.http.get<PaginatedResponse<CompanyVerification>>(`${this.apiUrl}/verifications`, {
      params: this.buildParams(params)
    });
  }

  reviewVerification(id: string, data: { status: 'approved' | 'rejected'; reason?: string }): Observable<ApiResponse<CompanyVerification>> {
    return this.http.patch<ApiResponse<CompanyVerification>>(`${this.apiUrl}/verifications/${id}`, data);
  }

  getPendingApplications(params: { page?: number; limit?: number }): Observable<{ data: PendingApplicationRow[]; total: number; page: number; limit: number; totalPages: number }> {
    return this.http.get<{ data: PendingApplicationRow[]; total: number; page: number; limit: number; totalPages: number }>(
      `${environment.apiUrl}/applications/admin/pending`,
      { params: this.buildParams(params) }
    );
  }

  getSupervisors(isActive = true): Observable<SupervisorRow[]> {
    return this.http.get<SupervisorRow[]>(`${this.apiUrl}/supervisors`, {
      params: { isActive: String(isActive) }
    });
  }

  getCurrentPeriod(): Observable<{ data: AcademicPeriod[]; total: number }> {
    return this.http.get<{ data: AcademicPeriod[]; total: number }>(`${this.apiUrl}/periods`, {
      params: { isCurrent: 'true', limit: '1' }
    });
  }

  assignSupervisor(data: {
    supervisorId: string;
    studentId: string;
    projectId: string;
    applicationId: string;
    periodId: string;
    startDate: string;
    endDate?: string;
    notes?: string;
  }): Observable<SupervisorAssignment> {
    return this.http.post<SupervisorAssignment>(`${this.apiUrl}/supervisors/assign`, data);
  }

  getAssignments(params: PaginationParams): Observable<PaginatedResponse<SupervisorAssignment>> {
    return this.http.get<PaginatedResponse<SupervisorAssignment>>(`${this.apiUrl}/supervisors`, {
      params: this.buildParams(params)
    });
  }

  getPeriods(): Observable<ApiResponse<AcademicPeriod[]>> {
    return this.http.get<ApiResponse<AcademicPeriod[]>>(`${this.apiUrl}/periods`);
  }

  createPeriod(data: Partial<AcademicPeriod>): Observable<AcademicPeriod> {
    return this.http.post<AcademicPeriod>(`${this.apiUrl}/periods`, data);
  }

  updatePeriod(id: string, data: Partial<AcademicPeriod>): Observable<AcademicPeriod> {
    return this.http.put<AcademicPeriod>(`${this.apiUrl}/periods/${id}`, data);
  }
}
