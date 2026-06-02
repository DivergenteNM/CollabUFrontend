import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { httpResource } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { PaginatedResponse } from '../../../../core/models';
import { DataTableComponent, ColumnDef } from '../../../../shared/components/ui/data-table/data-table.component';

interface AssignedStudent {
  applicationId: string;
  studentName: string;
  companyName: string;
  projectTitle: string;
  hoursCompleted: number;
  hoursRequired: number;
  progressPercent: number;
  status: string;
}

@Component({
  selector: 'app-assigned-students-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatProgressBarModule, DataTableComponent],
  templateUrl: './assigned-students-list.component.html',
  styleUrl: './assigned-students-list.component.scss',
})
export class AssignedStudentsListComponent {
  private readonly router = inject(Router);
  readonly page = signal(1);

  readonly columns: ColumnDef<AssignedStudent>[] = [
    { key: 'studentName', header: 'Estudiante', sortable: true },
    { key: 'companyName', header: 'Empresa' },
    { key: 'projectTitle', header: 'Proyecto' },
    { key: 'progressPercent', header: 'Avance', sortable: true },
    { key: 'status', header: 'Estado', sortable: true },
  ];

  readonly resource = httpResource<PaginatedResponse<AssignedStudent>>(
    () => ({
      url: `${environment.apiUrl}/faculty/students`,
      params: { page: this.page().toString(), limit: '10' },
    })
  );

  readonly students = computed(() => this.resource.value()?.data ?? []);

  onRowClick(row: AssignedStudent): void {
    this.router.navigate(['/my-students', row.applicationId]);
  }

  onPage(event: { page?: number; limit?: number }): void {
    this.page.set(event.page ?? 1);
  }
}
