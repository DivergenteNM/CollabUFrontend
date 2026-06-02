import { Component, ChangeDetectionStrategy, signal, inject, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { FacultyService, EnrichedAssignment } from '../../services/faculty.service';
import { DataTableComponent, ColumnDef } from '../../../../shared/components/ui/data-table/data-table.component';

@Component({
  selector: 'app-assigned-students-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, DataTableComponent],
  templateUrl: './assigned-students-list.component.html',
  styleUrl: './assigned-students-list.component.scss',
})
export class AssignedStudentsListComponent implements OnDestroy {
  private readonly router = inject(Router);
  private readonly facultyService = inject(FacultyService);
  private readonly destroy$ = new Subject<void>();

  readonly page = signal(1);
  readonly isLoading = signal(true);
  readonly totalCount = signal(0);
  readonly students = signal<EnrichedAssignment[]>([]);

  readonly columns: ColumnDef<EnrichedAssignment>[] = [
    { key: 'studentName', header: 'Estudiante', sortable: true },
    { key: 'projectTitle', header: 'Proyecto' },
    { key: 'companyName', header: 'Empresa' },
    { key: 'status', header: 'Estado', sortable: true },
  ];

  constructor() {
    this.loadAssignments();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAssignments(): void {
    this.isLoading.set(true);
    this.facultyService.getMyStudentsEnriched({ page: this.page(), limit: 10 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.students.set(response.data);
          this.totalCount.set(response.total);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  onRowClick(row: EnrichedAssignment): void {
    this.router.navigate(['/my-students', row.applicationId]);
  }

  onPage(event: { page?: number; limit?: number }): void {
    this.page.set(event.page ?? 1);
    this.loadAssignments();
  }
}