import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-my-projects-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>Mis Proyectos (próxima fase)</p>`,
})
export class MyProjectsListComponent {}
