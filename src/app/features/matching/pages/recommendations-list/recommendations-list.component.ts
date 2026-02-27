import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-recommendations-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>Recomendaciones (próxima fase)</p>`,
})
export class RecommendationsListComponent {}
