// ─── Enums ────────────────────────────────────────────────────────────────────

export type ReportType =
  | 'period_summary'
  | 'company_performance'
  | 'student_outcomes'
  | 'skill_gap_analysis'
  | 'matching_effectiveness'
  | 'custom';

export type ReportStatus = 'generating' | 'completed' | 'failed';

export type TrendDirection = 'rising' | 'stable' | 'declining';

// ─── Query params ─────────────────────────────────────────────────────────────

export interface MetricsQuery {
  from?: string;
  to?: string;
  periodId?: string;
  groupBy?: 'day' | 'week' | 'month';
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface AnalyticsDashboard {
  platformMetrics: {
    totalUsers: number;
    totalStudents: number;
    totalCompanies: number;
    totalProjects: number;
    activeProjects: number;
    totalApplications: number;
    avgMatchScore: number | null;
  };
  trends: {
    newUsersThisMonth: number;
    newProjectsThisMonth: number;
    applicationsThisMonth: number;
    lastSnapshotDate: string | null;
  };
  topSkills: TopSkillEntry[];
  recentReports: RecentReportEntry[];
}

export interface TopSkillEntry {
  name: string;
  demand: number;
  supply: number;
  gap: number | null;
  trend: TrendDirection | null;
}

export interface RecentReportEntry {
  id: string;
  name: string;
  type: ReportType;
  status: ReportStatus;
  createdAt: string;
}

// ─── Métricas ─────────────────────────────────────────────────────────────────

export interface PlatformMetrics {
  id: string;
  totalUsers: number;
  totalStudents: number;
  totalCompanies: number;
  totalProjects: number;
  totalApplications: number;
  activeProjects: number;
  avgMatchScore: number | null;
  avgTimeToFillDays: number | null;
  newUsersPeriod: number;
  newProjectsPeriod: number;
  snapshotDate: string;
  periodId: string | null;
  createdAt: string;
}

export interface ProjectMetrics {
  id: string;
  projectId: string;
  periodId: string | null;
  totalApplications: number;
  acceptedApplications: number;
  rejectedApplications: number;
  avgMatchScore: number | null;
  avgTimeToFillDays: number | null;
  completionRate: number | null;
  avgEvaluationScore: number | null;
  totalViews: number;
  conversionRate: number | null;
  snapshotDate: string;
  createdAt: string;
}

export interface StudentMetrics {
  id: string;
  studentId: string;
  totalApplications: number;
  acceptedCount: number;
  rejectedCount: number;
  avgMatchScore: number | null;
  profileCompleteness: number;
  avgEvaluationScore: number | null;
  totalProjectsCompleted: number;
  skillsCount: number;
  responseRate: number | null;
  snapshotDate: string;
  createdAt: string;
}

export interface CompanyMetrics {
  id: string;
  companyId: string;
  totalProjects: number;
  activeProjects: number;
  totalApplicationsReceived: number;
  avgTimeToRespondHours: number | null;
  avgEvaluationGiven: number | null;
  avgEvaluationReceived: number | null;
  totalStudentsHired: number;
  completionRate: number | null;
  snapshotDate: string;
  createdAt: string;
}

export interface SkillTrend {
  id: string;
  skillName: string;
  demandCount: number;
  supplyCount: number;
  gapIndex: number | null;
  avgProficiencyLevel: number | null;
  trendDirection: TrendDirection | null;
  snapshotDate: string;
  createdAt: string;
}

// ─── Reportes ─────────────────────────────────────────────────────────────────

export interface Report {
  id: string;
  name: string;
  reportType: ReportType;
  generatedBy: string;
  periodId: string | null;
  parameters: Record<string, unknown> | null;
  data: Record<string, unknown>;
  fileUrl: string | null;
  status: ReportStatus;
  createdAt: string;
}

export interface GenerateReportPayload {
  name: string;
  reportType: ReportType;
  periodId?: string;
  parameters?: Record<string, unknown>;
}
