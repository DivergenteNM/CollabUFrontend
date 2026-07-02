import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards';
import { UserRole } from '../../core/enums/user-role.enum';

export const PROFILE_ROUTES: Routes = [
  { path: '', redirectTo: 'view', pathMatch: 'full' },
  {
    path: 'view',
    loadComponent: () =>
      import('./pages/profile-view/profile-view.component').then(
        (m) => m.ProfileViewComponent
      ),
  },
  {
    path: 'edit',
    loadComponent: () =>
      import('./pages/profile-edit/profile-edit.component').then(
        (m) => m.ProfileEditComponent
      ),
  },
  {
    path: 'skills',
    canActivate: [roleGuard(UserRole.STUDENT)],
    loadComponent: () =>
      import('./pages/skills-manager/skills-manager.component').then(
        (m) => m.SkillsManagerComponent
      ),
  },
  {
    path: 'documents',
    canActivate: [roleGuard(UserRole.STUDENT)],
    loadComponent: () =>
      import('./pages/documents-manager/documents-manager.component').then(
        (m) => m.DocumentsManagerComponent
      ),
  },
  {
    path: 'student/:id',
    loadComponent: () =>
      import('./pages/student-public-profile/student-public-profile.component').then(
        (m) => m.StudentPublicProfileComponent
      ),
  },
  {
    path: 'company/:id',
    loadComponent: () =>
      import('./pages/company-public-profile/company-public-profile.component').then(
        (m) => m.CompanyPublicProfileComponent
      ),
  },
];
