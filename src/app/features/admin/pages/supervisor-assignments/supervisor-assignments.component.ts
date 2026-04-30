import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { httpResource } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { PaginatedResponse, SupervisorAssignment } from '../../../../core/models';
import { AdminService } from '../../services/admin.service';
import { DataTableComponent, ColumnDef } from '../../../../shared/components/ui/data-table/data-table.component';

@Component({
  selector: 'app-supervisor-assignments',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIconModule, MatButtonModule, MatCardModule,
    MatFormFieldModule, MatSelectModule, MatDividerModule,
    DataTableComponent,
  ],
  templateUrl: './supervisor-assignments.component.html',
  styleUrl: './supervisor-assignments.component.scss',
})
export class SupervisorAssignmentsComponent {
  private readonly adminService = inject(AdminService);

  readonly selectedStudent = signal('');
  readonly selectedFaculty = signal('');
  readonly assigning = signal(false);
  readonly page = signal(1);

  readonly canAssign = computed(() =>
    !!this.selectedStudent() && !!this.selectedFaculty()
  );

  readonly columns: ColumnDef<SupervisorAssignment>[] = [
    { key: 'studentName', header: 'Estudiante', sortable: true },
    { key: 'facultyName', header: 'Docente', sortable: true },
    { key: 'projectTitle', header: 'Proyecto' },
    { key: 'assignedAt', header: 'Fecha Asignación', type: 'date', sortable: true },
    { key: 'status', header: 'Estado', sortable: true },
  ];

  readonly resource = httpResource<PaginatedResponse<SupervisorAssignment>>(
    () => ({
      url: `${environment.apiUrl}/admin/supervisors`,
      params: { page: this.page().toString(), limit: '10' },
    })
  );

  readonly assignments = computed(() => this.resource.value()?.data ?? []);

  assign(): void {
    this.assigning.set(true);
    this.adminService.assignSupervisor({
      studentId: this.selectedStudent(),
      facultyId: this.selectedFaculty(),
      applicationId: '',
    }).subscribe({
      next: () => {
        this.assigning.set(false);
        this.selectedStudent.set('');
        this.selectedFaculty.set('');
        this.resource.reload();
      },
      error: () => this.assigning.set(false),
    });
  }

  onPage(event: { page?: number; limit?: number }): void {
    this.page.set(event.page ?? 1);
  }
}
