import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/admin-dashboard/admin-dashboard.component').then(
        (m) => m.AdminAnalyticsComponent
      ),
  },
  {
    path: 'verifications',
    loadComponent: () =>
      import('./pages/company-verifications/company-verifications.component').then(
        (m) => m.CompanyVerificationsComponent
      ),
  },
  {
    path: 'supervisors',
    loadComponent: () =>
      import('./pages/supervisor-assignments/supervisor-assignments.component').then(
        (m) => m.SupervisorAssignmentsComponent
      ),
  },
  {
    path: 'periods',
    loadComponent: () =>
      import('./pages/period-management/period-management.component').then(
        (m) => m.PeriodManagementComponent
      ),
  },
  {
    path: 'users',
    loadComponent: () =>
      import('./pages/user-management/user-management.component').then(
        (m) => m.UserManagementComponent
      ),
  },
  {
    path: 'reports',
    loadComponent: () =>
      import('./pages/reports/reports.component').then(
        (m) => m.ReportsComponent
      ),
  },
  {
    path: 'rejection-categories',
    loadComponent: () =>
      import('./pages/rejection-categories/rejection-categories.component').then(
        (m) => m.RejectionCategoriesComponent
      ),
  },
  {
    path: 'templates',
    loadComponent: () =>
      import('./pages/academic-templates/academic-templates.component').then(
        (m) => m.AcademicTemplatesComponent
      ),
  },
  {
    path: 'document-requirements',
    loadComponent: () =>
      import('./pages/document-requirements/document-requirements.component').then(
        (m) => m.DocumentRequirementsComponent
      ),
  },
  {
    path: 'academic-process',
    loadComponent: () =>
      import('./pages/academic-process/academic-process.component').then(
        (m) => m.AcademicProcessComponent
      ),
  },
  {
    path: 'skills',
    loadComponent: () =>
      import('./pages/skill-catalog-management/skill-catalog-management.component').then(
        (m) => m.SkillCatalogManagementComponent
      ),
  },
];
