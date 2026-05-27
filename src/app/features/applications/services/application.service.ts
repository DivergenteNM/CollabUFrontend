import { inject, Injectable } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { BaseApiService } from '../../../core/services/base-api.service';
import { ApplicationStatus } from '../../../core/enums';
import { StudentService } from '../../students/services/student.service';
import { UserProfileService } from '../../../core/services/user-profile.service';
import { ProjectService } from '../../projects/services/project.service';
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
  private readonly studentService = inject(StudentService);
  private readonly userService = inject(UserProfileService);
  private readonly projectService = inject(ProjectService);

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

  getById(id: string): Observable<Application> {
    return this.http.get<Application>(`${this.apiUrl}/${id}`);
  }

  enrichApplication(app: Application): Observable<Application> {
    return forkJoin({
      studentData: this.studentService.getProfileById(app.studentId).pipe(catchError(() => of(null))),
      userData: this.userService.getProfileById(app.studentId).pipe(catchError(() => of(null))),
      projectData: this.projectService.getById(app.projectId).pipe(catchError(() => of(null)))
    }).pipe(
      map(({ studentData, userData, projectData }) => {
        const enriched = { ...app };
        if (studentData?.data) {
          enriched.student = studentData.data;
          if (userData?.data) {
            // @ts-ignore
            enriched.student.user = userData.data;
          }
        }
        const proj = (projectData as any)?.data || projectData;
        if (proj) {
          enriched.project = proj;
        }
        return enriched;
      })
    );
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
