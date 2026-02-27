import { Routes } from '@angular/router';

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
    loadComponent: () =>
      import('./pages/application-detail/application-detail.component').then(
        (m) => m.ApplicationDetailComponent
      ),
    data: { title: 'Detalle de Aplicación' },
  },
];
