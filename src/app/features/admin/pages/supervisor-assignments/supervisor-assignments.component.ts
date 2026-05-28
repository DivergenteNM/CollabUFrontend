import {
  Component, ChangeDetectionStrategy, signal, computed,
  inject, OnInit,
} from '@angular/core';
import { DatePipe, DecimalPipe, SlicePipe, NgClass, CurrencyPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { httpResource } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { AdminService, PendingApplicationRow, SupervisorRow } from '../../services/admin.service';

// ─── Project Detail Dialog ────────────────────────────────────────────────────
interface ProjectDetailData {
  projectId: string;
  projectTitle: string;
}

@Component({
  selector: 'app-project-detail-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, MatProgressBarModule, DatePipe, NgClass, CurrencyPipe],
  template: `
    <div class="pd-header">
      <div class="pd-title-row">
        <mat-icon class="pd-icon">work_outline</mat-icon>
        <h2 mat-dialog-title>{{ data.projectTitle }}</h2>
      </div>
      @if (!loading() && proj()) {
        <div class="pd-badges">
          <span class="badge type-badge">{{ typeLabel(proj()!.projectType) }}</span>
          <span class="badge" [ngClass]="'status-' + proj()!.status">{{ statusLabel(proj()!.status) }}</span>
          @if (proj()!.locationType) {
            <span class="badge mode-badge">{{ modeLabel(proj()!.locationType) }}</span>
          }
        </div>
      }
    </div>

    <mat-dialog-content>
      @if (loading()) {
        <div class="pd-loading">
          <mat-progress-bar mode="indeterminate" />
          <p>Cargando información del proyecto…</p>
        </div>
      } @else if (error()) {
        <div class="pd-error">
          <mat-icon>error_outline</mat-icon>
          <span>{{ error() }}</span>
        </div>
      } @else if (proj()) {
        <!-- Descripción -->
        @if (proj()!.description) {
          <p class="pd-desc">{{ proj()!.description }}</p>
        }

        <!-- Stats row -->
        <div class="pd-stats">
          @if (proj()!.durationMonths) {
            <div class="stat-item">
              <mat-icon>schedule</mat-icon>
              <div><span class="stat-val">{{ proj()!.durationMonths }}</span><span class="stat-lbl">meses</span></div>
            </div>
          }
          @if (proj()!.weeklyHours) {
            <div class="stat-item">
              <mat-icon>access_time</mat-icon>
              <div><span class="stat-val">{{ proj()!.weeklyHours }}</span><span class="stat-lbl">hrs/semana</span></div>
            </div>
          }
          @if (proj()!.positionsAvailable) {
            <div class="stat-item">
              <mat-icon>group</mat-icon>
              <div><span class="stat-val">{{ proj()!.positionsAvailable }}</span><span class="stat-lbl">vacantes</span></div>
            </div>
          }
          @if (proj()!.minimumSemester) {
            <div class="stat-item">
              <mat-icon>school</mat-icon>
              <div><span class="stat-val">Sem. {{ proj()!.minimumSemester }}+</span><span class="stat-lbl">mínimo</span></div>
            </div>
          }
        </div>

        <!-- Fechas -->
        @if (proj()!.startDate || proj()!.endDate || proj()!.applicationDeadline) {
          <div class="pd-section">
            <span class="pd-section-title"><mat-icon>event</mat-icon> Fechas</span>
            <div class="pd-grid2">
              @if (proj()!.startDate) {
                <div class="pd-field"><span class="pd-lbl">Inicio</span><span>{{ proj()!.startDate | date:'dd MMM yyyy' }}</span></div>
              }
              @if (proj()!.endDate) {
                <div class="pd-field"><span class="pd-lbl">Fin</span><span>{{ proj()!.endDate | date:'dd MMM yyyy' }}</span></div>
              }
              @if (proj()!.applicationDeadline) {
                <div class="pd-field"><span class="pd-lbl">Cierre postulaciones</span><span>{{ proj()!.applicationDeadline | date:'dd MMM yyyy' }}</span></div>
              }
            </div>
          </div>
        }

        <!-- Compensación -->
        @if (proj()!.compensationType) {
          <div class="pd-section">
            <span class="pd-section-title"><mat-icon>payments</mat-icon> Compensación</span>
            <div class="pd-grid2">
              <div class="pd-field"><span class="pd-lbl">Tipo</span><span>{{ compensationLabel(proj()!.compensationType) }}</span></div>
              @if (proj()!.compensationAmount) {
                <div class="pd-field"><span class="pd-lbl">Monto</span><span>{{ proj()!.compensationAmount | currency:proj()!.currency:'symbol':'1.0-0' }}</span></div>
              }
            </div>
          </div>
        }

        <!-- Tags -->
        @if (proj()!.tags?.length) {
          <div class="pd-section">
            <span class="pd-section-title"><mat-icon>label_outline</mat-icon> Tecnologías / Tags</span>
            <div class="pd-chips">
              @for (t of proj()!.tags; track t) { <span class="pd-chip">{{ t }}</span> }
            </div>
          </div>
        }

        <!-- Programas académicos -->
        @if (proj()!.academicPrograms?.length) {
          <div class="pd-section">
            <span class="pd-section-title"><mat-icon>menu_book</mat-icon> Programas académicos</span>
            <div class="pd-chips">
              @for (p of proj()!.academicPrograms; track p) { <span class="pd-chip prog">{{ p }}</span> }
            </div>
          </div>
        }

        <!-- Requisitos -->
        @if (proj()!.requirements?.length) {
          <div class="pd-section">
            <span class="pd-section-title"><mat-icon>checklist</mat-icon> Requisitos</span>
            <div class="pd-reqs">
              @for (r of proj()!.requirements; track r.id) {
                <div class="pd-req-item">
                  <mat-icon class="req-ico" [class.mandatory]="r.isMandatory">{{ r.isMandatory ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                  <div>
                    <span class="req-name">{{ r.name }}</span>
                    @if (r.description) { <span class="req-desc">{{ r.description }}</span> }
                  </div>
                  <span class="req-type">{{ r.requirementType }}</span>
                </div>
              }
            </div>
          </div>
        }
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host { display:block; }

    .pd-header { padding:20px 24px 0; }
    .pd-title-row { display:flex; align-items:center; gap:10px; margin-bottom:10px; }
    .pd-icon { color:#1976d2; font-size:26px; width:26px; height:26px; }
    h2[mat-dialog-title] { margin:0; font-size:18px; font-weight:600; line-height:1.3; }

    .pd-badges { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:4px; }
    .badge { padding:3px 10px; border-radius:20px; font-size:12px; font-weight:500; }
    .type-badge { background:#e8eaf6; color:#3949ab; }
    .mode-badge { background:#e8f5e9; color:#2e7d32; }
    .status-published { background:#e3f2fd; color:#1565c0; }
    .status-in_progress { background:#fff3e0; color:#e65100; }
    .status-completed { background:#e8f5e9; color:#1b5e20; }
    .status-draft { background:#f5f5f5; color:#616161; }

    mat-dialog-content { min-width:480px; max-width:600px; padding:16px 24px; }

    .pd-loading { padding:24px 0; text-align:center; }
    .pd-loading p { color:#888; margin-top:12px; font-size:13px; }
    .pd-error { display:flex; align-items:center; gap:8px; color:#c62828; padding:12px 0; }

    .pd-desc { font-size:14px; color:#444; line-height:1.6; margin:0 0 16px; }

    .pd-stats { display:flex; gap:16px; flex-wrap:wrap; padding:12px 0; margin-bottom:8px;
                border-top:1px solid #f0f0f0; border-bottom:1px solid #f0f0f0; }
    .stat-item { display:flex; align-items:center; gap:8px; }
    .stat-item mat-icon { color:#1976d2; font-size:20px; width:20px; height:20px; }
    .stat-item div { display:flex; flex-direction:column; }
    .stat-val { font-size:15px; font-weight:600; color:#212121; line-height:1.2; }
    .stat-lbl { font-size:11px; color:#888; text-transform:uppercase; letter-spacing:.4px; }

    .pd-section { margin-top:16px; }
    .pd-section-title { display:flex; align-items:center; gap:6px; font-size:13px; font-weight:600;
                        color:#555; text-transform:uppercase; letter-spacing:.5px; margin-bottom:8px; }
    .pd-section-title mat-icon { font-size:16px; width:16px; height:16px; }

    .pd-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
    .pd-field { display:flex; flex-direction:column; gap:2px; }
    .pd-lbl { font-size:11px; color:#888; text-transform:uppercase; letter-spacing:.4px; }
    .pd-field > span:last-child { font-size:14px; color:#212121; }

    .pd-chips { display:flex; flex-wrap:wrap; gap:6px; }
    .pd-chip { background:#e3f2fd; color:#1565c0; padding:4px 12px; border-radius:16px; font-size:13px; }
    .pd-chip.prog { background:#f3e5f5; color:#6a1b9a; }

    .pd-reqs { display:flex; flex-direction:column; gap:8px; }
    .pd-req-item { display:flex; align-items:flex-start; gap:8px; padding:8px 10px;
                   background:#fafafa; border-radius:6px; border:1px solid #eee; }
    .req-ico { font-size:18px; width:18px; height:18px; color:#bbb; flex-shrink:0; margin-top:1px; }
    .req-ico.mandatory { color:#2e7d32; }
    .req-name { font-size:13px; font-weight:500; color:#212121; display:block; }
    .req-desc { font-size:12px; color:#777; display:block; margin-top:2px; }
    .req-type { margin-left:auto; font-size:11px; color:#999; background:#f0f0f0;
                padding:2px 8px; border-radius:10px; flex-shrink:0; white-space:nowrap; }
  `],
})
export class ProjectDetailDialogComponent implements OnInit {
  readonly data = inject<ProjectDetailData>(MAT_DIALOG_DATA);
  private readonly http = inject(HttpClient);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly proj = signal<any>(null);

