import { Component, ChangeDetectionStrategy, signal, computed, inject, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Subject, forkJoin, of } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';

import { SupervisorAssignmentItem, FacultyService, UserProfile } from '../../services/faculty.service';
import { DataTableComponent, ColumnDef } from '../../../../shared/components/ui/data-table/data-table.component';

interface EnrichedAssignment {
  id: string;
  applicationId: string;
  studentId: string;
  studentName: string;
  periodName: string;
  status: string;
  startDate: string;
  endDate: string | null;
}

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
  readonly enrichedData = signal<EnrichedAssignment[]>([]);

  readonly columns: ColumnDef<EnrichedAssignment>[] = [
    { key: 'studentName', header: 'Estudiante', sortable: true },
    { key: 'periodName', header: 'Período', sortable: false },
    { key: 'status', header: 'Estado', sortable: true },
    { key: 'startDate', header: 'Inicio', sortable: true },
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
    this.facultyService.getMyStudents({ page: this.page(), limit: 10 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.totalCount.set(response.total);
          this.enrichStudentNames(response.data);
        },
        error: () => this.isLoading.set(false),
      });
  }

  private enrichStudentNames(items: SupervisorAssignmentItem[]): void {
    if (items.length === 0) {
      this.enrichedData.set([]);
      this.isLoading.set(false);
      return;
    }

    const uniqueIds = [...new Set(items.map(a => a.studentId))];
    forkJoin(
      uniqueIds.map(id =>
        this.facultyService.getUserProfile(id).pipe(
          catchError(() => of(null)),
        )
      )
    ).pipe(takeUntil(this.destroy$)).subscribe({
      next: (profiles) => {
        const nameMap = new Map<string, string>();
        uniqueIds.forEach((id, i) => {
          const p = profiles[i] as UserProfile | null;
          if (p) {
            nameMap.set(id, p.displayName ?? (`${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || 'Estudiante'));
          } else {
            nameMap.set(id, 'Estudiante');
          }
        });

        const enriched: EnrichedAssignment[] = items.map(item => ({
          id: item.id,
          applicationId: item.applicationId,
          studentId: item.studentId,
          studentName: nameMap.get(item.studentId) ?? 'Estudiante',
          periodName: item.period?.name ?? '—',
          status: item.status,
          startDate: item.startDate,
          endDate: item.endDate,
        }));

        this.enrichedData.set(enriched);
        this.isLoading.set(false);
      },
      error: () => {
        const enriched: EnrichedAssignment[] = items.map(item => ({
          id: item.id,
          applicationId: item.applicationId,
          studentId: item.studentId,
          studentName: 'Estudiante',
          periodName: item.period?.name ?? '—',
          status: item.status,
          startDate: item.startDate,
          endDate: item.endDate,
        }));
        this.enrichedData.set(enriched);
        this.isLoading.set(false);
      },
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