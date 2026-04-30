import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../core/services/base-api.service';
import { ApplicationStatus } from '../../../core/enums';
import {
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  Application,
  Interview,
  Deliverable,
} from '../../../core/models';

@Injectable({ providedIn: 'root' })
export class ApplicationService extends BaseApiService {
  protected readonly basePath = '/applications';

  create(data: { projectId: string; coverLetter: string }): Observable<ApiResponse<Application>> {
    return this.http.post<ApiResponse<Application>>(this.apiUrl, data);
  }

  getMyApplications(params: PaginationParams): Observable<PaginatedResponse<Application>> {
    return this.http.get<PaginatedResponse<Application>>(`${this.apiUrl}/my`, {
      params: this.buildParams(params)
    });
  }

  getReceivedApplications(params: PaginationParams & { projectId?: string }): Observable<PaginatedResponse<Application>> {
    return this.http.get<PaginatedResponse<Application>>(`${this.apiUrl}/received`, {
      params: this.buildParams(params)
    });
  }

  getById(id: string): Observable<ApiResponse<Application>> {
    return this.http.get<ApiResponse<Application>>(`${this.apiUrl}/${id}`);
  }

  changeStatus(id: string, status: ApplicationStatus, notes?: string): Observable<ApiResponse<Application>> {
    return this.http.patch<ApiResponse<Application>>(`${this.apiUrl}/${id}/status`, { status, notes });
  }

  withdraw(id: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/withdraw`, {});
  }

  submitDeliverable(applicationId: string, data: FormData): Observable<ApiResponse<Deliverable>> {
    return this.http.post<ApiResponse<Deliverable>>(
      `${this.apiUrl}/${applicationId}/deliverables`, data
    );
  }

  reviewDeliverable(
    applicationId: string,
    deliverableId: string,
    data: { status: string; grade?: number; feedback: string }
  ): Observable<ApiResponse<Deliverable>> {
    return this.http.patch<ApiResponse<Deliverable>>(
      `${this.apiUrl}/${applicationId}/deliverables/${deliverableId}/review`, data
    );
  }

  scheduleInterview(applicationId: string, data: Partial<Interview>): Observable<ApiResponse<Interview>> {
    return this.http.post<ApiResponse<Interview>>(
      `${this.apiUrl}/${applicationId}/interviews`, data
    );
  }
}
