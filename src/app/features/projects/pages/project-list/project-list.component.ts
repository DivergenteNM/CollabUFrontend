import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-project-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>Listado de Proyectos (próxima fase)</p>`,
})
export class ProjectListComponent {}
