import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards';
import { UserRole } from '../../core/enums/user-role.enum';

export const ADMIN_ROUTES: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    // Analítica institucional — abierta a ADMIN y FACULTY (hereda el guard del padre en app.routes.ts).
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/admin-dashboard/admin-dashboard.component').then(
        (m) => m.AdminAnalyticsComponent
      ),
  },
  {
    path: 'verifications',
    canActivate: [roleGuard(UserRole.ADMIN)],
    loadComponent: () =>
      import('./pages/company-verifications/company-verifications.component').then(
        (m) => m.CompanyVerificationsComponent
      ),
  },
  {
    path: 'supervisors',
    canActivate: [roleGuard(UserRole.ADMIN)],
    loadComponent: () =>
      import('./pages/supervisor-assignments/supervisor-assignments.component').then(
        (m) => m.SupervisorAssignmentsComponent
      ),
  },
  {
    path: 'periods',
    canActivate: [roleGuard(UserRole.ADMIN)],
    loadComponent: () =>
      import('./pages/period-management/period-management.component').then(
        (m) => m.PeriodManagementComponent
      ),
  },
  {
    path: 'users',
    canActivate: [roleGuard(UserRole.ADMIN)],
    loadComponent: () =>
      import('./pages/user-management/user-management.component').then(
        (m) => m.UserManagementComponent
      ),
  },
  {
    // Reportes analíticos — abierta a ADMIN y FACULTY, igual que 'dashboard' (ver comentario arriba).
    path: 'reports',
    loadComponent: () =>
      import('./pages/reports/reports.component').then(
        (m) => m.ReportsComponent
      ),
  },
  {
    path: 'rejection-categories',
    canActivate: [roleGuard(UserRole.ADMIN)],
    loadComponent: () =>
      import('./pages/rejection-categories/rejection-categories.component').then(
        (m) => m.RejectionCategoriesComponent
      ),
  },
  {
    path: 'templates',
    canActivate: [roleGuard(UserRole.ADMIN)],
    loadComponent: () =>
      import('./pages/academic-templates/academic-templates.component').then(
        (m) => m.AcademicTemplatesComponent
      ),
  },
  {
    path: 'document-requirements',
    canActivate: [roleGuard(UserRole.ADMIN)],
    loadComponent: () =>
      import('./pages/document-requirements/document-requirements.component').then(
        (m) => m.DocumentRequirementsComponent
      ),
  },
  {
    path: 'academic-process',
    canActivate: [roleGuard(UserRole.ADMIN)],
    loadComponent: () =>
      import('./pages/academic-process/academic-process.component').then(
        (m) => m.AcademicProcessComponent
      ),
  },
  {
    path: 'skills',
    canActivate: [roleGuard(UserRole.ADMIN)],
    loadComponent: () =>
      import('./pages/skill-catalog-management/skill-catalog-management.component').then(
        (m) => m.SkillCatalogManagementComponent
      ),
  },
];
