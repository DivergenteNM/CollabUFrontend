import { Routes } from '@angular/router';

export const APPLICATIONS_STUDENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/my-applications-list/my-applications-list.component').then(
        (m) => m.MyApplicationsListComponent
      ),
  },
];
