import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

export interface BreadcrumbItem {
  label: string;
  link?: string | any[];
  icon?: string;
}

/**
 * §15.7 — Breadcrumb standalone para vistas profundas. Reemplaza el patrón
 * `<button (click)="history.back()">Volver</button>` con navegación explícita.
 * El último item se renderiza sin link como página actual.
 *
 * Ejemplo:
 *   <app-breadcrumbs [items]="[
 *     { label: 'Mis proyectos', link: '/my-projects', icon: 'folder' },
 *     { label: 'Postulantes' }
 *   ]" />
 */
@Component({
  selector: 'app-breadcrumbs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIconModule],
  template: `
    <nav class="crumbs" aria-label="Ruta de navegación">
      <ol class="crumbs__list">
        @for (item of items(); track item.label; let i = $index; let last = $last) {
          <li class="crumbs__item">
            @if (item.link && !last) {
              <a class="crumbs__link" [routerLink]="item.link">
                @if (item.icon) { <mat-icon>{{ item.icon }}</mat-icon> }
                <span>{{ item.label }}</span>
              </a>
            } @else {
              <span class="crumbs__current" aria-current="page">
                @if (item.icon) { <mat-icon>{{ item.icon }}</mat-icon> }
                {{ item.label }}
              </span>
            }
            @if (!last) {
              <mat-icon class="crumbs__sep" aria-hidden="true">chevron_right</mat-icon>
            }
          </li>
        }
      </ol>
    </nav>
  `,
  styles: [`
    .crumbs { margin-bottom: 12px; }
    .crumbs__list {
      list-style: none; padding: 0; margin: 0;
      display: flex; flex-wrap: wrap; align-items: center; gap: 4px;
      font-size: 0.875rem;
    }
    .crumbs__item {
      display: flex; align-items: center; gap: 4px;
    }
    .crumbs__link {
      display: inline-flex; align-items: center; gap: 4px;
      color: var(--mat-sys-on-surface-variant);
      text-decoration: none;

      &:hover { text-decoration: underline; color: var(--mat-sys-primary); }
    }
    .crumbs__link mat-icon,
    .crumbs__current mat-icon {
      font-size: 16px; width: 16px; height: 16px;
    }
    .crumbs__current {
      display: inline-flex; align-items: center; gap: 4px;
      font-weight: 600; color: var(--mat-sys-on-surface);
    }
    .crumbs__sep {
      font-size: 16px; width: 16px; height: 16px;
      color: var(--mat-sys-outline);
    }
  `],
})
export class BreadcrumbsComponent {
  readonly items = input.required<BreadcrumbItem[]>();
}
