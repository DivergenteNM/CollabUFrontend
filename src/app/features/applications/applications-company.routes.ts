import { Routes } from '@angular/router';

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
    loadComponent: () =>
      import('./pages/application-review/application-review.component').then(
        (m) => m.ApplicationReviewComponent
      ),
    data: { title: 'Revisar Aplicación' },
  },
];
