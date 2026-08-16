import { Routes } from '@angular/router';
import { developmentStageGuard } from './guards/stage-router.guard';

export const WORKSPACE_ROUTES: Routes = [
  {
    path: ':applicationId',
    canActivate: [developmentStageGuard],
    loadComponent: () =>
      import('./pages/project-workspace/project-workspace.component').then(
        (m) => m.ProjectWorkspaceComponent,
      ),
    data: { title: 'Proyecto' },
  },
];
