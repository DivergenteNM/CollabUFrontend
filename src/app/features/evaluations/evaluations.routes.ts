import { Routes } from '@angular/router';

export const EVALUATIONS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/evaluation-list/evaluation-list.component').then(
        (m) => m.EvaluationListComponent
      ),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./pages/evaluation-create/evaluation-create.component').then(
        (m) => m.EvaluationCreateComponent
      ),
    data: { title: 'Crear Evaluación' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/evaluation-detail/evaluation-detail.component').then(
        (m) => m.EvaluationDetailComponent
      ),
    data: { title: 'Detalle de Evaluación' },
  },
];
