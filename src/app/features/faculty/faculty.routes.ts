import { Routes } from '@angular/router';
import { legacySupervisionRedirectGuard } from '../workspace/guards/stage-router.guard';

export const FACULTY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/assigned-students-list/assigned-students-list.component').then(
        (m) => m.AssignedStudentsListComponent
      ),
  },
  {
    // `StudentSupervisionComponent` queda deprecada (ver legacySupervisionRedirectGuard) —
    // su lógica de acciones (comentar/revisar anteproyecto) se migró a
    // AnteproyectoPanelComponent, consumido desde /workspace y /selection.
    path: ':applicationId',
    canActivate: [legacySupervisionRedirectGuard],
    loadComponent: () =>
      import('./pages/student-supervision/student-supervision.component').then(
        (m) => m.StudentSupervisionComponent
      ),
  },
];
