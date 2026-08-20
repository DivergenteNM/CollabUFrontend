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
        data: {
          title: 'Iniciar Sesión',
          description: 'Accede a tu cuenta en Collab-U para gestionar prácticas profesionales, postulaciones y proyectos.',
          robots: 'noindex, follow',
        },
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./pages/register/register.component').then((m) => m.RegisterComponent),
        data: {
          title: 'Crear Cuenta',
          description: 'Regístrate en Collab-U como estudiante o empresa para participar en el programa de prácticas profesionales de la Universidad de Nariño.',
          robots: 'noindex, follow',
        },
      },
      {
        path: 'register/student',
        loadComponent: () =>
          import('./pages/register-student/register-student.component').then(
            (m) => m.RegisterStudentComponent
          ),
        data: {
          title: 'Registro de Estudiante',
          description: 'Crea tu perfil de estudiante en Collab-U y postula a vacantes de prácticas profesionales.',
          robots: 'noindex, follow',
        },
      },
      {
        path: 'register/company',
        loadComponent: () =>
          import('./pages/register-company/register-company.component').then(
            (m) => m.RegisterCompanyComponent
          ),
        data: {
          title: 'Registro de Empresa',
          description: 'Registra tu organización en Collab-U y publica convocatorias para estudiantes de la Universidad de Nariño.',
          robots: 'noindex, follow',
        },
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./pages/forgot-password/forgot-password.component').then(
            (m) => m.ForgotPasswordComponent
          ),
        data: {
          title: 'Recuperar Contraseña',
          description: 'Recupera el acceso a tu cuenta en la plataforma Collab-U.',
          robots: 'noindex, follow',
        },
      },
      {
        path: 'reset-password',
        loadComponent: () =>
          import('./pages/reset-password/reset-password.component').then(
            (m) => m.ResetPasswordComponent
          ),
        data: {
          title: 'Restablecer Contraseña',
          description: 'Establece una nueva contraseña para tu cuenta de Collab-U.',
          robots: 'noindex, follow',
        },
      },
      {
        path: 'verify-email',
        loadComponent: () =>
          import('./pages/verify-email/verify-email.component').then(
            (m) => m.VerifyEmailComponent
          ),
        data: {
          title: 'Verificar Correo Electrónico',
          description: 'Confirmación y verificación de correo electrónico en Collab-U.',
          robots: 'noindex, follow',
        },
      },
    ],
  },
];
