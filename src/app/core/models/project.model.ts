import { ProjectType, ProjectStatus, CompensationType } from '../enums';

export interface Project {
  id: string;
  companyId: string;
  companyName: string;
  companyLogoUrl?: string;
  title: string;
  description: string;
  shortDescription?: string | null;
  projectType: ProjectType;
  status: ProjectStatus;
  durationMonths?: number | null;
  positionsAvailable: number;
  positionsFilled: number;
  applicationsCount: number;
  startDate: string;
  endDate: string;
  applicationDeadline: string;
  academicPrograms?: string[];
  minimumSemester?: number;
  weeklyHours?: number;
  totalHours?: number;
  isRemote: boolean;
  locationType?: 'remote' | 'onsite' | 'hybrid';
  location?: string;
  supervisorName?: string;
  compensationType?: CompensationType;
  compensationAmount?: number | null;
  currency?: string;
  requirements: ProjectRequirement[];
  skills: ProjectSkill[];
  requestDocumentFileId?: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  facultyReviewNotes?: string | null;
  facultyRejectionCategories?: string[] | null;
  facultyReviewerId?: string | null;
  facultyReviewedAt?: string | null;
  submittedForReviewAt?: string | null;
}

export interface ProjectRequirement {
  id: string;
  name: string;
  type: 'education' | 'experience' | 'language' | 'certification' | 'other';
  description?: string;
  isMandatory: boolean;
  proficiencyLevel?: 'basic' | 'intermediate' | 'advanced' | 'expert';
  minimumYears?: number;
}

export interface ProjectSkill {
  id?: string;
  name: string;
  catalogSkillId?: string | null;
  category: 'language' | 'framework' | 'tool' | 'concept' | 'soft_skill';
  proficiencyLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null;
  isMandatory: boolean;
  displayOrder?: number;
}

export interface ProjectFilters {
  search?: string;
  projectType?: ProjectType;
  status?: ProjectStatus;
  skills?: string[];
  companyId?: string;
  isRemote?: boolean;
  minPositions?: number;
  sortBy?: 'createdAt' | 'applicationDeadline' | 'matchScore' | 'applicationsCount';
  sortOrder?: 'ASC' | 'DESC';
}
