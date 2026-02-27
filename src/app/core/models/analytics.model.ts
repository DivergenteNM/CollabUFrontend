export interface DashboardMetrics {
  totalStudents: number;
  totalCompanies: number;
  verifiedCompanies: number;
  activeProjects: number;
  totalApplications: number;
  acceptanceRate: number;
  averageMatchScore: number;
  averageRating: number;
  periodComparison: {
    current: PeriodMetrics;
    previous: PeriodMetrics;
  };
}

export interface PeriodMetrics {
  period: string;
  students: number;
  projects: number;
  applications: number;
  placements: number;
}

export interface TimelineEvent {
  date: string;
  count: number;
  type: string;
}
