export interface StudentProfile {
  id: string;
  userId: string;
  studentCode: string;
  program: string;
  faculty: string;
  semester: number;
  gpa?: number;
  enrollmentDate: string;
  expectedGraduationDate?: string;
  bio?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  isAvailableForPractice: boolean;
  practiceHoursCompleted: number;
  practiceHoursRequired: number;
  skills: StudentSkill[];
  academicInfo: AcademicInfo[];
  workExperience: WorkExperience[];
  documents: StudentDocument[];
  profileCompleteness: number;
  averageRating?: number;
  createdAt: string;
  updatedAt: string;
}

export interface StudentSkill {
  id: string;
  name: string;
  category: string;
  proficiencyLevel: 'basic' | 'intermediate' | 'advanced' | 'expert';
  yearsOfExperience?: number;
  isVerified: boolean;
}

export interface AcademicInfo {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  gpa?: number;
}

export interface WorkExperience {
  id: string;
  companyName: string;
  position: string;
  description: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  skills: string[];
}

export interface StudentDocument {
  id: string;
  fileId: string;
  documentType: 'resume' | 'transcript' | 'certificate' | 'id_document' | 'other';
  originalName: string;
  fileUrl: string;
  uploadedAt: string;
}
