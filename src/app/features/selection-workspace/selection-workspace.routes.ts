import { Routes } from '@angular/router';
import { selectionStageGuard } from '../workspace/guards/stage-router.guard';

export const SELECTION_WORKSPACE_ROUTES: Routes = [
  {
    path: ':applicationId',
    canActivate: [selectionStageGuard],
    loadComponent: () =>
      import('./pages/selection-workspace/selection-workspace.component').then(
        (m) => m.SelectionWorkspaceComponent,
      ),
    data: { title: 'Postulación' },
  },
];
