import {
  Component, ChangeDetectionStrategy, signal, computed,
  inject, OnInit, effect,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { DatePipe, DecimalPipe, SlicePipe, NgClass, CurrencyPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { statusLabel as registryLabel } from '../../../../core/status/status-registry';
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
import { AssignSupervisorDialogComponent, AssignDialogData } from './assign-supervisor-dialog.component';
import { DepartmentChipsComponent } from '../../../../shared/components/department-chips/department-chips.component';
import { DepartmentFilterComponent } from '../../../../shared/components/department-filter/department-filter.component';

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

        <!-- Habilidades -->
        @if (proj()!.skills?.length) {
          <div class="pd-section">
            <span class="pd-section-title"><mat-icon>psychology</mat-icon> Habilidades requeridas</span>
            <div class="pd-chips">
              @for (s of proj()!.skills; track s.name) {
                <span class="pd-chip">{{ s.name }}{{ s.isMandatory ? ' *' : '' }}</span>
              }
            </div>
          </div>
        }

        <!-- Programas académicos -->
        @if (proj()!.academicPrograms?.length) {
          <div class="pd-section">
            <span class="pd-section-title"><mat-icon>menu_book</mat-icon> Programas académicos</span>
            <div class="pd-chips">
              @for (id of proj()!.academicPrograms; track id) { <span class="pd-chip prog">{{ programName(id) }}</span> }
            </div>
          </div>
        }

        <!-- Requisitos -->
        @if (nonSkillRequirements().length) {
          <div class="pd-section">
            <span class="pd-section-title"><mat-icon>checklist</mat-icon> Requisitos</span>
            <div class="pd-reqs">
              @for (r of nonSkillRequirements(); track r.id) {
                <div class="pd-req-item">
                  <mat-icon class="req-ico" [class.mandatory]="r.isMandatory">{{ r.isMandatory ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                  <div>
                    <span class="req-name">{{ r.name }}</span>
                    @if (r.description) { <span class="req-desc">{{ r.description }}</span> }
                  </div>
                  <span class="req-type">{{ r.type }}</span>
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
    .pd-icon { color:var(--color-accent-600); font-size:26px; width:26px; height:26px; }
    h2[mat-dialog-title] { margin:0; font-size:18px; font-weight:600; line-height:1.3; }

    .pd-badges { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:4px; }
    .badge { padding:3px 10px; border-radius:var(--border-radius-pill); font-size:12px; font-weight:500; }
    .type-badge { background:var(--color-info-bg); color:var(--color-info-text); }
    .mode-badge { background:var(--color-success-bg); color:var(--color-success-text); }
    .status-published { background:var(--color-info-bg); color:var(--color-info-text); }
    .status-in_progress { background:var(--color-warning-bg); color:var(--color-warning-text); }
    .status-completed { background:var(--color-success-bg); color:var(--color-success-text); }
    .status-draft { background:var(--bg-secondary); color:var(--text-secondary); }

    mat-dialog-content { min-width:480px; max-width:600px; padding:16px 24px; }

    .pd-loading { padding:24px 0; text-align:center; }
    .pd-loading p { color:var(--text-secondary); margin-top:12px; font-size:13px; }
    .pd-error { display:flex; align-items:center; gap:8px; color:var(--color-error); padding:12px 0; }

    .pd-desc { font-size:14px; color:var(--text-secondary); line-height:1.6; margin:0 0 16px; }

    .pd-stats { display:flex; gap:16px; flex-wrap:wrap; padding:12px 0; margin-bottom:8px;
                border-top:1px solid var(--border-subtle); border-bottom:1px solid var(--border-subtle); }
    .stat-item { display:flex; align-items:center; gap:8px; }
    .stat-item mat-icon { color:var(--color-accent-600); font-size:20px; width:20px; height:20px; }
    .stat-item div { display:flex; flex-direction:column; }
    .stat-val { font-size:15px; font-weight:600; color:var(--text-primary); line-height:1.2; }
    .stat-lbl { font-size:11px; color:var(--text-secondary); text-transform:uppercase; letter-spacing:.4px; }

    .pd-section { margin-top:16px; }
    .pd-section-title { display:flex; align-items:center; gap:6px; font-size:13px; font-weight:600;
                        color:var(--text-secondary); text-transform:uppercase; letter-spacing:.5px; margin-bottom:8px; }
    .pd-section-title mat-icon { font-size:16px; width:16px; height:16px; }

    .pd-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
    .pd-field { display:flex; flex-direction:column; gap:2px; }
    .pd-lbl { font-size:11px; color:var(--text-secondary); text-transform:uppercase; letter-spacing:.4px; }
    .pd-field > span:last-child { font-size:14px; color:var(--text-primary); }

    .pd-chips { display:flex; flex-wrap:wrap; gap:6px; }
    .pd-chip { background:var(--color-info-bg); color:var(--color-info-text); padding:4px 12px; border-radius:var(--border-radius-pill); font-size:13px; }
    .pd-chip.prog { background:var(--color-warning-bg); color:var(--color-warning-text); }

    .pd-reqs { display:flex; flex-direction:column; gap:8px; }
    .pd-req-item { display:flex; align-items:flex-start; gap:8px; padding:8px 10px;
                   background:var(--bg-secondary); border-radius:var(--border-radius-xs); border:1px solid var(--border-subtle); }
    .req-ico { font-size:18px; width:18px; height:18px; color:var(--text-disabled); flex-shrink:0; margin-top:1px; }
    .req-ico.mandatory { color:var(--color-success); }
    .req-name { font-size:13px; font-weight:500; color:#212121; display:block; }
    .req-desc { font-size:12px; color:#777; display:block; margin-top:2px; }
    .req-type { margin-left:auto; font-size:11px; color:#999; background:#f0f0f0;
                padding:2px 8px; border-radius:10px; flex-shrink:0; white-space:nowrap; }
  `],
})
export class ProjectDetailDialogComponent implements OnInit {
  readonly data = inject<ProjectDetailData>(MAT_DIALOG_DATA);
  private readonly http = inject(HttpClient);
  private readonly adminService = inject(AdminService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly proj = signal<any>(null);
  private readonly programs = signal<{ id: string; name: string }[]>([]);

  constructor() {
    this.adminService.getPrograms(true).subscribe({
      next: (programs) => this.programs.set(programs),
      error: () => {},
    });
  }

  programName(id: string): string {
    return this.programs().find((p) => p.id === id)?.name ?? id;
  }

  /** Excluye requirements ya migrados a `skills` para no mostrar duplicados en datos antiguos. */
  nonSkillRequirements(): any[] {
    return (this.proj()?.requirements ?? []).filter((r: any) => r.type !== 'skill');
  }

  typeLabel(t: string) {
    const m: Record<string, string> = {
      internship: 'Pasantía', professional_practice: 'Práctica profesional',
      thesis: 'Tesis', research: 'Investigación', other: 'Otro',
    };
    return m[t] ?? t;
  }
  statusLabel(s: string) {
    return registryLabel('project', s);
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
    FormsModule, DatePipe, DecimalPipe, SlicePipe, DepartmentChipsComponent, DepartmentFilterComponent,
  ],
  templateUrl: './supervisor-assignments.component.html',
  styleUrl: './supervisor-assignments.component.scss',
})
export class SupervisorAssignmentsComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  /** Deep-link desde "Proceso académico": `?applicationId=` abre el diálogo directamente. */
  private readonly deepLinkAppId = toSignal(
    this.route.queryParamMap.pipe(map((p) => p.get('applicationId'))),
    { initialValue: null },
  );
  private deepLinkHandled = false;

  // ── Page state ──
  readonly page = signal(1);
  /** Solo superadmin: acota la cola a un departamento ('' = todos). */
  readonly departmentFilter = signal('');
  readonly limit = 10;
  /** Último total conocido: se conserva mientras se recarga otra página para que el paginador no parpadee. */
  private readonly lastTotal = signal(0);
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
      params: {
        page: String(this.page()),
        limit: String(this.limit),
        ...(this.departmentFilter() ? { programId: this.departmentFilter() } : {}),
      },
    })
  );

  readonly rows = computed(() => this.resource.value()?.data ?? []);

  readonly total = this.lastTotal.asReadonly();

  readonly columns = ['student', 'project', 'matchScore', 'acceptedAt', 'actions'];

  constructor() {
    effect(() => {
      const v = this.resource.value();
      if (v) this.lastTotal.set(v.total);
    });

    effect(() => {
      const appId = this.deepLinkAppId();
      const rows = this.rows();
      if (!appId || this.deepLinkHandled || this.loadingMeta() || rows.length === 0) return;
      const target = rows.find((r) => r.id === appId);
      if (!target) return;
      this.deepLinkHandled = true;
      this.router.navigate([], { queryParams: {}, replaceUrl: true });
      this.openAssignDialog(target);
    });
  }

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
      width: '600px',
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
        juradoIds: result.juradoIds,
        studentId: app.studentId,
        projectId: app.projectId,
        applicationId: app.id,
        periodId: this.currentPeriodId()!,
        startDate: result.startDate,
        notes: result.notes,
      }).subscribe({
        next: (res) => {
          this.assigning.set(false);
          const skipped = res.skipped?.length ?? 0;
          const msg = skipped > 0
            ? `Asignación registrada (${res.created.length} nuevas, ${skipped} ya estaban asignadas). El proyecto iniciará cuando el asesor acepte.`
            : 'Asesor y jurado asignados. El proyecto iniciará cuando el asesor acepte.';
          this.snackBar.open(msg, 'OK', { duration: 6000 });
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
