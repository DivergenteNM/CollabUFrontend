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
  eventType: string;
  description: string;
  performedBy: string;
  createdAt: string;
}

export interface Interview {
  id: string;
  scheduledAt: string;
  durationMinutes: number;
  location?: string;
  meetingUrl?: string;
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
  status: 'pending' | 'submitted' | 'approved' | 'rejected' | 'revision_requested';
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
