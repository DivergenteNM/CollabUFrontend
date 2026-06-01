import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../core/services/base-api.service';
import { environment } from '../../../../environments/environment';

export interface SupervisorAssignmentItem {
  id: string;
  supervisorId: string;
  studentId: string;
  projectId: string;
  applicationId: string;
  periodId: string;
  assignedBy: string;
  startDate: string;
  endDate: string | null;
  status: 'active' | 'completed' | 'transferred';
  notes: string | null;
  createdAt: string;
  supervisor: {
    id: string;
    userId: string;
    department: string | null;
    role: string;
    specialization: string | null;
    maxStudents: number;
    currentStudents: number;
    isActive: boolean;
  };
  period: {
    id: string;
    name: string;
    description: string | null;
    startDate: string;
    endDate: string;
    status: string;
    isCurrent: boolean;
  };
}

export interface MyStudentsResponse {
  data: SupervisorAssignmentItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserProfile {
  id: string;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface StudentProfile {
  id: string;
  userId: string;
  program: string | null;
  semester: number | null;
  code: string | null;
  faculty: string | null;
}

@Injectable({ providedIn: 'root' })
export class FacultyService extends BaseApiService {
  protected readonly basePath = '/admin';

  getMyStudents(params?: { status?: string; page?: number; limit?: number }): Observable<MyStudentsResponse> {
    let httpParams = new HttpParams();
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
    return this.http.get<MyStudentsResponse>(`${this.apiUrl}/supervisors/my-students`, { params: httpParams });
  }

  getUserProfile(userId: string): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${environment.apiUrl}/users/profile/${userId}`);
  }

  getStudentProfile(userId: string): Observable<StudentProfile> {
    return this.http.get<StudentProfile>(`${environment.apiUrl}/students/profile/${userId}`);
  }
}