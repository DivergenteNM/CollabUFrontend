import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DepartmentCatalogService } from '../../../core/services/department-catalog.service';

/** Chips de departamento (programas académicos) de una entidad: empresa, proyecto, docente… */
@Component({
  selector: 'app-department-chips',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (name of names(); track name) {
      <span class="dept-chip" data-testid="department-chip">{{ name }}</span>
    } @empty {
      @if (showEmpty()) {
        <span class="dept-chip dept-chip--empty">Sin departamento</span>
      }
    }
  `,
  styles: [`
    :host { display: inline-flex; flex-wrap: wrap; gap: 4px; }
    .dept-chip {
      display: inline-block;
      padding: 1px 8px;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 600;
      line-height: 18px;
      color: var(--mat-sys-on-secondary-container);
      background: var(--mat-sys-secondary-container);
    }
    .dept-chip--empty {
      color: var(--mat-sys-on-surface-variant);
      background: var(--mat-sys-surface-container-high);
      font-style: italic;
      font-weight: 500;
    }
  `],
})
export class DepartmentChipsComponent {
  private readonly catalog = inject(DepartmentCatalogService);

  /** Ids de programa (uno o varios). */
  readonly ids = input<readonly string[] | string | null | undefined>([]);
  /** Muestra "Sin departamento" cuando no hay ninguno. */
  readonly showEmpty = input(false);

  readonly names = computed(() => {
    const raw = this.ids();
    const list = Array.isArray(raw) ? raw : raw ? [raw as string] : [];
    return list.map((id) => this.catalog.shortName(id)).filter(Boolean);
  });

  constructor() {
    void this.catalog.load();
  }
}
