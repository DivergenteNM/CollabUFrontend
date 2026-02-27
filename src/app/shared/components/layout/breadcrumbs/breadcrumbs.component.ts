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
  template: `
    @let items = breadcrumbs();
    @if (items.length > 0) {
      <nav class="breadcrumbs">
        @for (crumb of items; track crumb.label; let last = $last) {
          @if (last) {
            <span class="breadcrumbs__current" aria-current="page">{{ crumb.label }}</span>
          } @else {
            @if (crumb.url) {
              <a class="breadcrumbs__link" [routerLink]="crumb.url">{{ crumb.label }}</a>
            } @else {
              <span class="breadcrumbs__link">{{ crumb.label }}</span>
            }
            <mat-icon class="breadcrumbs__separator">chevron_right</mat-icon>
          }
        }
      </nav>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .breadcrumbs {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 12px 24px;
      font-size: 13px;
      flex-wrap: wrap;
    }

    .breadcrumbs__link {
      color: var(--mat-sys-primary);
      text-decoration: none;
      cursor: pointer;

      &:hover {
        text-decoration: underline;
      }
    }

    .breadcrumbs__separator {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: var(--mat-sys-on-surface-variant);
    }

    .breadcrumbs__current {
      color: var(--mat-sys-on-surface-variant);
      font-weight: 500;
    }
  `,
})
export class BreadcrumbsComponent {
  private readonly uiStore = inject(UiStore);
  readonly breadcrumbs = this.uiStore.breadcrumbs;
}
