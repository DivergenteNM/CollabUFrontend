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

  getMatchDetail(projectId: string): Observable<MatchResult | null> {
    // matching-service no envuelve la respuesta en {data: ...} — sin TransformInterceptor global.
    return this.http.get<MatchResult | null>(`${this.apiUrl}/projects/${projectId}/my-match`);
  }

  getProjectMatches(projectId: string, params: PaginationParams): Observable<PaginatedResponse<MatchResult>> {
    return this.http.get<PaginatedResponse<MatchResult>>(`${this.apiUrl}/projects/${projectId}`, {
      params: this.buildParams(params)
    });
  }

  /** matching-service no envuelve la respuesta en {data,meta} — devuelve {data,total} plano. */
  getResultsForStudent(studentId: string, limit = 100): Observable<{ data: MatchResult[]; total: number }> {
    return this.http.get<{ data: MatchResult[]; total: number }>(
      `${this.apiUrl}/results/student/${studentId}`,
      { params: { limit } },
    );
  }

  /** Un estudiante solo puede calcular su propio match (validado también server-side). */
  calculate(studentId: string, projectId: string): Observable<MatchResult> {
    return this.http.post<MatchResult>(`${this.apiUrl}/calculate`, { studentId, projectId });
  }
}
