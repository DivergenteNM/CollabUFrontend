import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../core/services/base-api.service';
import {
  ApiResponse,
  PaginationParams,
  Evaluation,
  EvaluationCriteria,
  EvaluationRating,
} from '../../../core/models';

/**
 * Respuesta paginada tal como la devuelve `evaluation.service.ts` backend:
 * `{ data, total, page, limit }` — sin wrap `meta`.
 */
export interface EvalPaginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface PublicReviewsStats {
  averageRating: number | null;
  totalReviews: number;
  distribution: Record<number, number>;
}

export interface PublicEvaluationsResponse {
  evaluations: Evaluation[];
  stats: PublicReviewsStats;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateEvaluationPayload {
  applicationId: string;
  projectId: string;
  evaluatedId: string;
  evaluationType: string;
  isAnonymous?: boolean;
  dueDate?: string;
  templateId?: string;
}

export interface SubmitEvaluationPayload {
  ratings: Array<{ criterionId: string; score: number; comment?: string }>;
  overallScore?: number;
  overallComment?: string;
  strengths?: string;
  areasForImprovement?: string;
}

@Injectable({ providedIn: 'root' })
export class EvaluationService extends BaseApiService {
  protected readonly basePath = '/evaluations';

  /** Crea una evaluación en estado PENDING. Usado por admin/facultad al abrir el ciclo de cierre. */
  create(payload: CreateEvaluationPayload): Observable<Evaluation> {
    return this.http.post<Evaluation>(this.apiUrl, payload);
  }

  /** Evaluaciones donde soy evaluador (para completarlas o ver histórico). */
  getAsEvaluator(params: PaginationParams & { status?: string } = {} as any): Observable<EvalPaginated<Evaluation>> {
    return this.http.get<EvalPaginated<Evaluation>>(
      `${this.apiUrl}/my/as-evaluator`,
      { params: this.buildParams(params) },
    );
  }

  /** Evaluaciones que otros hicieron sobre mí (solo COMPLETED se muestran). */
  getAsEvaluated(params: PaginationParams & { status?: string } = {} as any): Observable<EvalPaginated<Evaluation>> {
    return this.http.get<EvalPaginated<Evaluation>>(
      `${this.apiUrl}/my/as-evaluated`,
      { params: this.buildParams(params) },
    );
  }

  /**
   * Devuelve TODAS las evaluaciones de una postulación — tanto dadas como
   * recibidas. Se usa en el workspace para el tab "Evaluaciones".
   */
  getByApplication(applicationId: string): Observable<Evaluation[]> {
    return this.http.get<Evaluation[]>(
      `${this.apiUrl}/application/${applicationId}`,
    );
  }

  getById(id: string): Observable<Evaluation> {
    return this.http.get<Evaluation>(`${this.apiUrl}/${id}`);
  }

  /** Envía las calificaciones y marca la evaluación como COMPLETED. */
  submit(id: string, payload: SubmitEvaluationPayload): Observable<Evaluation> {
    return this.http.post<Evaluation>(`${this.apiUrl}/${id}/submit`, payload);
  }

  /** Catálogo de criterios activos para un tipo dado. */
  getCriteria(evaluationType?: string): Observable<EvaluationCriteria[]> {
    const params: Record<string, string> = {};
    if (evaluationType) params['evaluationType'] = evaluationType;
    return this.http.get<EvaluationCriteria[]>(
      `${this.apiUrl}/criteria`,
      { params },
    );
  }

  /** Promedios agregados de un usuario evaluado (reputación pública). */
  getAggregate(userId: string): Observable<{
    averageScore: number | null;
    completedCount: number;
    byType: Record<string, number | null>;
  }> {
    return this.http.get<any>(`${this.apiUrl}/aggregate/${userId}`);
  }

  /** Evaluaciones y reseñas públicas de una empresa (visibles para estudiantes y público). */
  getCompanyPublicEvaluations(
    companyId: string,
    params: PaginationParams = {} as any,
  ): Observable<PublicEvaluationsResponse> {
    return this.http.get<PublicEvaluationsResponse>(
      `${this.apiUrl}/company/${companyId}`,
      { params: this.buildParams(params) },
    );
  }

  /** Evaluaciones y reseñas públicas recibidas por un estudiante (visibles en su perfil público). */
  getStudentPublicEvaluations(
    studentId: string,
    params: PaginationParams = {} as any,
  ): Observable<PublicEvaluationsResponse> {
    return this.http.get<PublicEvaluationsResponse>(
      `${this.apiUrl}/student/${studentId}`,
      { params: this.buildParams(params) },
    );
  }

  // ── Aliases legacy: mantienen callers antiguos funcionando durante la migración ──
  getMyEvaluations(type: 'given' | 'received', params: PaginationParams): Observable<EvalPaginated<Evaluation>> {
    return type === 'given' ? this.getAsEvaluator(params) : this.getAsEvaluated(params);
  }
  respondToEvaluation(): Observable<never> {
    throw new Error('Deprecated: usar submit() con ratings');
  }
}
