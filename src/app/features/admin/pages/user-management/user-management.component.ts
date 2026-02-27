import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { httpResource } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { PaginatedResponse } from '../../../../core/models';
import { DataTableComponent, ColumnDef } from '../../../../shared/components/ui/data-table/data-table.component';

interface UserRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-user-management',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    FormsModule, DataTableComponent,
  ],
  template: `
    <div class="user-mgmt">
      <div class="user-mgmt__header">
        <h1>Gestión de Usuarios</h1>
      </div>

      <div class="user-mgmt__filters">
        <mat-form-field appearance="outline">
          <mat-label>Buscar</mat-label>
          <input matInput [ngModel]="search()" (ngModelChange)="search.set($event)"
            placeholder="Nombre o email..." />
          <mat-icon matPrefix>search</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Rol</mat-label>
          <mat-select [value]="roleFilter()" (selectionChange)="roleFilter.set($event.value)">
            <mat-option value="">Todos</mat-option>
            <mat-option value="student">Estudiante</mat-option>
            <mat-option value="company">Empresa</mat-option>
            <mat-option value="faculty">Docente</mat-option>
            <mat-option value="admin">Admin</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Estado</mat-label>
          <mat-select [value]="statusFilter()" (selectionChange)="statusFilter.set($event.value)">
            <mat-option value="">Todos</mat-option>
            <mat-option value="true">Activo</mat-option>
            <mat-option value="false">Inactivo</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <app-data-table
        [data]="users()"
        [columns]="columns"
        [totalItems]="resource.value()?.meta?.total ?? 0"
        [loading]="resource.isLoading()"
        (pageChanged)="onPage($event)" />
    </div>
  `,
  styles: `
    .user-mgmt {
      max-width: 1200px;
      margin: 0 auto;

      &__header {
        margin-bottom: 24px;

        h1 {
          font-size: 1.75rem;
          font-weight: 500;
        }
      }

      &__filters {
        display: flex;
        gap: 16px;
        margin-bottom: 16px;
        flex-wrap: wrap;

        mat-form-field {
          min-width: 180px;
        }

        mat-form-field:first-child {
          flex: 1;
        }
      }
    }
  `,
})
export class UserManagementComponent {
  readonly search = signal('');
  readonly roleFilter = signal('');
  readonly statusFilter = signal('');
  readonly page = signal(1);

  readonly columns: ColumnDef<UserRow>[] = [
    { key: 'firstName', header: 'Nombre', sortable: true },
    { key: 'lastName', header: 'Apellido', sortable: true },
    { key: 'email', header: 'Email', sortable: true },
    { key: 'role', header: 'Rol', sortable: true },
    { key: 'isActive', header: 'Estado' },
    { key: 'createdAt', header: 'Registro', type: 'date', sortable: true },
  ];

  readonly resource = httpResource<PaginatedResponse<UserRow>>(
    () => ({
      url: `${environment.apiUrl}/admin/users`,
      params: {
        page: this.page().toString(),
        limit: '10',
        ...(this.search() ? { search: this.search() } : {}),
        ...(this.roleFilter() ? { role: this.roleFilter() } : {}),
        ...(this.statusFilter() ? { isActive: this.statusFilter() } : {}),
      },
    })
  );

  readonly users = computed(() => this.resource.value()?.data ?? []);

  onPage(event: { page?: number; limit?: number }): void {
    this.page.set(event.page ?? 1);
  }
}
