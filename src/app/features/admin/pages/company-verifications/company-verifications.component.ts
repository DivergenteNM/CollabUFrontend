import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { httpResource } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { PaginatedResponse, CompanyVerification } from '../../../../core/models';
import { DataTableComponent, ColumnDef } from '../../../../shared/components/ui/data-table/data-table.component';

@Component({
  selector: 'app-company-verifications',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIconModule, MatButtonModule, MatChipsModule,
    MatFormFieldModule, MatSelectModule, DataTableComponent,
  ],
  template: `
    <div class="verifications">
      <div class="verifications__header">
        <h1>Verificaciones de Empresas</h1>
      </div>

      <div class="verifications__filters">
        <mat-form-field appearance="outline">
          <mat-label>Estado</mat-label>
          <mat-select [value]="statusFilter()" (selectionChange)="statusFilter.set($event.value)">
            <mat-option value="">Todos</mat-option>
            <mat-option value="pending">Pendiente</mat-option>
            <mat-option value="approved">Aprobada</mat-option>
            <mat-option value="rejected">Rechazada</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <app-data-table
        [data]="verifications()"
        [columns]="columns"
        [totalItems]="resource.value()?.meta?.total ?? 0"
        [loading]="resource.isLoading()"
        (rowClicked)="onRowClick($event)"
        (pageChanged)="onPage($event)" />
    </div>
  `,
  styles: `
    .verifications {
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
        margin-bottom: 16px;

        mat-form-field {
          width: 200px;
        }
      }
    }
  `,
})
export class CompanyVerificationsComponent {
  readonly statusFilter = signal('');
  readonly page = signal(1);

  readonly columns: ColumnDef<CompanyVerification>[] = [
    { key: 'companyName', header: 'Empresa', sortable: true },
    { key: 'nit', header: 'NIT' },
    { key: 'requestedAt', header: 'Fecha Registro', type: 'date', sortable: true },
    { key: 'status', header: 'Estado', sortable: true },
  ];

  readonly resource = httpResource<PaginatedResponse<CompanyVerification>>(
    () => ({
      url: `${environment.apiUrl}/admin/verifications`,
      params: {
        page: this.page().toString(),
        limit: '10',
        ...(this.statusFilter() ? { status: this.statusFilter() } : {}),
      },
    })
  );

  readonly verifications = computed(() => this.resource.value()?.data ?? []);

  onRowClick(row: CompanyVerification): void {
    window.location.href = `/admin/verifications/${row.id}`;
  }

  onPage(event: { page?: number; limit?: number }): void {
    this.page.set(event.page ?? 1);
  }
}
