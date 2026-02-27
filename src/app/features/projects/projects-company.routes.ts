import { Routes } from '@angular/router';

export const PROJECTS_COMPANY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/my-projects-list/my-projects-list.component').then(
        (m) => m.MyProjectsListComponent
      ),
    data: { title: 'Mis Proyectos' },
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./pages/project-create/project-create.component').then(
        (m) => m.ProjectCreateComponent
      ),
    data: { title: 'Crear Proyecto' },
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./pages/project-edit/project-edit.component').then(
        (m) => m.ProjectEditComponent
      ),
    data: { title: 'Editar Proyecto' },
  },
  {
    path: ':id/applicants',
    loadComponent: () =>
      import('./pages/project-applicants/project-applicants.component').then(
        (m) => m.ProjectApplicantsComponent
      ),
    data: { title: 'Aplicantes del Proyecto' },
  },
];
