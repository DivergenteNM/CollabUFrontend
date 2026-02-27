import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-received-applications-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>Aplicaciones Recibidas (próxima fase)</p>`,
})
export class ReceivedApplicationsListComponent {}
