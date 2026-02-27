import { Routes } from '@angular/router';

export const MATCHING_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/recommendations-list/recommendations-list.component').then(
        (m) => m.RecommendationsListComponent
      ),
  },
];
