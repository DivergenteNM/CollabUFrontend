import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { firstValueFrom } from 'rxjs';
import { AdminService, PendingApplicationRow, SupervisorRow } from '../../services/admin.service';
import { AuthStore } from '../../../../state/auth.store';
import { DepartmentChipsComponent } from '../../../../shared/components/department-chips/department-chips.component';

export interface AssignDialogData {
  application: PendingApplicationRow;
  supervisors: SupervisorRow[];
  periodId: string | null;
}

export interface AssignDialogResult {
  supervisorId: string;
  juradoIds: string[] | undefined;
  startDate: string;
  notes: string | undefined;
}

/**
 * Asignación de asesor y jurados de anteproyecto.
 * Muestra a los docentes como tarjetas con su cupo y departamento, valida en el cliente los casos que el
 * servidor también rechaza (cupo lleno, asesor = jurado, sin período) y avisa cuando el docente es de otro departamento.
 */
@Component({
  selector: 'app-assign-supervisor-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    MatCheckboxModule, MatSlideToggleModule, MatProgressBarModule, FormsModule, DecimalPipe,
    DepartmentChipsComponent,
  ],
  template: `
    <div class="asd-header">
      <div class="asd-header-icon"><mat-icon>school</mat-icon></div>
      <div class="asd-header-text">
        <h2 mat-dialog-title class="asd-title">Asignar asesor académico</h2>
        <p class="asd-subtitle">Elige al docente que acompañará el proyecto y, si quieres, los jurados del anteproyecto.</p>
      </div>
    </div>

    <mat-dialog-content class="asd-content">
      <section class="asd-summary" aria-label="Resumen de la postulación">
        <div class="asd-summary-main">
          <span class="asd-summary-label">Estudiante</span>
          <strong>{{ data.application.studentName }}</strong>
          <app-department-chips [ids]="data.application.programId" />
        </div>
        <div class="asd-summary-main">
          <span class="asd-summary-label">Proyecto</span>
          <strong>{{ data.application.projectTitle }}</strong>
        </div>
        @if (data.application.matchScore) {
          <div class="asd-summary-main">
            <span class="asd-summary-label">Compatibilidad</span>
            <strong>{{ data.application.matchScore | number:'1.0-0' }}%</strong>
          </div>
        }
      </section>

      @if (!data.periodId) {
        <p class="asd-warn" role="alert">
          <mat-icon>warning</mat-icon>
          No hay período académico activo. Crea o activa uno en «Períodos» antes de asignar.
        </p>
      }

      <section class="asd-section">
        <div class="asd-section-head">
          <h3 class="asd-section-title">1 · Docentes disponibles</h3>
          @if (auth.isDepartmentAdmin()) {
            <mat-slide-toggle [checked]="includeOthers()" (change)="toggleOthers($event.checked)"
              data-testid="include-others">
              Incluir otros departamentos
            </mat-slide-toggle>
          }
        </div>
        <mat-form-field appearance="outline" class="asd-search" subscriptSizing="dynamic">
          <mat-label>Buscar docente</mat-label>
          <input matInput [ngModel]="query()" (ngModelChange)="query.set($event)" placeholder="Nombre o especialización" />
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
        @if (loadingOthers()) { <mat-progress-bar mode="indeterminate" /> }

        <div class="asd-list" role="radiogroup" aria-label="Asesor académico">
          @for (sup of filtered(); track sup.id) {
            <button type="button" class="asd-card" role="radio"
              [attr.aria-checked]="selectedSupervisorId() === sup.id"
              [class.asd-card--selected]="selectedSupervisorId() === sup.id"
              [class.asd-card--full]="isFull(sup)"
              [disabled]="isFull(sup)"
              (click)="selectAdvisor(sup)">
              <div class="asd-card-top">
                <span class="asd-card-name">{{ sup.fullName ?? sup.userId }}</span>
                @if (sup.crossDepartment) {
                  <span class="asd-flag" title="Docente de otro departamento">Otro departamento</span>
                }
              </div>
              <div class="asd-card-sub">{{ sup.specialization || sup.department || 'Sin especialización' }}</div>
              <div class="asd-capacity" [attr.aria-label]="'Cupo ' + sup.currentStudents + ' de ' + sup.maxStudents">
                <div class="asd-capacity-bar">
                  <span [style.width.%]="load(sup)" [class.asd-capacity-bar--warn]="load(sup) >= 80"></span>
                </div>
                <span class="asd-capacity-text">
                  @if (isFull(sup)) { Cupo lleno } @else { {{ sup.currentStudents }}/{{ sup.maxStudents }} estudiantes }
                </span>
              </div>
            </button>
          } @empty {
            <p class="asd-empty">No hay docentes que coincidan{{ auth.isDepartmentAdmin() && !includeOthers() ? ' en tu departamento. Activa «Incluir otros departamentos» para ver más.' : '.' }}</p>
          }
        </div>

        @if (selectedCross()) {
          <p class="asd-note" role="status">
            <mat-icon>info</mat-icon>
            Este docente pertenece a otro departamento. Puedes asignarlo, pero confirma que es lo que buscas.
          </p>
        }
      </section>

      <section class="asd-section">
        <h3 class="asd-section-title">2 · Jurado de anteproyecto <span class="asd-optional">(opcional)</span></h3>
        <p class="asd-hint">Se aceptan automáticamente. No puede ser la misma persona que el asesor.</p>
        <div class="asd-jury">
          @for (sup of filtered(); track sup.id) {
            <mat-checkbox [checked]="isJury(sup.id)" [disabled]="sup.id === selectedSupervisorId()"
              (change)="toggleJury(sup.id, $event.checked)">
              {{ sup.fullName ?? sup.userId }}
              @if (sup.crossDepartment) { <span class="asd-flag asd-flag--inline">Otro departamento</span> }
            </mat-checkbox>
          }
        </div>
      </section>

      <section class="asd-section">
        <h3 class="asd-section-title">3 · Inicio y notas</h3>
        <div class="asd-row">
          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <mat-label>Fecha de inicio</mat-label>
            <input matInput type="date" [ngModel]="startDate()" (ngModelChange)="startDate.set($event)" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="asd-grow" subscriptSizing="dynamic">
            <mat-label>Notas (opcional)</mat-label>
            <input matInput [ngModel]="notes()" (ngModelChange)="notes.set($event)" />
          </mat-form-field>
        </div>
      </section>

      @if (problem(); as p) {
        <p class="asd-error" role="alert" data-testid="assign-problem"><mat-icon>error_outline</mat-icon>{{ p }}</p>
      } @else if (selected(); as sel) {
        <p class="asd-ready" data-testid="assign-ready">
          <mat-icon>check_circle</mat-icon>
          {{ sel.fullName ?? sel.userId }} será el asesor
          @if (juryIds().length) { y {{ juryIds().length }} {{ juryIds().length === 1 ? 'docente' : 'docentes' }} serán jurado }.
          El proyecto inicia cuando el asesor acepte.
        </p>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="asd-actions">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="!!problem() || !selected()" (click)="confirm()"
        data-testid="assign-confirm">
        <mat-icon>check</mat-icon>
        Asignar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .asd-header { display: flex; align-items: flex-start; gap: 14px; padding: 20px 24px 4px; }
    .asd-header-icon {
      width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
      background: var(--mat-sys-primary-container); color: var(--mat-sys-on-primary-container);
      display: flex; align-items: center; justify-content: center;
    }
    .asd-title { margin: 0; padding: 0; font-size: 1.15rem; font-weight: 700; line-height: 1.3; }
    .asd-subtitle { margin: 4px 0 0; font-size: .8125rem; color: var(--mat-sys-on-surface-variant); }
    .asd-content { min-width: 560px; max-width: 640px; display: flex; flex-direction: column; gap: 14px; padding: 12px 24px 4px; }
    .asd-summary {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px 16px;
      background: var(--mat-sys-surface-container); border-radius: 12px; padding: 12px 16px;
    }
    .asd-summary-main { display: flex; flex-direction: column; gap: 2px; min-width: 0; font-size: .875rem; }
    .asd-summary-main strong { overflow: hidden; text-overflow: ellipsis; }
    .asd-summary-label { font-size: .7rem; text-transform: uppercase; letter-spacing: .05em; color: var(--mat-sys-on-surface-variant); }
    .asd-section-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
    .asd-section-title { margin: 0 0 6px; font-size: .8rem; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: var(--mat-sys-on-surface-variant); }
    .asd-optional { text-transform: none; font-weight: 400; letter-spacing: normal; }
    .asd-hint { margin: 0 0 6px; font-size: .78rem; color: var(--mat-sys-on-surface-variant); }
    .asd-search { width: 100%; margin-bottom: 8px; }
    .asd-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 8px; max-height: 260px; overflow-y: auto; padding: 2px; }
    .asd-card {
      text-align: left; border: 1.5px solid var(--mat-sys-outline-variant); background: var(--mat-sys-surface);
      color: inherit; border-radius: 12px; padding: 10px 12px; cursor: pointer; display: flex; flex-direction: column; gap: 4px;
      font: inherit; transition: border-color .15s, background .15s;
    }
    .asd-card:hover:not(:disabled) { border-color: var(--mat-sys-primary); }
    .asd-card--selected { border-color: var(--mat-sys-primary); background: var(--mat-sys-primary-container); }
    .asd-card--full { opacity: .55; cursor: not-allowed; }
    .asd-card-top { display: flex; justify-content: space-between; align-items: center; gap: 6px; }
    .asd-card-name { font-weight: 600; font-size: .9rem; }
    .asd-card-sub { font-size: .78rem; color: var(--mat-sys-on-surface-variant); }
    .asd-flag {
      font-size: .68rem; font-weight: 700; padding: 1px 8px; border-radius: 10px; white-space: nowrap;
      background: var(--mat-sys-tertiary-container); color: var(--mat-sys-on-tertiary-container);
    }
    .asd-flag--inline { margin-left: 6px; }
    .asd-capacity { display: flex; align-items: center; gap: 8px; }
    .asd-capacity-bar { flex: 1; height: 6px; border-radius: 4px; background: var(--mat-sys-surface-container-highest); overflow: hidden; }
    .asd-capacity-bar span { display: block; height: 100%; background: var(--mat-sys-primary); }
    .asd-capacity-bar--warn { background: var(--mat-sys-error) !important; }
    .asd-capacity-text { font-size: .72rem; color: var(--mat-sys-on-surface-variant); white-space: nowrap; }
    .asd-empty { margin: 8px 0; font-size: .85rem; color: var(--mat-sys-on-surface-variant); grid-column: 1 / -1; }
    .asd-jury { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 0 12px; max-height: 150px; overflow-y: auto; }
    .asd-row { display: flex; gap: 12px; flex-wrap: wrap; }
    .asd-grow { flex: 1; min-width: 200px; }
    .asd-warn, .asd-note, .asd-error, .asd-ready {
      display: flex; align-items: center; gap: 8px; margin: 0; padding: 10px 14px; border-radius: 10px; font-size: .8125rem;
    }
    .asd-warn, .asd-note { background: var(--mat-sys-tertiary-container); color: var(--mat-sys-on-tertiary-container); }
    .asd-error { background: var(--mat-sys-error-container); color: var(--mat-sys-on-error-container); }
    .asd-ready { background: var(--mat-sys-secondary-container); color: var(--mat-sys-on-secondary-container); }
    .asd-warn mat-icon, .asd-note mat-icon, .asd-error mat-icon, .asd-ready mat-icon { flex-shrink: 0; font-size: 18px; width: 18px; height: 18px; }
    .asd-actions { padding: 12px 24px 20px; }
    @media (max-width: 640px) { .asd-content { min-width: 0; } }
  `],
})
export class AssignSupervisorDialogComponent {
  readonly data = inject<AssignDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<AssignSupervisorDialogComponent, AssignDialogResult>);
  private readonly adminService = inject(AdminService);
  readonly auth = inject(AuthStore);

  readonly supervisors = signal<SupervisorRow[]>(this.data.supervisors);
  readonly includeOthers = signal(false);
  readonly loadingOthers = signal(false);
  readonly query = signal('');

  readonly selectedSupervisorId = signal('');
  readonly juryIds = signal<string[]>([]);
  readonly startDate = signal(new Date().toISOString().slice(0, 10));
  readonly notes = signal('');

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    return this.supervisors().filter((s) => {
      if (!q) return true;
      return `${s.fullName ?? ''} ${s.specialization ?? ''} ${s.department ?? ''}`.toLowerCase().includes(q);
    });
  });

  readonly selected = computed(() => this.supervisors().find((s) => s.id === this.selectedSupervisorId()) ?? null);
  readonly selectedCross = computed(() => !!this.selected()?.crossDepartment);

  /** Primer problema que impediría asignar (el servidor valida lo mismo; aquí se evita el viaje). */
  readonly problem = computed<string | null>(() => {
    if (!this.data.periodId) return 'No hay un período académico activo.';
    const sel = this.selected();
    if (!sel) return null;
    if (this.isFull(sel)) return 'El docente elegido no tiene cupo disponible.';
    if (this.juryIds().includes(sel.id)) return 'El asesor no puede ser también jurado.';
    if (!this.startDate()) return 'Indica la fecha de inicio.';
    return null;
  });

  isFull(s: SupervisorRow): boolean {
    return s.currentStudents >= s.maxStudents;
  }

  load(s: SupervisorRow): number {
    return s.maxStudents > 0 ? Math.min(100, Math.round((s.currentStudents / s.maxStudents) * 100)) : 100;
  }

  isJury(id: string): boolean {
    return this.juryIds().includes(id);
  }

  selectAdvisor(s: SupervisorRow): void {
    this.selectedSupervisorId.set(s.id);
    // El asesor no puede ser jurado: se quita si estaba marcado.
    this.juryIds.update((ids) => ids.filter((id) => id !== s.id));
  }

  toggleJury(id: string, checked: boolean): void {
    this.juryIds.update((ids) => (checked ? [...new Set([...ids, id])] : ids.filter((x) => x !== id)));
  }

  async toggleOthers(include: boolean): Promise<void> {
    this.includeOthers.set(include);
    this.loadingOthers.set(true);
    try {
      this.supervisors.set(await firstValueFrom(this.adminService.getSupervisors(true, include)));
      // Conserva la selección solo si sigue visible.
      if (!this.supervisors().some((s) => s.id === this.selectedSupervisorId())) this.selectedSupervisorId.set('');
      this.juryIds.update((ids) => ids.filter((id) => this.supervisors().some((s) => s.id === id)));
    } catch {
      this.includeOthers.set(!include);
    } finally {
      this.loadingOthers.set(false);
    }
  }

  confirm(): void {
    if (this.problem() || !this.selected()) return;
    this.ref.close({
      supervisorId: this.selectedSupervisorId(),
      juradoIds: this.juryIds().length ? this.juryIds() : undefined,
      startDate: this.startDate(),
      notes: this.notes() || undefined,
    });
  }
}
