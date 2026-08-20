import { Component, ChangeDetectionStrategy, signal, computed, inject, OnDestroy } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { statusLabel as registryLabel } from '../../../../core/status/status-registry';

import { FacultyService, EnrichedAssignment } from '../../services/faculty.service';
import { JuradoHistoryDialogComponent, JuradoHistoryDialogData } from '../../components/jurado-history-dialog/jurado-history-dialog.component';

/** Asignaciones cuya participación ya concluyó — historial de solo lectura. */
const TERMINAL_STATUSES = new Set(['disconnected', 'declined', 'replaced']);

// ─── Decline Dialog ─────────────────────────────────────────────────────────
@Component({
  selector: 'app-decline-assignment-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, FormsModule],
  template: `
    <h2 mat-dialog-title class="dlg-title"><mat-icon color="warn">block</mat-icon> Declinar asignación</h2>
    <mat-dialog-content class="dlg-content">
      <p class="dlg-sub">Indica por qué no puedes asesorar este proyecto. La Facultad asignará un nuevo asesor.</p>
      <mat-form-field appearance="outline" class="full-w">
        <mat-label>Motivo</mat-label>
        <textarea matInput [(ngModel)]="reason" rows="4" required></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close(null)">Cancelar</button>
      <button mat-flat-button color="warn" [disabled]="reason.trim().length < 5" (click)="dialogRef.close(reason.trim())">
        <mat-icon>block</mat-icon> Declinar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.dlg-title{display:flex;align-items:center;gap:8px}
    .dlg-content{min-width:380px;padding-top:8px}.dlg-sub{font-size:.875rem;color:#555;margin:0 0 8px}.full-w{width:100%}`],
})
export class DeclineAssignmentDialogComponent {
  readonly dialogRef = inject(MatDialogRef<DeclineAssignmentDialogComponent>);
  reason = '';
}

// ─── Main Component ─────────────────────────────────────────────────────────
@Component({
  selector: 'app-assigned-students-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, MatIconModule, MatButtonModule, MatDialogModule, MatSnackBarModule],
  templateUrl: './assigned-students-list.component.html',
  styleUrl: './assigned-students-list.component.scss',
})
export class AssignedStudentsListComponent implements OnDestroy {
  private readonly router = inject(Router);
  private readonly facultyService = inject(FacultyService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroy$ = new Subject<void>();

  readonly page = signal(1);
  readonly isLoading = signal(true);
  readonly totalCount = signal(0);
  readonly students = signal<EnrichedAssignment[]>([]);
  readonly processingId = signal<string | null>(null);

  readonly roleLabels: Record<string, string> = {
    asesor: 'Asesor',
    jurado_anteproyecto: 'Jurado de anteproyecto',
    jurado_final: 'Jurado final',
  };

  assignmentStatusLabel(status: string): string {
    return registryLabel('assignment', status);
  }

  constructor() {
    this.loadAssignments();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Límite alto (no 10) porque la agrupación Pendiente/Activo/Historial se
   * calcula en el cliente sobre la página actual — con paginación pequeña,
   * las secciones quedarían incompletas de forma confusa entre páginas.
   */
  private loadAssignments(): void {
    this.isLoading.set(true);
    this.facultyService.getMyStudentsEnriched({ page: this.page(), limit: 50 })
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

  readonly pendingGroup = computed(() => this.students().filter((s) => this.canAcceptOrDecline(s)));
  readonly activeGroup = computed(() => this.students().filter((s) => s.status === 'accepted'));
  readonly historyGroup = computed(() => this.students().filter((s) => TERMINAL_STATUSES.has(s.status)));

  isTerminal(row: EnrichedAssignment): boolean {
    return TERMINAL_STATUSES.has(row.status);
  }

  onRowClick(row: EnrichedAssignment): void {
    // Participación ya concluida: /workspace exigiría acceso activo y daría
    // 403 (correcto — ya no participa). El jurado conserva su historial en
    // un diálogo de solo lectura en vez de perder la relación con el proyecto.
    if (row.role === 'jurado_anteproyecto' && this.isTerminal(row)) {
      this.dialog.open(JuradoHistoryDialogComponent, {
        data: {
          applicationId: row.applicationId,
          projectTitle: row.projectTitle,
          studentName: row.studentName,
        } satisfies JuradoHistoryDialogData,
        width: '600px',
        maxHeight: '85vh',
      });
      return;
    }
    this.router.navigate(['/workspace', row.applicationId]);
  }

  onPage(event: { page?: number; limit?: number }): void {
    this.page.set(event.page ?? 1);
    this.loadAssignments();
  }

  canAcceptOrDecline(row: EnrichedAssignment): boolean {
    return row.role === 'asesor' && row.status === 'pending_acceptance';
  }

  accept(row: EnrichedAssignment, event: Event): void {
    event.stopPropagation();
    if (this.processingId()) return;
    this.processingId.set(row.id);
    this.facultyService.acceptAssignment(row.id).subscribe({
      next: () => {
        this.processingId.set(null);
        this.snackBar.open('Asignación aceptada. El proyecto ha iniciado.', 'OK', { duration: 4000 });
        this.loadAssignments();
      },
      error: (err) => {
        this.processingId.set(null);
        this.snackBar.open(err?.error?.message ?? 'Error al aceptar', 'Cerrar', { duration: 4000 });
      },
    });
  }

  decline(row: EnrichedAssignment, event: Event): void {
    event.stopPropagation();
    if (this.processingId()) return;
    this.dialog.open(DeclineAssignmentDialogComponent, { width: '440px' })
      .afterClosed().subscribe((reason: string | null) => {
        if (!reason) return;
        this.processingId.set(row.id);
        this.facultyService.declineAssignment(row.id, reason).subscribe({
          next: () => {
            this.processingId.set(null);
            this.snackBar.open('Asignación declinada. La Facultad reasignará un asesor.', 'OK', { duration: 4000 });
            this.loadAssignments();
          },
          error: (err) => {
            this.processingId.set(null);
            this.snackBar.open(err?.error?.message ?? 'Error al declinar', 'Cerrar', { duration: 4000 });
          },
        });
      });
  }
}
