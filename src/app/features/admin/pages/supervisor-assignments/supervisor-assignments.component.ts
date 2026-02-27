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
  template: `
    <div class="supervisors">
      <div class="supervisors__header">
        <h1>Asignación de Supervisores</h1>
      </div>

      <!-- Assignment Form -->
      <mat-card class="supervisors__form">
        <mat-card-header>
          <mat-card-title>Nueva Asignación</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Estudiante</mat-label>
              <mat-select (selectionChange)="selectedStudent.set($event.value)">
                <mat-option value="">Seleccionar estudiante...</mat-option>
                <mat-option value="placeholder-1">Estudiante sin supervisor (cargado del API)</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Docente</mat-label>
              <mat-select (selectionChange)="selectedFaculty.set($event.value)">
                <mat-option value="">Seleccionar docente...</mat-option>
                <mat-option value="placeholder-1">Docente disponible (cargado del API)</mat-option>
              </mat-select>
            </mat-form-field>

            <button mat-flat-button color="primary"
              [disabled]="!canAssign() || assigning()"
              (click)="assign()">
              <mat-icon>person_add</mat-icon>
              Asignar
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-divider />

      <!-- Assignments Table -->
      <h2>Asignaciones Activas</h2>
      <app-data-table
        [data]="assignments()"
        [columns]="columns"
        [totalItems]="resource.value()?.meta?.total ?? 0"
        [loading]="resource.isLoading()"
        (pageChanged)="onPage($event)" />
    </div>
  `,
  styles: `
    .supervisors {
      max-width: 1200px;
      margin: 0 auto;

      &__header {
        margin-bottom: 24px;

        h1 {
          font-size: 1.75rem;
          font-weight: 500;
        }
      }

      &__form {
        margin-bottom: 24px;
      }
    }

    .form-row {
      display: flex;
      gap: 16px;
      align-items: flex-start;
      flex-wrap: wrap;

      mat-form-field {
        flex: 1;
        min-width: 200px;
      }

      button {
        margin-top: 8px;
      }
    }

    h2 {
      font-size: 1.25rem;
      font-weight: 500;
      margin: 24px 0 16px;
    }

    mat-divider {
      margin: 16px 0;
    }
  `,
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
