import { ApplicationStatus } from '../enums';
import { StudentProfile } from './student.model';
import { Project } from './project.model';

export interface Application {
  id: string;
  studentId: string;
  projectId: string;
  companyId: string;
  status: ApplicationStatus;
  coverLetter?: string;
  resumeUrl?: string;
  portfolioUrl?: string;
  matchScore?: number;
  matchBreakdown?: MatchBreakdown;
  appliedAt: string;
  reviewedAt?: string;
  acceptedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  supervisorId?: string;
  student?: StudentProfile;
  project?: Project;
  timeline?: ApplicationTimelineEntry[];
  interviews?: Interview[];
  deliverables?: Deliverable[];
}

export interface ApplicationTimelineEntry {
  id: string;
  applicationId: string;
  fromStatus: string | null;
  toStatus: string;
  changedByUserId: string;
  comment: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;
}

export interface Interview {
  id: string;
  scheduledAt: string;
  durationMinutes: number;
  interviewType: 'phone' | 'video' | 'in_person' | 'technical';
  location?: string;
  meetingLink?: string;
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  feedback?: string;
  rating?: number;
}

export interface Deliverable {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  submittedAt?: string;
  fileUrl?: string;
  status: 'pending' | 'submitted' | 'approved' | 'rejected' | 'needs_revision';
  grade?: number;
  feedback?: string;
}

export interface MatchBreakdown {
  overall: number;
  skill: number;
  experience: number;
  education: number;
  availability: number;
  rating: number;
}
