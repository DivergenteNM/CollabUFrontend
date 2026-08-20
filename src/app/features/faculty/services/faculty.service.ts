import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../core/services/base-api.service';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models';

export type AssignmentRole = 'asesor' | 'jurado_anteproyecto' | 'jurado_final';
export type AssignmentStatus =
  | 'pending_acceptance' | 'accepted' | 'active' | 'declined' | 'disconnected' | 'replaced' | 'completed';

export interface SupervisorAssignmentItem {
  id: string;
  supervisorId: string;
  studentId: string;
  projectId: string;
  applicationId: string;
  periodId: string;
  assignedBy: string;
  role: AssignmentRole;
  startDate: string;
  endDate: string | null;
  status: AssignmentStatus;
  declineReason: string | null;
  acceptedAt: string | null;
  declinedAt: string | null;
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

export interface EnrichedAssignment {
  id: string;
  applicationId: string;
  studentId: string;
  projectId: string;
  periodId: string;
  assignedBy: string;
  role: AssignmentRole;
  startDate: string;
  endDate: string | null;
  status: AssignmentStatus;
  declineReason: string | null;
  notes: string | null;
  createdAt: string;
  studentName: string;
  studentCode: string | null;
  projectTitle: string;
  companyName: string;
}

export interface MyStudentsResponse {
  data: SupervisorAssignmentItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EnrichedStudentsResponse {
  data: EnrichedAssignment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AssignmentDetail {
  id: string;
  applicationId: string;
  studentId: string;
  projectId: string;
  periodId: string;
  periodName: string | null;
  assignedBy: string;
  role: 'asesor' | 'jurado_anteproyecto' | 'jurado_final';
  startDate: string;
  endDate: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  studentName: string;
  studentCode: string | null;
  studentProgram: string | null;
  studentSemester: number | null;
  projectTitle: string;
  companyName: string;
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

export interface Deliverable {
  id: string;
  applicationId: string;
  projectDeliverableId: string | null;
  title: string;
  description: string | null;
  fileUrl: string | null;
  fileSizeBytes: number | null;
  fileType: string | null;
  submittedAt: string | null;
  status: 'pending' | 'submitted' | 'approved' | 'rejected' | 'needs_revision';
  feedback: string | null;
  grade: number | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  revisionNumber: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Alineado con `Backend/services/evaluation-service` (ver core/models/evaluation.model.ts).
 * Se conserva la interfaz aquí para no romper import legacy en student-supervision.
 */
export interface EvaluationItem {
  id: string;
  evaluatorId: string;
  evaluatedId: string;
  applicationId: string;
  projectId: string;
  evaluationType: string;
  status: 'pending' | 'in_progress' | 'completed' | 'expired';
  overallScore: number | null;
  overallComment: string | null;
  strengths: string | null;
  areasForImprovement: string | null;
  isAnonymous: boolean;
  ratings: Array<{
    id?: string;
    criterionId: string;
    score: number;
    comment?: string | null;
    criterion?: { id: string; name: string };
  }>;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
}

export type SupervisorRole = 'academic_director' | 'internship_coordinator' | 'thesis_advisor' | 'faculty_supervisor';

export interface SupervisorProfile {
  id: string;
  userId: string;
  employeeCode: string | null;
  department: string | null;
  role: SupervisorRole;
  specialization: string | null;
  maxStudents: number;
  currentStudents: number;
  isActive: boolean;
  isOnboardingComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSupervisorProfile {
  employeeCode?: string;
  department?: string;
  role?: SupervisorRole;
  specialization?: string;
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

  getMyStudentsEnriched(params?: { status?: string; page?: number; limit?: number }): Observable<EnrichedStudentsResponse> {
    let httpParams = new HttpParams();
    httpParams = httpParams.set('enriched', 'true');
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
    return this.http.get<EnrichedStudentsResponse>(`${this.apiUrl}/supervisors/my-students`, { params: httpParams });
  }

  getAssignmentDetail(assignmentId: string): Observable<AssignmentDetail> {
    return this.http.get<AssignmentDetail>(`${this.apiUrl}/supervisors/assignments/${assignmentId}`);
  }

  acceptAssignment(assignmentId: string): Observable<SupervisorAssignmentItem> {
    return this.http.patch<SupervisorAssignmentItem>(`${this.apiUrl}/supervisors/assignments/${assignmentId}/accept`, {});
  }

  declineAssignment(assignmentId: string, reason: string): Observable<SupervisorAssignmentItem> {
    return this.http.patch<SupervisorAssignmentItem>(
      `${this.apiUrl}/supervisors/assignments/${assignmentId}/decline`,
      { reason },
    );
  }

  getDeliverables(applicationId: string): Observable<Deliverable[]> {
    return this.http.get<Deliverable[]>(`${environment.apiUrl}/applications/${applicationId}/deliverables`);
  }

  reviewDeliverable(
    applicationId: string,
    deliverableId: string,
    status: 'approved' | 'rejected' | 'needs_revision',
    data: { grade?: number; feedback?: string }
  ): Observable<ApiResponse<Deliverable>> {
    const action = status === 'approved' ? 'approve' : status === 'rejected' ? 'reject' : 'request-revision';
    return this.http.patch<ApiResponse<Deliverable>>(
      `${environment.apiUrl}/applications/${applicationId}/deliverables/${deliverableId}/${action}`,
      data
    );
  }

  getEvaluationsByApplication(applicationId: string): Observable<EvaluationItem[]> {
    return this.http.get<EvaluationItem[]>(`${environment.apiUrl}/evaluations/application/${applicationId}`);
  }

  getUserProfile(userId: string): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${environment.apiUrl}/users/profile/${userId}`);
  }

  getStudentProfile(userId: string): Observable<StudentProfile> {
    return this.http.get<StudentProfile>(`${environment.apiUrl}/students/profile/${userId}`);
  }

  getMyProfile(): Observable<SupervisorProfile> {
    return this.http.get<SupervisorProfile>(`${this.apiUrl}/supervisors/me`);
  }

  updateMyProfile(data: UpdateSupervisorProfile): Observable<SupervisorProfile> {
    return this.http.patch<SupervisorProfile>(`${this.apiUrl}/supervisors/me`, data);
  }
}