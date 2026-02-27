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
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
