import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'projects/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'my-projects/:id/edit',
    renderMode: RenderMode.Server,
  },
  {
    path: 'my-projects/:id/applicants',
    renderMode: RenderMode.Server,
  },
  {
    path: 'my-applications/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'received-applications/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'matching/project/:projectId',
    renderMode: RenderMode.Server,
  },
  {
    path: 'chat/:conversationId',
    renderMode: RenderMode.Server,
  },
  {
    path: 'my-evaluations/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'admin/verifications/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'my-students/:applicationId',
    renderMode: RenderMode.Server,
  },
  {
    path: 'profile/student/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'profile/company/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: '**',
    // Temporalmente SSR en todas las rutas restantes para evitar fetchs a API en build-time.
    // Volver a Prerender cuando exista estrategia estable de datos para rutas publicas.
    renderMode: RenderMode.Server,
  },
];
