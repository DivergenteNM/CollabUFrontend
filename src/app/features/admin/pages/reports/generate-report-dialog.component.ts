import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { LowerCasePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../../environments/environment';
import { GenerateReportPayload, ReportType, ReportScope } from '../../../../core/models';
import { AdminService } from '../../services/admin.service';

interface EntityOption {
  id: string;
  label: string;
}

@Component({
  selector: 'app-generate-report-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatButtonToggleModule, MatProgressSpinnerModule, FormsModule,
    LowerCasePipe,
  ],
  template: `
    <h2 mat-dialog-title>Generar Reporte</h2>

    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Nombre del reporte</mat-label>
        <input matInput [(ngModel)]="name" placeholder="Ej: Resumen Semestre 2025-1" />
      </mat-form-field>

      <p class="scope-label">¿Sobre qué es el reporte?</p>
      <mat-button-toggle-group class="full-width" [ngModel]="scope()" (ngModelChange)="onScopeChange($event)">
        <mat-button-toggle value="platform">Plataforma</mat-button-toggle>
        <mat-button-toggle value="company">Empresa</mat-button-toggle>
        <mat-button-toggle value="student">Estudiante</mat-button-toggle>
        <mat-button-toggle value="supervisor">Docente</mat-button-toggle>
      </mat-button-toggle-group>

      <mat-form-field appearance="outline" class="full-width" style="margin-top: 16px;">
        <mat-label>Tipo de reporte</mat-label>
        <mat-select [(ngModel)]="reportType">
          @for (opt of reportTypesForScope(); track opt.value) {
            <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      @if (scope() !== 'platform') {
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ entityPickerLabel() }}</mat-label>
          <mat-select [(ngModel)]="entityId">
            @for (opt of entityOptions(); track opt.id) {
              <mat-option [value]="opt.id">{{ opt.label }}</mat-option>
            }
          </mat-select>
          @if (entityOptions().length === 0 && !entitiesLoading()) {
            <mat-hint>No hay {{ entityPickerLabel() | lowercase }} disponibles</mat-hint>
          }
        </mat-form-field>
        @if (entitiesLoading()) {
          <mat-spinner diameter="20" style="margin: 8px auto;" />
        }
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button [disabled]="!canSubmit()" (click)="submit()">
        Generar
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    '.full-width { width: 100%; display: block; margin-bottom: 12px; }',
    '.scope-label { font-size: 0.8125rem; color: var(--mat-sys-on-surface-variant); margin: 4px 0 8px; }',
    'mat-button-toggle-group { width: 100%; }',
    'mat-button-toggle { flex: 1; }',
  ],
})
export class GenerateReportDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<GenerateReportDialogComponent>);
  private readonly adminService = inject(AdminService);

  name = '';
  reportType: ReportType | '' = '';
  entityId = '';
  scope = signal<ReportScope>('platform');

  private readonly reportTypesByScope: Record<ReportScope, { value: ReportType; label: string }[]> = {
    platform: [
      { value: 'period_summary', label: 'Resumen de Período' },
      { value: 'skill_gap_analysis', label: 'Análisis de Brecha de Skills' },
      { value: 'matching_effectiveness', label: 'Efectividad del Matching' },
      { value: 'academic_process_summary', label: 'Resumen del Proceso Académico' },
      { value: 'supervisor_workload', label: 'Carga de Docentes (Plataforma)' },
      { value: 'project_completion_rates', label: 'Tasas de Completitud' },
      { value: 'custom', label: 'Personalizado' },
    ],
    company: [{ value: 'company_performance', label: 'Desempeño de la Empresa' }],
    student: [{ value: 'student_outcomes', label: 'Resultados del Estudiante' }],
    supervisor: [{ value: 'supervisor_report', label: 'Carga de Estudiantes Asignados' }],
  };

  reportTypesForScope(): { value: ReportType; label: string }[] {
    return this.reportTypesByScope[this.scope()];
  }

  entityPickerLabel(): string {
    const scope = this.scope();
    if (scope === 'company') return 'Empresa';
    if (scope === 'student') return 'Estudiante';
    if (scope === 'supervisor') return 'Docente';
    return '';
  }

  onScopeChange(value: ReportScope): void {
    this.scope.set(value);
    this.reportType = this.reportTypesForScope()[0]?.value ?? '';
    this.entityId = '';
  }

  // ─── Carga de entidades reales según el ámbito elegido (reutiliza endpoints ya existentes) ──

  private readonly companiesResource = httpResource<{ data: { userId: string; companyName: string }[] }>(() => {
    if (this.scope() !== 'company') return undefined;
    return { url: `${environment.apiUrl}/companies/admin/list`, params: { status: 'verified', limit: '100' } };
  });

  private readonly studentsResource = httpResource<{ data: { id: string; email: string }[] }>(() => {
    if (this.scope() !== 'student') return undefined;
    return { url: `${environment.apiUrl}/auth/admin/users`, params: { role: 'student', limit: '100' } };
  });

  private readonly supervisorsSignal = signal<EntityOption[]>([]);

  constructor() {
    this.adminService.getSupervisors(true).subscribe((rows) => {
      this.supervisorsSignal.set(rows.map((s) => ({ id: s.id, label: s.fullName ?? s.userId })));
    });
  }

  readonly entitiesLoading = computed(() => {
    if (this.scope() === 'company') return this.companiesResource.isLoading();
    if (this.scope() === 'student') return this.studentsResource.isLoading();
    return false;
  });

  entityOptions(): EntityOption[] {
    const scope = this.scope();
    if (scope === 'company') {
      return (this.companiesResource.value()?.data ?? []).map((c) => ({ id: c.userId, label: c.companyName }));
    }
    if (scope === 'student') {
      return (this.studentsResource.value()?.data ?? []).map((s) => ({ id: s.id, label: s.email }));
    }
    if (scope === 'supervisor') {
      return this.supervisorsSignal();
    }
    return [];
  }

  canSubmit(): boolean {
    if (!this.name || !this.reportType) return false;
    if (this.scope() !== 'platform' && !this.entityId) return false;
    return true;
  }

  submit(): void {
    if (!this.canSubmit()) return;
    const payload: GenerateReportPayload = {
      name: this.name,
      reportType: this.reportType as ReportType,
      ...(this.scope() !== 'platform' ? { entityId: this.entityId } : {}),
    };
    this.dialogRef.close(payload);
  }
}
