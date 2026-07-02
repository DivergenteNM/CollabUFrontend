import { Routes } from '@angular/router';

export const FACULTY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/assigned-students-list/assigned-students-list.component').then(
        (m) => m.AssignedStudentsListComponent
      ),
  },
  {
    path: ':applicationId',
    loadComponent: () =>
      import('./pages/student-supervision/student-supervision.component').then(
        (m) => m.StudentSupervisionComponent
      ),
  },
];
