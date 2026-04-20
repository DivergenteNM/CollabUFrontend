export interface StudentProfile {
  id: string;
  userId: string;
  program: string;
  faculty?: string;
  semester: number;
  studentCode?: string;
  enrollmentYear?: number;
  expectedGraduationYear?: number;
  gpa?: number;
  totalCreditsCompleted?: number;
  totalCreditsRequired?: number;
  bio?: string;
  headline?: string;
  cvUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  personalWebsiteUrl?: string;
  availability?: 'full_time' | 'part_time' | 'flexible' | 'unavailable';
  preferredWorkMode?: string;
  availableHoursPerWeek?: number;
  willingToRelocate?: boolean;
  isVisible?: boolean;
  practiceHoursCompleted?: number;
  practiceHoursRequired?: number;
  skills: StudentSkill[];
  experiences: StudentExperience[];
  education: StudentEducation[];
  certifications: StudentCertification[];
  languages: StudentLanguage[];
  interests: StudentInterest[];
  documents?: StudentDocument[];
  profileCompleteness: number;
  averageRating?: number;
  totalRatings?: number;
  createdAt: string;
  updatedAt: string;

  // Aliases legacy para no romper pantallas antiguas.
  academicInfo?: StudentEducation[];
  workExperience?: StudentExperience[];
  linkedinUrl?: string;
}

export interface StudentSkill {
  id: string;
  name: string;
  category: string;
  proficiencyLevel?: 'basic' | 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsOfExperience?: number;
  isVerified?: boolean;
  displayOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentEducation {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  description?: string;
  startDate: string;
  endDate?: string;
  isCurrent?: boolean;
  gpa?: number;
  achievements?: string[];
  thesisTitle?: string;
  displayOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentExperience {
  id: string;
  type: 'work' | 'internship' | 'volunteer' | 'academic' | 'freelance';
  title: string;
  companyName?: string;
  companyId?: string;
  description?: string;
  responsibilities?: string;
  startDate: string;
  endDate?: string;
  isCurrent?: boolean;
  location?: string;
  workMode?: string;
  achievements?: string[];
  technologiesUsed?: string[];
  displayOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentCertification {
  id: string;
  name: string;
  issuer: string;
  issueDate?: string;
  expirationDate?: string;
  credentialId?: string;
  credentialUrl?: string;
}

export interface StudentLanguage {
  id: string;
  language: string;
  proficiencyLevel: string;
}

export interface StudentInterest {
  id: string;
  interestName: string;
  category?: string;
}

export interface StudentDocument {
  id: string;
  fileId: string;
  documentType: 'resume' | 'transcript' | 'certificate' | 'id_document' | 'other';
  originalName: string;
  fileUrl: string;
  uploadedAt: string;
}
