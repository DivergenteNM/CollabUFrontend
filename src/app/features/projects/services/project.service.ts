import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../core/services/base-api.service';
import {
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  Project,
  ProjectFilters,
} from '../../../core/models';

@Injectable({ providedIn: 'root' })
export class ProjectService extends BaseApiService {
  protected readonly basePath = '/projects';

  getAll(filters: ProjectFilters & PaginationParams): Observable<PaginatedResponse<Project>> {
    return this.http.get<PaginatedResponse<Project>>(this.apiUrl, {
      params: this.buildParams(filters)
    });
  }

  getById(id: string): Observable<ApiResponse<Project>> {
    return this.http.get<ApiResponse<Project>>(`${this.apiUrl}/${id}`);
  }

  create(data: Partial<Project>): Observable<ApiResponse<Project>> {
    return this.http.post<ApiResponse<Project>>(this.apiUrl, data);
  }

  addRequirement(id: string, data: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/${id}/requirements`, data);
  }

  updateStatus(id: string, status: string): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.apiUrl}/${id}/status`, { status });
  }

  update(id: string, data: Partial<Project>): Observable<ApiResponse<Project>> {
    return this.http.patch<ApiResponse<Project>>(`${this.apiUrl}/${id}`, data);
  }

  publish(id: string): Observable<ApiResponse<Project>> {
    return this.http.patch<ApiResponse<Project>>(`${this.apiUrl}/${id}/publish`, {});
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  getMyProjects(params: PaginationParams): Observable<PaginatedResponse<Project>> {
    return this.http.get<PaginatedResponse<Project>>(`${this.apiUrl}/my-projects`, {
      params: this.buildParams(params)
    });
  }

  getDeliverables(projectId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${projectId}/deliverables`);
  }

  addDeliverable(projectId: string, data: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/${projectId}/deliverables`, data);
  }

  updateDeliverable(projectId: string, deliverableId: string, data: any): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.apiUrl}/${projectId}/deliverables/${deliverableId}`, data);
  }

  deleteDeliverable(projectId: string, deliverableId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${projectId}/deliverables/${deliverableId}`);
  }
}
