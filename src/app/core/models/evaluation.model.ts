import {
  EvaluationType,
  EvaluationStatus,
  CriterionCategory,
  RatingScale,
} from '../enums';

export { EvaluationType, EvaluationStatus, CriterionCategory, RatingScale };

export interface Evaluation {
  id: string;
  applicationId: string;
  projectId: string;
  evaluatorId: string;
  evaluatedId: string;
  evaluationType: EvaluationType;
  status: EvaluationStatus;
  overallScore: number | null;
  overallComment: string | null;
  strengths: string | null;
  areasForImprovement: string | null;
  isAnonymous: boolean;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  ratings?: EvaluationRating[];
}

export interface EvaluationRating {
  id: string;
  evaluationId: string;
  criterionId: string;
  score: number;
  comment: string | null;
  createdAt: string;
  criterion?: EvaluationCriteria;
}

export interface EvaluationCriteria {
  id: string;
  name: string;
  description: string | null;
  category: CriterionCategory;
  evaluationType: EvaluationType;
  weight: number;
  ratingScale: RatingScale;
  isRequired: boolean;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface EvaluationTemplate {
  id: string;
  name: string;
  description: string | null;
  evaluationType: EvaluationType;
  criteriaIds: string[];
  isDefault: boolean;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEvaluationDto {
  applicationId: string;
  projectId: string;
  evaluatedId: string;
  evaluationType: EvaluationType;
  isAnonymous?: boolean;
  dueDate?: string;
  templateId?: string;
}

export interface SubmitEvaluationDto {
  ratings: EvaluationRatingDto[];
  overallComment?: string;
  strengths?: string;
  areasForImprovement?: string;
}

export interface EvaluationRatingDto {
  criterionId: string;
  score: number;
  comment?: string;
}

export interface EvaluationQueryParams {
  evaluationType?: EvaluationType;
  status?: EvaluationStatus;
  projectId?: string;
  page?: number;
  limit?: number;
}

export interface AggregateScores {
  averageScore: number | null;
  completedCount: number;
  byType: Record<string, number | null>;
}

export function getEvaluationStatusLabel(status: EvaluationStatus): string {
  const labels: Record<EvaluationStatus, string> = {
    [EvaluationStatus.PENDING]: 'Pendiente',
    [EvaluationStatus.IN_PROGRESS]: 'En progreso',
    [EvaluationStatus.COMPLETED]: 'Completada',
    [EvaluationStatus.EXPIRED]: 'Expirada',
  };
  return labels[status] ?? status;
}

export function getEvaluationTypeLabel(type: EvaluationType): string {
  const labels: Record<EvaluationType, string> = {
    [EvaluationType.COMPANY_EVALUATES_STUDENT]: 'Empresa evalúa estudiante',
    [EvaluationType.STUDENT_EVALUATES_COMPANY]: 'Estudiante evalúa empresa',
    [EvaluationType.SUPERVISOR_EVALUATES_STUDENT]: 'Supervisor evalúa estudiante',
    [EvaluationType.SELF_EVALUATION]: 'Auto-evaluación',
  };
  return labels[type] ?? type;
}