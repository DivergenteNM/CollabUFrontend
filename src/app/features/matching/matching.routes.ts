import { Routes } from '@angular/router';

export const MATCHING_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/recommendations-list/recommendations-list.component').then(
        (m) => m.RecommendationsListComponent
      ),
  },
  {
    path: 'project/:projectId',
    loadComponent: () =>
      import('./pages/match-detail/match-detail.component').then(
        (m) => m.MatchDetailComponent
      ),
    data: { title: 'Detalle de Match' },
  },
];
