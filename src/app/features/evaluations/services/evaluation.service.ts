import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../core/services/base-api.service';
import {
  ApiResponse,
  PaginationParams,
  Evaluation,
  EvaluationCriteria,
  EvaluationTemplate,
  SubmitEvaluationDto,
  EvaluationType,
  AggregateScores,
} from '../../../core/models';

@Injectable({ providedIn: 'root' })
export class EvaluationService extends BaseApiService {
  protected readonly basePath = '/evaluations';

  createEvaluation(data: {
    applicationId: string;
    projectId: string;
    evaluatedId: string;
    evaluationType: EvaluationType;
    isAnonymous?: boolean;
    dueDate?: string;
    templateId?: string;
  }): Observable<ApiResponse<Evaluation>> {
    return this.http.post<ApiResponse<Evaluation>>(this.apiUrl, data);
  }

  submitEvaluation(id: string, dto: SubmitEvaluationDto): Observable<ApiResponse<Evaluation>> {
    return this.http.post<ApiResponse<Evaluation>>(`${this.apiUrl}/${id}/submit`, dto);
  }

  getMyEvaluations(type: 'given' | 'received', params: PaginationParams): Observable<{ data: Evaluation[]; meta: { total: number; page: number; limit: number; totalPages: number; hasNext: boolean; hasPrevious: boolean } }> {
    const endpoint = type === 'given' ? 'my/as-evaluator' : 'my/as-evaluated';
    return this.http.get<any>(`${this.apiUrl}/${endpoint}`, {
      params: this.buildParams(params)
    });
  }

  getCriteria(evaluationType?: EvaluationType): Observable<ApiResponse<EvaluationCriteria[]>> {
    return this.http.get<ApiResponse<EvaluationCriteria[]>>(`${this.apiUrl}/criteria`, {
      params: evaluationType ? { evaluationType } : {}
    });
  }

  getTemplates(evaluationType?: EvaluationType): Observable<ApiResponse<EvaluationTemplate[]>> {
    return this.http.get<ApiResponse<EvaluationTemplate[]>>(`${this.apiUrl}/templates`, {
      params: evaluationType ? { evaluationType } : {}
    });
  }

  getAggregateScores(userId: string): Observable<ApiResponse<AggregateScores>> {
    return this.http.get<ApiResponse<AggregateScores>>(`${this.apiUrl}/aggregate/${userId}`);
  }
}