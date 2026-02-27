export interface Evaluation {
  id: string;
  evaluatorId: string;
  evaluatorType: 'student' | 'company' | 'faculty';
  evaluatedId: string;
  evaluatedType: 'student' | 'company';
  applicationId: string;
  projectTitle: string;
  overallRating: number;
  comment: string;
  isAnonymous: boolean;
  criteria: EvaluationCriteriaScore[];
  response?: EvaluationResponse;
  createdAt: string;
}

export interface EvaluationCriteriaScore {
  criteriaId: string;
  criteriaName: string;
  rating: number;
  comment?: string;
}

export interface EvaluationResponse {
  id: string;
  content: string;
  respondedAt: string;
}
