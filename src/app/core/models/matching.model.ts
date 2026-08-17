/**
 * Contrato exacto de matching-service (ver Backend/services/matching-service/src/matching/entities).
 * No envuelto en {data: ...} — matching-service no tiene TransformInterceptor global.
 */

export interface SkillsBreakdownEntry {
  name: string;
  catalogSkillId: string | null;
  requiredLevel: string | null;
  studentLevel: string | null;
}

export interface SkillsBreakdownExtra {
  name: string;
  catalogSkillId: string | null;
  studentLevel: string | null;
}

export interface SkillsBreakdown {
  matched: SkillsBreakdownEntry[];
  missing: SkillsBreakdownEntry[];
  extra: SkillsBreakdownExtra[];
}

export type CompatibilityLevel = 'high' | 'medium' | 'low';

export interface MatchResult {
  id: string;
  studentId: string;
  projectId: string;
  overallScore: number;
  skillsScore: number | null;
  proficiencyScore: number | null;
  programScore: number | null;
  semesterScore: number | null;
  availabilityScore: number | null;
  languageScore: number | null;
  skillsBreakdown: SkillsBreakdown | null;
  weightsSnapshot: Record<string, number>;
  compatibilityLevel: CompatibilityLevel | null;
  isRecommended: boolean;
  calculatedAt: string;
  expiresAt: string | null;
}

/** Subconjunto de MatchResult usado por app-match-score-card para pintar el desglose por factor. */
export type MatResultBreakdown = Pick<
  MatchResult,
  'skillsScore' | 'proficiencyScore' | 'programScore' | 'semesterScore' | 'availabilityScore' | 'languageScore'
>;

export interface Recommendation {
  id: string;
  matchResultId: string;
  targetUserId: string;
  targetType: 'student' | 'company';
  recommendationType: string;
  message: string | null;
  isSeen: boolean;
  isDismissed: boolean;
  createdAt: string;
  matchResult: MatchResult;
  /** Enriquecido por matching-service al listar recomendaciones (fetch a project-service). */
  projectTitle?: string | null;
}

/**
 * matching-service no tiene TransformInterceptor global: GET /matching/recommendations
 * devuelve {data,total,page,limit} plano, no el envoltorio {statusCode,message,data,meta} de
 * PaginatedResponse<T> (ese patrón es de servicios que sí usan ApiResponseDto/interceptor).
 */
export interface RecommendationsPage {
  data: Recommendation[];
  total: number;
  page: number;
  limit: number;
}
