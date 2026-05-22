import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../core/services/base-api.service';
import {
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  Evaluation,
  EvaluationCriteriaScore,
  EvaluationResponse,
} from '../../../core/models';

@Injectable({ providedIn: 'root' })
export class EvaluationService extends BaseApiService {
  protected readonly basePath = '/evaluations';

  create(data: Partial<Evaluation>): Observable<ApiResponse<Evaluation>> {
    return this.http.post<ApiResponse<Evaluation>>(this.apiUrl, data);
  }

  getMyEvaluations(type: 'given' | 'received', params: PaginationParams): Observable<PaginatedResponse<Evaluation>> {
    const endpoint = type === 'given' ? 'my/as-evaluator' : 'my/as-evaluated';
    return this.http.get<PaginatedResponse<Evaluation>>(`${this.apiUrl}/${endpoint}`, {
      params: this.buildParams(params)
    });
  }

  getCriteria(evaluationType: string): Observable<ApiResponse<EvaluationCriteriaScore[]>> {
    return this.http.get<ApiResponse<EvaluationCriteriaScore[]>>(`${this.apiUrl}/criteria`, {
      params: { evaluationType }
    });
  }

  respondToEvaluation(evaluationId: string, content: string): Observable<ApiResponse<EvaluationResponse>> {
    return this.http.post<ApiResponse<EvaluationResponse>>(
      `${this.apiUrl}/${evaluationId}/response`, { content }
    );
  }
}
