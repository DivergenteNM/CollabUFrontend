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
  templateUrl: './company-verifications.component.html',
  styleUrl: './company-verifications.component.scss',
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
