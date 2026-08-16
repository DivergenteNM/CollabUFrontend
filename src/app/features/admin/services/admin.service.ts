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
  AcademicProgram,
  SkillCatalogEntry,
  SkillCategory,
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

export interface RejectionCategory {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  displayOrder: number;
}

export interface AcademicTemplate {
  id: string;
  programCode: string;
  type: string;
  name: string;
  fileId: string;
  isActive: boolean;
  createdAt: string;
}

export interface DocumentRequirement {
  id: string;
  name: string;
  description: string | null;
  actorType: 'student' | 'company';
  requiredAtStage: 'pre_initiation' | 'post_initiation' | 'finalization';
  projectTypes: string[];
  isMandatory: boolean;
  allowedMimeTypes: string[] | null;
  maxSizeBytes: number | null;
  hasExpiry: boolean;
  isActive: boolean;
  displayOrder: number;
  templateFileId?: string | null;
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

export interface AcademicQueueRow {
  id: string | null;
  applicationId: string;
  status: string;
  officialStartDate: string | null;
  expectedEndDate: string | null;
  agreedDurationWeeks: number | null;
  asesorCompletionSignal: boolean;
  createdAt: string;
  updatedAt: string;
  projectId: string | null;
  studentId: string | null;
  applicationStatus: string | null;
  projectTitle: string | null;
  studentName?: string;
  isPreAssignment?: boolean;
}

export interface AcademicQueueResponse {
  data: AcademicQueueRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  statusCounts: Record<string, number>;
}

@Injectable({ providedIn: 'root' })
export class AdminService extends BaseApiService {
  protected readonly basePath = '/admin';

  getUsers(params: PaginationParams & { search?: string; role?: string; isActive?: string }): Observable<PaginatedResponse<AdminUserRow>> {
    return this.http.get<PaginatedResponse<AdminUserRow>>(`${environment.apiUrl}/auth/admin/users`, {
      params: this.buildParams(params)
    });
  }

  // La verificación de empresas se gestiona contra Company Service
  // (`/companies/admin/list` y `PATCH /companies/admin/:id/review`), desde
  // `company-verifications.component`. Las rutas `/admin/verifications` nunca
  // existieron en el backend.

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

  getPrograms(isActive = true): Observable<AcademicProgram[]> {
    return this.http.get<AcademicProgram[]>(`${this.apiUrl}/programs`, {
      params: { isActive: String(isActive) },
    });
  }

  getSkillCatalog(filters?: { programId?: string; category?: SkillCategory; search?: string; includeInactive?: boolean }): Observable<SkillCatalogEntry[]> {
    return this.http.get<SkillCatalogEntry[]>(`${this.apiUrl}/skills`, {
      params: this.buildParams(filters ?? {}),
    });
  }

  createSkill(data: { displayName: string; category: SkillCategory; programIds?: string[] }): Observable<SkillCatalogEntry> {
    return this.http.post<SkillCatalogEntry>(`${this.apiUrl}/skills`, data);
  }

  updateSkill(id: string, data: Partial<{ displayName: string; category: SkillCategory; isActive: boolean }>): Observable<SkillCatalogEntry> {
    return this.http.patch<SkillCatalogEntry>(`${this.apiUrl}/skills/${id}`, data);
  }

  deactivateSkill(id: string): Observable<SkillCatalogEntry> {
    return this.http.patch<SkillCatalogEntry>(`${this.apiUrl}/skills/${id}/deactivate`, {});
  }

  associateSkillPrograms(skillId: string, programIds: string[]): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/skills/${skillId}/programs`, { programIds });
  }

  assignSupervisor(data: {
    supervisorId: string;
    juradoIds?: string[];
    studentId: string;
    projectId: string;
    applicationId: string;
    periodId: string;
    startDate: string;
    endDate?: string;
    notes?: string;
  }): Observable<SupervisorAssignment[]> {
    return this.http.post<SupervisorAssignment[]>(`${this.apiUrl}/supervisors/assign`, data);
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

  // ── Cola de trabajo académico ──

  getAcademicQueue(params: { status?: string; page?: number; limit?: number }): Observable<AcademicQueueResponse> {
    return this.http.get<AcademicQueueResponse>(`${environment.apiUrl}/applications/admin/academic-queue`, {
      params: this.buildParams(params),
    });
  }

  // ── Categorías de rechazo de proyectos ──

  getRejectionCategories(onlyActive = false): Observable<RejectionCategory[]> {
    return this.http.get<RejectionCategory[]>(`${this.apiUrl}/rejection-categories`, {
      params: { onlyActive: String(onlyActive) },
    });
  }

  createRejectionCategory(data: { name: string; description?: string; displayOrder?: number }): Observable<RejectionCategory> {
    return this.http.post<RejectionCategory>(`${this.apiUrl}/rejection-categories`, data);
  }

  updateRejectionCategory(id: string, data: Partial<RejectionCategory>): Observable<RejectionCategory> {
    return this.http.patch<RejectionCategory>(`${this.apiUrl}/rejection-categories/${id}`, data);
  }

  // ── Plantillas académicas ──

  getTemplates(params?: { programCode?: string; type?: string }): Observable<AcademicTemplate[]> {
    return this.http.get<AcademicTemplate[]>(`${this.apiUrl}/templates`, { params: this.buildParams(params ?? {}) });
  }

  createTemplate(data: { programCode: string; type: string; name: string; fileId: string }): Observable<AcademicTemplate> {
    return this.http.post<AcademicTemplate>(`${this.apiUrl}/templates`, data);
  }

  updateTemplate(id: string, data: Partial<Pick<AcademicTemplate, 'name' | 'fileId' | 'isActive'>>): Observable<AcademicTemplate> {
    return this.http.patch<AcademicTemplate>(`${this.apiUrl}/templates/${id}`, data);
  }

  // ── Documentos requeridos ──

  getDocumentRequirements(params?: { actorType?: string; requiredAtStage?: string; onlyActive?: boolean }): Observable<DocumentRequirement[]> {
    return this.http.get<DocumentRequirement[]>(`${this.apiUrl}/document-requirements`, {
      params: this.buildParams({ ...params, onlyActive: params?.onlyActive !== undefined ? String(params.onlyActive) : undefined }),
    });
  }

  createDocumentRequirement(data: Partial<DocumentRequirement>): Observable<DocumentRequirement> {
    return this.http.post<DocumentRequirement>(`${this.apiUrl}/document-requirements`, data);
  }

  updateDocumentRequirement(id: string, data: Partial<DocumentRequirement>): Observable<DocumentRequirement> {
    return this.http.patch<DocumentRequirement>(`${this.apiUrl}/document-requirements/${id}`, data);
  }
}
