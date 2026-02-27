import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-evaluation-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>Evaluaciones (próxima fase)</p>`,
})
export class EvaluationListComponent {}
