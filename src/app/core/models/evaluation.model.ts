/**
 * Modelo alineado con `Backend/services/evaluation-service/src/evaluation/entities/*`.
 * El backend expone la evaluación como un contenedor con `ratings[]` (uno por
 * criterio) y agregados: `overallScore`, `overallComment`, `strengths`,
 * `areasForImprovement`. No hay concepto de "response" independiente — el
 * evaluador completa la evaluación una sola vez mediante `POST /:id/submit`.
 */

export type EvaluationType =
  | 'company_evaluates_student'
  | 'student_evaluates_company'
  | 'supervisor_evaluates_student'
  | 'student_evaluates_supervisor'
  | 'self_evaluation';

export type EvaluationStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'expired';

export type CriterionCategory =
  | 'technical'
  | 'soft_skills'
  | 'professional'
  | 'academic'
  | 'general';

export type RatingScale = '1_to_5' | '1_to_10' | 'percentage';

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
}

export interface EvaluationRating {
  id?: string;
  criterionId: string;
  score: number;
  comment?: string | null;
  criterion?: EvaluationCriteria;
}

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
  templateId: string | null;
  createdAt: string;
  updatedAt: string;
  ratings: EvaluationRating[];

  /** Campos derivados que enriquece el backend (título/nombre de contraparte). */
  projectTitle?: string;
  evaluatorName?: string;
  evaluatedName?: string;
}

/** Alias legacy que otros componentes aún importan. */
export type EvaluationCriteriaScore = EvaluationRating;
export interface EvaluationResponse {
  id: string;
  content: string;
  respondedAt: string;
}