  typeLabel(t: string) {
    const m: Record<string, string> = {
      internship: 'Pasantía', professional_practice: 'Práctica profesional',
      thesis: 'Tesis', research: 'Investigación', other: 'Otro',
    };
    return m[t] ?? t;
  }
  statusLabel(s: string) {
    const m: Record<string, string> = {
      draft: 'Borrador', pending_approval: 'En revisión', published: 'Publicado',
      in_progress: 'En curso', completed: 'Completado', cancelled: 'Cancelado',
    };
    return m[s] ?? s;
  }
  modeLabel(m: string) {
    const mp: Record<string, string> = { remote: 'Remoto', onsite: 'Presencial', hybrid: 'Híbrido' };
    return mp[m] ?? m;
  }
  compensationLabel(c: string) {
    const m: Record<string, string> = {
      paid: 'Remunerado', unpaid: 'Sin remuneración',
      academic_credit: 'Créditos académicos', stipend: 'Estipendio',
    };
    return m[c] ?? c;
  }

  ngOnInit() {
    this.http.get<any>(`${environment.apiUrl}/projects/${this.data.projectId}`).subscribe({
      next: (res) => { this.proj.set(res?.data ?? res); this.loading.set(false); },
      error: () => { this.error.set('No se pudo cargar el proyecto.'); this.loading.set(false); },
    });
  }
}

