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
          description: 'Accede a tu cuenta en Collab-U para gestionar prácticas profesionales, pasantías y vinculación de la Universidad de Nariño.',
          robots: 'index, follow',
          ogTitle: 'Collab-U — Portal de Acceso a Prácticas Profesionales',
          ogDescription: 'Accede a la plataforma institucional de gestión de prácticas y vinculación formativa de la Universidad de Nariño.',
        },
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./pages/register/register.component').then((m) => m.RegisterComponent),
        data: {
          title: 'Crear Cuenta',
          description: 'Regístrate en Collab-U como estudiante o empresa para participar en el programa de prácticas profesionales de la Universidad de Nariño.',
          robots: 'index, follow',
          ogTitle: 'Registro en Collab-U — Universidad de Nariño',
          ogDescription: 'Únete a Collab-U como estudiante o empresa y conéctate al ecosistema de prácticas profesionales de la Universidad de Nariño.',
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
          description: 'Crea tu perfil de estudiante en Collab-U y postula a vacantes de prácticas profesionales de la Universidad de Nariño.',
          robots: 'index, follow',
          ogTitle: 'Registro de Estudiantes — Collab-U Udenar',
          ogDescription: 'Estudiantes Udenar: regístrate para iniciar tu proceso de prácticas profesionales supervisadas.',
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
          description: 'Registra tu organización en Collab-U y vincula talento universitario de la Universidad de Nariño en proyectos y prácticas.',
          robots: 'index, follow',
          ogTitle: 'Empresas Aliadas — Vincula Talento de la Universidad de Nariño',
          ogDescription: 'Registra tu organización en Collab-U, publica convocatorias y conecta con estudiantes de la Universidad de Nariño.',
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
          robots: 'noindex, nofollow',
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
          robots: 'noindex, nofollow',
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
          robots: 'noindex, nofollow',
        },
      },
    ],
  },
];
