import { ProjectType, ProjectStatus } from '../enums';

export interface Project {
  id: string;
  companyId: string;
  companyName: string;
  companyLogoUrl?: string;
  title: string;
  description: string;
  projectType: ProjectType;
  status: ProjectStatus;
  positionsAvailable: number;
  positionsFilled: number;
  applicationsCount: number;
  startDate: string;
  endDate: string;
  applicationDeadline: string;
  academicPrograms?: string[];
  minimumSemester?: number;
  weeklyHours: number;
  totalHoursRequired: number;
  isRemote: boolean;
  location?: string;
  supervisorName?: string;
  requirements: ProjectRequirement[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface ProjectRequirement {
  id: string;
  name: string;
  type: 'skill' | 'education' | 'experience' | 'language' | 'other';
  description?: string;
  isMandatory: boolean;
  proficiencyLevel?: 'basic' | 'intermediate' | 'advanced' | 'expert';
  minimumYears?: number;
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
