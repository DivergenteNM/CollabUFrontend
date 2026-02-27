import { Routes } from '@angular/router';

export const FACULTY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/assigned-students-list/assigned-students-list.component').then(
        (m) => m.AssignedStudentsListComponent
      ),
  },
];
