import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-my-applications-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>Mis Aplicaciones (próxima fase)</p>`,
})
export class MyApplicationsListComponent {}
