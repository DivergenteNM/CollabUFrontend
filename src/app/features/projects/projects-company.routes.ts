import { Routes } from '@angular/router';

export const PROJECTS_COMPANY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/my-projects-list/my-projects-list.component').then(
        (m) => m.MyProjectsListComponent
      ),
  },
];
