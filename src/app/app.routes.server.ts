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
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
