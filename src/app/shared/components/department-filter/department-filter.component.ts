import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { AuthStore } from '../../../state/auth.store';
import { DepartmentCatalogService } from '../../../core/services/department-catalog.service';

/**
 * Selector global de departamento para el administrador de Facultad.
 * El admin de departamento no lo ve: su alcance ya está fijado en el servidor.
 */
@Component({
  selector: 'app-department-filter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatFormFieldModule, MatSelectModule],
  template: `
    @if (authStore.isSuperAdmin()) {
      <mat-form-field appearance="outline" class="dept-filter">
        <mat-label>{{ label() }}</mat-label>
        <mat-select [value]="value()" (selectionChange)="changed.emit($event.value)" data-testid="department-filter">
          <mat-option value="">Todos los departamentos</mat-option>
          @for (d of catalog.departments(); track d.id) {
            <mat-option [value]="d.id">{{ catalog.shortName(d.id) }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
    }
  `,
  styles: [`.dept-filter { min-width: 220px; }`],
})
export class DepartmentFilterComponent {
  readonly authStore = inject(AuthStore);
  readonly catalog = inject(DepartmentCatalogService);

  readonly value = input('');
  readonly label = input('Departamento');
  readonly changed = output<string>();

  constructor() {
    void this.catalog.load();
  }
}
