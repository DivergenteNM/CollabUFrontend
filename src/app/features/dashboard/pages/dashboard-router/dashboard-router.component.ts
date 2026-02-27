import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { AuthStore } from '../../../../state/auth.store';
import { StudentDashboardComponent } from '../student-dashboard/student-dashboard.component';
import { CompanyDashboardComponent } from '../company-dashboard/company-dashboard.component';
import { FacultyDashboardComponent } from '../faculty-dashboard/faculty-dashboard.component';
import { AdminRedirectComponent } from '../admin-redirect/admin-redirect.component';

@Component({
  selector: 'app-dashboard-router',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    StudentDashboardComponent,
    CompanyDashboardComponent,
    FacultyDashboardComponent,
    AdminRedirectComponent,
  ],
  template: `
    @switch (authStore.role()) {
      @case ('student')  { <app-student-dashboard /> }
      @case ('company')  { <app-company-dashboard /> }
      @case ('faculty')  { <app-faculty-dashboard /> }
      @case ('admin')    { <app-admin-redirect /> }
    }
  `,
})
export class DashboardRouterComponent {
  readonly authStore = inject(AuthStore);
}
