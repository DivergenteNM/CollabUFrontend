import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { ApiResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class StorageService extends BaseApiService {
  protected readonly basePath = '/storage';

  upload(file: File, category: string, isPublic = false): Observable<ApiResponse<{ fileId: string; url: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    if (isPublic) {
      formData.append('isPublic', 'true');
    }
    return this.http.post<ApiResponse<{ fileId: string; url: string }>>(`${this.apiUrl}/upload`, formData);
  }

  getQuota(): Observable<ApiResponse<{ usedBytes: number; totalBytes: number; percentage: number }>> {
    return this.http.get<ApiResponse<{ usedBytes: number; totalBytes: number; percentage: number }>>(`${this.apiUrl}/quota`);
  }

  deleteFile(fileId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${fileId}`);
  }
}
