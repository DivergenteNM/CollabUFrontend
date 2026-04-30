import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { UiStore } from '../../../../state/ui.store';

@Component({
  selector: 'app-breadcrumbs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIconModule],
  host: {
    'class': 'app-breadcrumbs',
    'role': 'navigation',
    '[attr.aria-label]': "'Breadcrumb'",
  },
  templateUrl: './breadcrumbs.component.html',
  styleUrl: './breadcrumbs.component.scss',
})
export class BreadcrumbsComponent {
  private readonly uiStore = inject(UiStore);
  readonly breadcrumbs = this.uiStore.breadcrumbs;
}
