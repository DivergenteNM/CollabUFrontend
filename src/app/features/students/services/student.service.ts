import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../core/services/base-api.service';
import {
  ApiResponse,
  StudentProfile,
  StudentSkill,
  StudentDocument,
} from '../../../core/models';

@Injectable({ providedIn: 'root' })
export class StudentService extends BaseApiService {
  protected readonly basePath = '/students';

  getProfile(): Observable<ApiResponse<StudentProfile>> {
    return this.http.get<ApiResponse<StudentProfile>>(`${this.apiUrl}/profile`);
  }

  updateProfile(data: Partial<StudentProfile>): Observable<ApiResponse<StudentProfile>> {
    return this.http.put<ApiResponse<StudentProfile>>(`${this.apiUrl}/profile`, data);
  }

  getSkills(): Observable<ApiResponse<StudentSkill[]>> {
    return this.http.get<ApiResponse<StudentSkill[]>>(`${this.apiUrl}/skills`);
  }

  addSkill(data: Partial<StudentSkill>): Observable<ApiResponse<StudentSkill>> {
    return this.http.post<ApiResponse<StudentSkill>>(`${this.apiUrl}/skills`, data);
  }

  removeSkill(skillId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/skills/${skillId}`);
  }

  getDocuments(): Observable<ApiResponse<StudentDocument[]>> {
    return this.http.get<ApiResponse<StudentDocument[]>>(`${this.apiUrl}/documents`);
  }

  uploadDocument(file: File, type: string): Observable<ApiResponse<StudentDocument>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', type);
    return this.http.post<ApiResponse<StudentDocument>>(`${this.apiUrl}/documents`, formData);
  }
}
