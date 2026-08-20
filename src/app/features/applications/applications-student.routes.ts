import { Routes } from '@angular/router';

/**
 * §FASE 2 — el detalle legacy `/my-applications/:id` se sustituye por
 * `/workspace/:id`. La ruta se conserva como redirect para no romper
 * bookmarks o enlaces externos.
 */
export const APPLICATIONS_STUDENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/my-applications-list/my-applications-list.component').then(
        (m) => m.MyApplicationsListComponent
      ),
    data: { title: 'Mis Aplicaciones' },
  },
  {
    path: ':id',
    redirectTo: '/workspace/:id',
    pathMatch: 'full',
  },
];
