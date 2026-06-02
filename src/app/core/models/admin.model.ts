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

export interface AcademicPeriod {
  id: string;
  periodCode: string;
  name: string;
  startDate: string;
  endDate: string;
  applicationDeadline: string;
  isActive: boolean;
}
