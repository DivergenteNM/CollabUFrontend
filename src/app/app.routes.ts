// app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/guards';
import { UserRole } from './core/enums/user-role.enum';

export const routes: Routes = [
  // ============================================================
  // RUTAS PÚBLICAS (sin autenticación)
  // ============================================================
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  // ============================================================
  // RUTAS AUTENTICADAS (cualquier rol) — MainLayout
  // ============================================================
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/components/layout/main-layout/main-layout.component').then(
        (m) => m.MainLayoutComponent
      ),
    children: [
      {
        path: 'onboarding',
        loadComponent: () =>
          import('./features/onboarding/pages/onboarding-flow/onboarding-flow.component').then(
            (m) => m.OnboardingFlowComponent
          ),
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard-router/dashboard-router.component').then(
            (m) => m.DashboardRouterComponent
          ),
      },
      {
        path: 'profile',
        loadChildren: () =>
          import('./features/profile/profile.routes').then((m) => m.PROFILE_ROUTES),
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./features/notifications/pages/notification-center/notification-center.component').then(
            (m) => m.NotificationCenterComponent
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/profile/pages/settings/settings.component').then(
            (m) => m.SettingsComponent
          ),
      },
      {
        path: 'chat',
        loadChildren: () =>
          import('./features/chat/chat.routes').then((m) => m.CHAT_ROUTES),
      },

      // ---- Proyectos disponibles (todos los roles) ----
      {
        path: 'projects',
        loadComponent: () =>
          import('./features/projects/pages/project-list/project-list.component').then(
            (m) => m.ProjectListComponent
          ),
        data: { title: 'Proyectos Disponibles' },
      },
      {
        path: 'projects/:id',
        loadComponent: () =>
          import('./features/projects/pages/project-detail/project-detail.component').then(
            (m) => m.ProjectDetailComponent
          ),
        data: { title: 'Detalle de Proyecto' },
      },

      // ---- Workspace del proyecto (todos los roles) ----
      {
        path: 'workspace',
        loadChildren: () =>
          import('./features/workspace/workspace.routes').then(
            (m) => m.WORKSPACE_ROUTES,
          ),
      },

      // ---- Workspace de selección — aplicación/entrevista/asignación de asesor ----
      {
        path: 'selection',
        loadChildren: () =>
          import('./features/selection-workspace/selection-workspace.routes').then(
            (m) => m.SELECTION_WORKSPACE_ROUTES,
          ),
      },

      // ---- Rutas de ESTUDIANTE ----
      {
        path: 'my-applications',
        canActivate: [roleGuard(UserRole.STUDENT)],
        loadChildren: () =>
          import('./features/applications/applications-student.routes').then(
            (m) => m.APPLICATIONS_STUDENT_ROUTES
          ),
      },
      {
        path: 'matching',
        canActivate: [roleGuard(UserRole.STUDENT)],
        loadChildren: () =>
          import('./features/matching/matching.routes').then((m) => m.MATCHING_ROUTES),
      },
      {
        path: 'my-evaluations',
        canActivate: [roleGuard(UserRole.STUDENT, UserRole.COMPANY, UserRole.FACULTY)],
        loadChildren: () =>
          import('./features/evaluations/evaluations.routes').then(
            (m) => m.EVALUATIONS_ROUTES
          ),
      },

      // ---- Rutas de EMPRESA ----
      {
        path: 'my-projects',
        canActivate: [roleGuard(UserRole.COMPANY)],
        loadChildren: () =>
          import('./features/projects/projects-company.routes').then(
            (m) => m.PROJECTS_COMPANY_ROUTES
          ),
      },
      {
        path: 'received-applications',
        canActivate: [roleGuard(UserRole.COMPANY)],
        loadChildren: () =>
          import('./features/applications/applications-company.routes').then(
            (m) => m.APPLICATIONS_COMPANY_ROUTES
          ),
      },
      {
        path: 'company-analytics',
        canActivate: [roleGuard(UserRole.COMPANY)],
        loadComponent: () =>
          import('./features/dashboard/pages/company-analytics/company-analytics.component').then(
            (m) => m.CompanyAnalyticsComponent
          ),
        data: { title: 'Métricas de mi Empresa' },
      },

      // ---- Tendencias de skills (todos los roles) ----
      {
        path: 'skills',
        loadComponent: () =>
          import('./features/skills/pages/skill-trends/skill-trends.component').then(
            (m) => m.SkillTrendsComponent
          ),
        data: { title: 'Tendencias de Skills' },
      },

      // ---- Analytics estudiante ----
      {
        path: 'my-analytics',
        canActivate: [roleGuard(UserRole.STUDENT)],
        loadComponent: () =>
          import('./features/students/pages/my-analytics/my-analytics.component').then(
            (m) => m.MyAnalyticsComponent
          ),
        data: { title: 'Mis Métricas' },
      },

      // ---- Rutas de DOCENTE ----
      {
        path: 'my-students',
        canActivate: [roleGuard(UserRole.FACULTY)],
        loadChildren: () =>
          import('./features/faculty/faculty.routes').then((m) => m.FACULTY_ROUTES),
      },

      // ---- Rutas de ADMIN ----
      {
        path: 'admin',
        canActivate: [roleGuard(UserRole.ADMIN)],
        loadChildren: () =>
          import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
      },
    ],
  },

  // ============================================================
  // FALLBACK — 404
  // ============================================================
  {
    path: '**',
    loadComponent: () =>
      import('./shared/components/not-found/not-found.component').then(
        (m) => m.NotFoundComponent
      ),
  },
];
