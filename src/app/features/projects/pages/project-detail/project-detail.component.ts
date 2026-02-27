import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-project-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>Detalle del Proyecto {{ id() }} (próxima fase)</p>`,
})
export class ProjectDetailComponent {
  readonly id = input.required<string>();
}
