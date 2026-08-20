export interface CompanyVerification {
  id: string;
  companyId: string;
  companyName: string;
  companyLogoUrl?: string;
  nit: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  documents: string[];
}

export interface SupervisorAssignment {
  id: string;
  studentId: string;
  studentName: string;
  facultyId: string;
  facultyName: string;
  applicationId: string;
  projectTitle: string;
  assignedAt: string;
  status: 'active' | 'completed' | 'transferred';
}

export interface AcademicProgram {
  id: string;
  name: string;
  code: string;
  faculty: string;
  department?: string;
  totalSemesters: number;
  requiresInternship: boolean;
  minimumSemesterForInternship: number;
  isActive: boolean;
}

export type SkillCategory = 'language' | 'framework' | 'tool' | 'concept' | 'soft_skill';

export interface SkillCatalogEntry {
  id: string;
  name: string;
  displayName: string;
  category: SkillCategory;
  isActive: boolean;
}

export interface AcademicPeriod {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  enrollmentStart?: string;
  enrollmentEnd?: string;
  status: 'planning' | 'active' | 'closed' | 'archived';
  isCurrent: boolean;
  maxProjectsPerCompany: number;
  maxApplicationsPerStudent: number;
  createdAt?: string;
  updatedAt?: string;
}
