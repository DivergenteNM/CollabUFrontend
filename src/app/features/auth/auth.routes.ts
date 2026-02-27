import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../../shared/components/layout/auth-layout/auth-layout.component').then(
        (m) => m.AuthLayoutComponent
      ),
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      {
        path: 'login',
        loadComponent: () =>
          import('./pages/login/login.component').then((m) => m.LoginComponent),
        data: { title: 'Iniciar Sesión' },
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./pages/register/register.component').then((m) => m.RegisterComponent),
        data: { title: 'Crear Cuenta' },
      },
      {
        path: 'register/student',
        loadComponent: () =>
          import('./pages/register-student/register-student.component').then(
            (m) => m.RegisterStudentComponent
          ),
        data: { title: 'Registro Estudiante' },
      },
      {
        path: 'register/company',
        loadComponent: () =>
          import('./pages/register-company/register-company.component').then(
            (m) => m.RegisterCompanyComponent
          ),
        data: { title: 'Registro Empresa' },
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./pages/forgot-password/forgot-password.component').then(
            (m) => m.ForgotPasswordComponent
          ),
        data: { title: 'Recuperar Contraseña' },
      },
      {
        path: 'reset-password',
        loadComponent: () =>
          import('./pages/reset-password/reset-password.component').then(
            (m) => m.ResetPasswordComponent
          ),
        data: { title: 'Restablecer Contraseña' },
      },
      {
        path: 'verify-email',
        loadComponent: () =>
          import('./pages/verify-email/verify-email.component').then(
            (m) => m.VerifyEmailComponent
          ),
        data: { title: 'Verificar Email' },
      },
    ],
  },
];
