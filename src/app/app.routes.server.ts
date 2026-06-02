import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Rutas públicas que sí se renderizan en servidor
  {
    path: 'projects/:id',
    renderMode: RenderMode.Server,
  },
  // Todas las rutas autenticadas y flujos privados se renderizan solo en el cliente (Client-Side Rendering)
  // para evitar errores 401 debido a la falta de localStorage/Authorization Headers en Node SSR.
  {
    path: 'my-projects/:id',
    renderMode: RenderMode.Client,
  },
  {
    path: 'my-projects/:id/edit',
    renderMode: RenderMode.Client,
  },
  {
    path: 'my-projects/:id/applicants',
    renderMode: RenderMode.Client,
  },
  {
    path: 'my-applications/:id',
    renderMode: RenderMode.Client,
  },
  {
    path: 'received-applications/:id',
    renderMode: RenderMode.Client,
  },
  {
    path: 'matching/project/:projectId',
    renderMode: RenderMode.Client,
  },
  {
    path: 'chat/:conversationId',
    renderMode: RenderMode.Client,
  },
  {
    path: 'my-evaluations/:id',
    renderMode: RenderMode.Client,
  },
  {
    path: 'admin/verifications/:id',
    renderMode: RenderMode.Client,
  },
  {
    path: 'my-students/:applicationId',
    renderMode: RenderMode.Client,
  },
  {
    path: 'profile/student/:id',
    renderMode: RenderMode.Client,
  },
  {
    path: 'profile/company/:id',
    renderMode: RenderMode.Client,
  },
  // Prefijos de rutas privadas principales
  {
    path: 'dashboard',
    renderMode: RenderMode.Client,
  },
  {
    path: 'onboarding',
    renderMode: RenderMode.Client,
  },
  {
    path: 'my-applications',
    renderMode: RenderMode.Client,
  },
  {
    path: 'received-applications',
    renderMode: RenderMode.Client,
  },
  {
    path: 'my-projects',
    renderMode: RenderMode.Client,
  },
  {
    path: 'chat',
    renderMode: RenderMode.Client,
  },
  {
    path: 'my-students',
    renderMode: RenderMode.Client,
  },
  {
    path: 'admin',
    renderMode: RenderMode.Client,
  },
  {
    path: 'matching',
    renderMode: RenderMode.Client,
  },
  {
    path: 'profile',
    renderMode: RenderMode.Client,
  },
  {
    path: 'settings',
    renderMode: RenderMode.Client,
  },
  {
    path: 'notifications',
    renderMode: RenderMode.Client,
  },
  {
    path: '**',
    // Rutas públicas restantes usan SSR dinámico
    renderMode: RenderMode.Server,
  },
];
