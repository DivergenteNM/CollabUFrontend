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
  appliedAt: string;
  reviewedAt?: string;
  acceptedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  supervisorId?: string;
  notes?: string | null;
  student?: StudentProfile;
  project?: Project;
  projectTitle?: string | null;
  companyName?: string | null;
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
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled' | 'no_show';
  interviewerNotes?: string | null;
  score?: number | null;
  companyResolution?: 'passed' | 'failed' | null;
  resolutionComment?: string | null;
  companyBriefFileId?: string | null;
  technicalTaskDescription?: string | null;
  technicalTaskDueDate?: string | null;
  studentSolutionFileId?: string | null;
  studentFeedback?: string | null;
  feedback?: string;
  rating?: number;
}

export interface Deliverable {
  id: string;
  applicationId: string;
  title: string;
  description: string;
  dueDate?: string;
  submittedAt?: string;
  fileUrl?: string;
  status: 'pending' | 'submitted' | 'approved' | 'rejected' | 'needs_revision';
  grade?: number;
  feedback?: string;
  createdByUserId?: string;
  assignedAt?: string;
  isOverdue?: boolean;
  attachments?: any[];
  reviewedBy?: string | null;
  reviewedByRole?: string | null;
  reviewedAt?: string | null;
  reviewerName?: string | null;
  reviewerRole?: string | null;
}
