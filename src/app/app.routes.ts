// app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/guards';
import { UserRole } from './core/enums/user-role.enum';

export const routes: Routes = [
  // ============================================================
  // RUTAS PÚBLICAS (sin autenticación)
  // ============================================================
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },

  // ============================================================
  // RUTAS AUTENTICADAS (cualquier rol)
  // ============================================================
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard-router/dashboard-router.component').then(
            (m) => m.DashboardRouterComponent
          ),
      },
    ],
  },

  // ============================================================
  // FALLBACK
  // ============================================================
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
