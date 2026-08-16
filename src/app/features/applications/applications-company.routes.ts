import { Routes } from '@angular/router';

/**
 * §FASE 6 — `/received-applications/:id` se sustituye por `/workspace/:id`.
 * Se preserva como redirect para bookmarks y notificaciones antiguas.
 */
export const APPLICATIONS_COMPANY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/received-applications-list/received-applications-list.component').then(
        (m) => m.ReceivedApplicationsListComponent
      ),
    data: { title: 'Aplicaciones Recibidas' },
  },
  {
    path: ':id',
    redirectTo: '/workspace/:id',
    pathMatch: 'full',
  },
];
