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
    path: 'verifications/:id',
    loadComponent: () =>
      import('./pages/verification-detail/verification-detail.component').then(
        (m) => m.VerificationDetailComponent
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
];