// ─── Assign Supervisor Dialog ─────────────────────────────────────────────────
interface AssignDialogData {
  application: PendingApplicationRow;
  supervisors: SupervisorRow[];
  periodId: string | null;
}

@Component({
  selector: 'app-assign-supervisor-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatSelectModule, MatInputModule,
    MatChipsModule, FormsModule, DecimalPipe,
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>school</mat-icon>
      Asignar asesor académico
    </h2>
    <mat-dialog-content>
      <div class="app-summary">
        <div class="app-row"><span class="lbl">Estudiante</span><span class="val">{{ data.application.studentName }}</span></div>
        <div class="app-row"><span class="lbl">Proyecto</span><span class="val">{{ data.application.projectTitle }}</span></div>
        @if (data.application.matchScore) {
          <div class="app-row">
            <span class="lbl">Match score</span>
            <span class="val">{{ data.application.matchScore | number:'1.0-0' }}%</span>
          </div>
        }
      </div>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Asesor académico</mat-label>
        <mat-select [(ngModel)]="selectedSupervisorId">
          @for (sup of data.supervisors; track sup.id) {
            <mat-option [value]="sup.id" [disabled]="sup.currentStudents >= sup.maxStudents">
              {{ sup.fullName ?? sup.userId }}
              — {{ sup.department }}
              ({{ sup.currentStudents }}/{{ sup.maxStudents }})
            </mat-option>
          }
        </mat-select>
      </mat-form-field>

      <div class="date-row">
        <mat-form-field appearance="outline">
          <mat-label>Fecha de inicio</mat-label>
          <input matInput type="date" [(ngModel)]="startDate" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Fecha de fin (opcional)</mat-label>
          <input matInput type="date" [(ngModel)]="endDate" />
        </mat-form-field>
      </div>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Notas (opcional)</mat-label>
        <textarea matInput rows="3" [(ngModel)]="notes"></textarea>
      </mat-form-field>

      @if (!data.periodId) {
        <p class="warn-text">
          <mat-icon>warning</mat-icon>
          No hay período académico activo. Crea uno en "Períodos" antes de asignar.
        </p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary"
        [disabled]="!selectedSupervisorId || !startDate || !data.periodId"
        (click)="confirm()">
        <mat-icon>check</mat-icon>
        Asignar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2[mat-dialog-title] { display: flex; align-items: center; gap: 8px; font-size: 18px; }
    mat-dialog-content { min-width: 420px; display: flex; flex-direction: column; gap: 12px; padding-top: 12px; }
    .app-summary { background: #f5f5f5; border-radius: 8px; padding: 12px 16px; display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px; }
    .app-row { display: flex; gap: 8px; font-size: 14px; }
    .lbl { font-weight: 500; min-width: 100px; color: #555; }
    .val { color: #222; }
    .full-width { width: 100%; }
    .date-row { display: flex; gap: 12px; }
    .date-row mat-form-field { flex: 1; }
    .warn-text { color: #e65100; display: flex; align-items: center; gap: 4px; font-size: 13px; background: #fff3e0; padding: 8px 12px; border-radius: 6px; margin: 0; }
  `],
})
export class AssignSupervisorDialogComponent {
  readonly data = inject<AssignDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<AssignSupervisorDialogComponent>);

  selectedSupervisorId = '';
  startDate = new Date().toISOString().slice(0, 10);
  endDate = '';
  notes = '';

  confirm() {
    this.ref.close({
      supervisorId: this.selectedSupervisorId,
      startDate: this.startDate,
      endDate: this.endDate || undefined,
      notes: this.notes || undefined,
    });
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────
@Component({
  selector: 'app-supervisor-assignments',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatTableModule, MatPaginatorModule,
    MatTooltipModule, MatProgressBarModule, MatChipsModule,
    MatDividerModule, MatDialogModule, MatSnackBarModule,
    FormsModule, DatePipe, DecimalPipe, SlicePipe,
    ProjectDetailDialogComponent,
  ],
  templateUrl: './supervisor-assignments.component.html',
  styleUrl: './supervisor-assignments.component.scss',
})
export class SupervisorAssignmentsComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  // ── Page state ──
  readonly page = signal(1);
  readonly limit = 10;
  _lastTotal = 0;
  readonly assigning = signal(false);

  // ── Supervisors + period (loaded once) ──
  readonly supervisors = signal<SupervisorRow[]>([]);
  readonly currentPeriodId = signal<string | null>(null);
  readonly loadingMeta = signal(true);

  // ── Pending applications via httpResource ──
  readonly resource = httpResource<{
    data: PendingApplicationRow[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>(
    () => ({
      url: `${environment.apiUrl}/applications/admin/pending`,
      params: { page: String(this.page()), limit: String(this.limit) },
    })
  );

  readonly rows = computed(() => {
    const v = this.resource.value();
    if (v) this._lastTotal = v.total;
    return v?.data ?? [];
  });

  readonly total = computed(() => this._lastTotal);

  readonly columns = ['student', 'project', 'matchScore', 'acceptedAt', 'actions'];

  ngOnInit() {
    this.adminService.getSupervisors(true).subscribe({
      next: (sups) => this.supervisors.set(sups),
      error: () => {},
    });
    this.adminService.getCurrentPeriod().subscribe({
      next: (res: any) => {
        const period = res?.data?.[0] ?? res?.[0] ?? null;
        this.currentPeriodId.set(period?.id ?? null);
        this.loadingMeta.set(false);
      },
      error: () => this.loadingMeta.set(false),
    });
  }

  openProjectDialog(app: PendingApplicationRow) {
    this.dialog.open(ProjectDetailDialogComponent, {
      data: { projectId: app.projectId, projectTitle: app.projectTitle } as ProjectDetailData,
      width: '600px',
      maxHeight: '90vh',
    });
  }

  openAssignDialog(app: PendingApplicationRow) {
    const ref = this.dialog.open(AssignSupervisorDialogComponent, {
      data: {
        application: app,
        supervisors: this.supervisors(),
        periodId: this.currentPeriodId(),
      } as AssignDialogData,
      width: '520px',
      maxHeight: '90vh',
    });

    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      if (!this.currentPeriodId()) {
        this.snackBar.open('No hay período académico activo.', 'OK', { duration: 4000 });
        return;
      }
      this.assigning.set(true);
      this.adminService.assignSupervisor({
        supervisorId: result.supervisorId,
        studentId: app.studentId,
        projectId: app.projectId,
        applicationId: app.id,
        periodId: this.currentPeriodId()!,
        startDate: result.startDate,
        endDate: result.endDate,
        notes: result.notes,
      }).subscribe({
        next: () => {
          this.assigning.set(false);
          this.snackBar.open('Asesor asignado correctamente. El proyecto ha iniciado.', 'OK', { duration: 5000 });
          this.resource.reload();
        },
        error: (err) => {
          this.assigning.set(false);
          const msg = err?.error?.message ?? 'Error al asignar asesor. Intenta de nuevo.';
          this.snackBar.open(msg, 'OK', { duration: 6000 });
        },
      });
    });
  }

  onPage(e: PageEvent) { this.page.set(e.pageIndex + 1); }
}
