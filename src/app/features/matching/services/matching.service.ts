import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../core/services/base-api.service';
import {
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  Recommendation,
  MatchResult,
} from '../../../core/models';

@Injectable({ providedIn: 'root' })
export class MatchingService extends BaseApiService {
  protected readonly basePath = '/matching';

  getRecommendations(params: PaginationParams): Observable<PaginatedResponse<Recommendation>> {
    return this.http.get<PaginatedResponse<Recommendation>>(`${this.apiUrl}/recommendations`, {
      params: this.buildParams(params)
    });
  }

  getMatchDetail(projectId: string): Observable<ApiResponse<MatchResult>> {
    return this.http.get<ApiResponse<MatchResult>>(`${this.apiUrl}/projects/${projectId}/my-match`);
  }

  getProjectMatches(projectId: string, params: PaginationParams): Observable<PaginatedResponse<MatchResult>> {
    return this.http.get<PaginatedResponse<MatchResult>>(`${this.apiUrl}/projects/${projectId}`, {
      params: this.buildParams(params)
    });
  }
}
