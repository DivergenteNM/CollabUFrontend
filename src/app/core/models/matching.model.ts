import { Project } from './project.model';
import { MatchBreakdown } from './application.model';

export interface MatchResult {
  id: string;
  projectId: string;
  studentId: string;
  overallScore: number;
  skillScore: number;
  experienceScore: number;
  educationScore: number;
  availabilityScore: number;
  ratingScore: number;
  isRecommended: boolean;
  calculatedAt: string;
}

export interface MatchDetail extends MatchResult {
  project: Project;
  matchBreakdown: MatchBreakdown;
  matchingSkills: string[];
  missingSkills: string[];
}

export interface Recommendation {
  id: string;
  project: Project;
  matchScore: number;
  matchBreakdown: MatchBreakdown;
  reason: string;
}
