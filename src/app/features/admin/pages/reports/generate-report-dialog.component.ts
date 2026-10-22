import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { LowerCasePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../../environments/environment';
import { GenerateReportPayload, ReportType, ReportScope } from '../../../../core/models';
import { AdminService } from '../../services/admin.service';
import { DepartmentFilterComponent } from '../../../../shared/components/department-filter/department-filter.component';

interface EntityOption {
  id: string;
  label: string;
}

interface ReportTypeInfo {
  value: ReportType;
  label: string;
  /** Qué mide y para qué sirve, en una frase. */
  description: string;
  /** Secciones que tendrá el PDF generado. */
  includes: string[];
}

interface ScopeInfo {
  value: ReportScope;
  label: string;
  icon: string;
  description: string;
}

const SCOPES: ScopeInfo[] = [
  {
    value: 'platform',
    label: 'Toda la plataforma',
    icon: 'public',
    description: 'Cifras globales de Collab-U: usuarios, proyectos, postulaciones, habilidades y proceso académico.',
  },
  {
    value: 'company',
    label: 'Una empresa',
    icon: 'business',
    description: 'Informe individual de una empresa aliada: sus proyectos, postulaciones y evaluaciones.',
  },
  {
    value: 'student',
    label: 'Un estudiante',
    icon: 'school',
    description: 'Informe individual de un estudiante: postulaciones, resultados y evaluaciones recibidas.',
  },
  {
    value: 'supervisor',
    label: 'Un docente',
    icon: 'supervisor_account',
    description: 'Informe individual de un docente: estudiantes y proyectos que asesora o evalúa como jurado.',
  },
];

const REPORT_TYPES: Record<ReportScope, ReportTypeInfo[]> = {
  platform: [
    {
      value: 'period_summary',
      label: 'Resumen de período',
      description: 'Fotografía general de la plataforma y su evolución en el tiempo. Ideal para informes institucionales.',
      includes: ['Usuarios, empresas, proyectos y postulaciones', 'Evolución histórica en gráficos de línea', 'Habilidades más demandadas vs. ofrecidas', 'Hallazgos automáticos'],
    },
    {
      value: 'skill_gap_analysis',
      label: 'Análisis de brecha de habilidades',
      description: 'Compara lo que piden las empresas con lo que ofrecen los estudiantes para orientar la formación.',
      includes: ['Demanda vs. oferta por habilidad', 'Mayores déficits y superávits', 'Tendencia (en alza, estable, a la baja)', 'Tabla detallada y recomendaciones'],
    },
    {
      value: 'matching_effectiveness',
      label: 'Efectividad del matching',
      description: 'Mide qué tan bien el sistema empareja estudiantes con proyectos y cuánto tardan en cubrirse las vacantes.',
      includes: ['Puntaje promedio de compatibilidad', 'Evolución del puntaje y del tiempo de cobertura', 'Lectura del nivel de calidad'],
    },
    {
      value: 'academic_process_summary',
      label: 'Resumen del proceso académico',
      description: 'Estado de los expedientes de práctica, tiempos y asignaciones de asesores y jurados.',
      includes: ['Expedientes por etapa', 'Duración y rondas de corrección del anteproyecto', 'Asignaciones por rol y carga por docente'],
    },
    {
      value: 'supervisor_workload',
      label: 'Carga de docentes',
      description: 'Cuántos estudiantes atiende cada docente, para equilibrar nuevas asignaciones.',
      includes: ['Carga activa por docente (gráfico y tabla)', 'Asignaciones por rol', 'Tiempo promedio de aceptación'],
    },
    {
      value: 'project_completion_rates',
      label: 'Tasas de completitud',
      description: 'Porcentaje de prácticas que terminan con éxito, su duración y el estado de cada expediente.',
      includes: ['Tasa de completitud', 'Expedientes por estado', 'Duración promedio y correcciones'],
    },
    {
      value: 'custom',
      label: 'Personalizado',
      description: 'Reporte básico con los parámetros que indiques. Úsalo solo si ningún tipo anterior te sirve.',
      includes: ['Parámetros indicados'],
    },
  ],
  company: [
    {
      value: 'company_performance',
      label: 'Desempeño de la empresa',
      description: 'Cómo le ha ido a la empresa en la plataforma: proyectos, postulaciones y valoración de los estudiantes.',
      includes: ['Proyectos por estado', 'Embudo de postulaciones (recibidas, aceptadas, rechazadas)', 'Tasa de conversión y evaluación promedio', 'Hallazgos automáticos'],
    },
  ],
  student: [
    {
      value: 'student_outcomes',
      label: 'Resultados del estudiante',
      description: 'Trayectoria del estudiante: habilidades, postulaciones, resultados y evaluaciones.',
      includes: ['Resultado de sus postulaciones', 'Tasa de colocación y tiempos de respuesta', 'Evaluación promedio recibida', 'Recomendaciones para su perfil'],
    },
  ],
  supervisor: [
    {
      value: 'supervisor_report',
      label: 'Estudiantes asignados',
      description: 'Estudiantes y proyectos que el docente acompaña, con su rol y el estado de cada asignación.',
      includes: ['Participación por rol (asesor o jurado)', 'Estado de las asignaciones', 'Listado de estudiantes y proyectos'],
    },
  ],
};

@Component({
  selector: 'app-generate-report-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, FormsModule,
    LowerCasePipe, DepartmentFilterComponent,
  ],
  template: `
    <h2 mat-dialog-title class="grd__title">
      <mat-icon>assessment</mat-icon>
      Generar reporte
    </h2>

    <mat-dialog-content class="grd">
      <p class="grd__intro">
        Los reportes consolidan los datos de Collab-U en un documento <strong>PDF</strong> con resumen,
        indicadores, gráficos y hallazgos, listo para compartir o archivar. Sigue estos tres pasos.
      </p>

      <section class="grd__step">
        <h3><span class="grd__num">1</span> ¿Sobre qué quieres el reporte?</h3>
        <div class="grd__scopes" role="radiogroup" aria-label="Ámbito del reporte">
          @for (s of scopes; track s.value) {
            <button
              type="button"
              class="grd__scope"
              role="radio"
              [attr.aria-checked]="scope() === s.value"
              [class.grd__scope--active]="scope() === s.value"
              (click)="onScopeChange(s.value)"
            >
              <mat-icon>{{ s.icon }}</mat-icon>
              <span class="grd__scope-label">{{ s.label }}</span>
              <span class="grd__scope-desc">{{ s.description }}</span>
            </button>
          }
        </div>
      </section>

      <section class="grd__step">
        <h3><span class="grd__num">2</span> ¿Qué tipo de reporte?</h3>
        <mat-form-field appearance="outline" class="grd__full">
          <mat-label>Tipo de reporte</mat-label>
          <mat-select [ngModel]="reportType()" (ngModelChange)="onTypeChange($event)">
            @for (opt of reportTypesForScope(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        @if (selectedInfo(); as info) {
          <div class="grd__info">
            <p>{{ info.description }}</p>
            <span class="grd__info-title">El PDF incluirá:</span>
            <ul>
              @for (inc of info.includes; track inc) {
                <li>{{ inc }}</li>
              }
            </ul>
          </div>
        }

        @if (scope() !== 'platform') {
          <mat-form-field appearance="outline" class="grd__full">
            <mat-label>{{ entityPickerLabel() }}</mat-label>
            <mat-select [(ngModel)]="entityId" (ngModelChange)="onEntityChange()">
              @for (opt of entityOptions(); track opt.id) {
                <mat-option [value]="opt.id">{{ opt.label }}</mat-option>
              }
            </mat-select>
            @if (entityOptions().length === 0 && !entitiesLoading()) {
              <mat-hint>No hay {{ entityPickerLabel() | lowercase }} disponibles</mat-hint>
            }
          </mat-form-field>
          @if (entitiesLoading()) {
            <mat-spinner diameter="20" class="grd__spinner" />
          }
        }
      </section>

      @if (scope() === 'platform') {
        <section class="grd__step">
          <h3><span class="grd__num">+</span> Departamento (opcional)</h3>
          <app-department-filter label="Acotar el reporte a" [value]="programId()" (changed)="programId.set($event)" />
        </section>
      }

      <section class="grd__step">
        <h3><span class="grd__num">3</span> Ponle un nombre</h3>
        <mat-form-field appearance="outline" class="grd__full">
          <mat-label>Nombre del reporte</mat-label>
          <input matInput [ngModel]="name()" (ngModelChange)="onNameInput($event)" placeholder="Ej: Resumen semestre 2026-2" />
          <mat-hint>Así lo verás en la lista de reportes. Puedes dejar el nombre sugerido.</mat-hint>
        </mat-form-field>
      </section>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button [disabled]="!canSubmit()" (click)="submit()">
        <mat-icon>picture_as_pdf</mat-icon>
        Generar reporte
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .grd__title { display: flex; align-items: center; gap: 8px; }
    .grd { display: block; max-height: 70vh; }
    .grd__intro { margin: 0 0 16px; font-size: 0.875rem; line-height: 1.5; color: var(--mat-sys-on-surface-variant); }
    .grd__step { margin-bottom: 8px; }
    .grd__step h3 { display: flex; align-items: center; gap: 8px; margin: 12px 0 10px; font-size: 0.95rem; font-weight: 600; }
    .grd__num {
      display: inline-flex; align-items: center; justify-content: center;
      width: 22px; height: 22px; border-radius: 50%;
      background: var(--mat-sys-primary); color: var(--mat-sys-on-primary); font-size: 0.75rem;
    }
    .grd__scopes { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
    .grd__scope {
      display: flex; flex-direction: column; align-items: flex-start; gap: 4px; text-align: left;
      padding: 12px; border-radius: 12px; cursor: pointer; font: inherit;
      background: transparent; color: inherit;
      border: 1px solid var(--mat-sys-outline-variant);
      transition: border-color 0.15s, background 0.15s;
    }
    .grd__scope:hover { border-color: var(--mat-sys-primary); }
    .grd__scope--active { border: 2px solid var(--mat-sys-primary); background: var(--mat-sys-primary-container); padding: 11px; }
    .grd__scope mat-icon { color: var(--mat-sys-primary); }
    .grd__scope-label { font-weight: 600; font-size: 0.875rem; }
    .grd__scope-desc { font-size: 0.75rem; line-height: 1.35; color: var(--mat-sys-on-surface-variant); }
    .grd__full { width: 100%; display: block; }
    .grd__info {
      margin: 0 0 16px; padding: 12px 14px; border-radius: 12px;
      background: var(--mat-sys-surface-container); font-size: 0.8125rem; line-height: 1.45;
    }
    .grd__info p { margin: 0 0 8px; }
    .grd__info-title { font-weight: 600; }
    .grd__info ul { margin: 4px 0 0; padding-left: 18px; }
    .grd__spinner { margin: 8px auto; }
    @media (max-width: 560px) { .grd__scopes { grid-template-columns: 1fr; } }
  `],
})
export class GenerateReportDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<GenerateReportDialogComponent>);
  private readonly adminService = inject(AdminService);

  readonly scopes = SCOPES;
  readonly scope = signal<ReportScope>('platform');
  readonly reportType = signal<ReportType | ''>('period_summary');
  readonly name = signal('');
  /** Solo superadmin: acota un reporte de plataforma a un departamento ('' = Facultad completa). */
  readonly programId = signal('');
  entityId = '';
  private nameTouched = false;

  readonly selectedInfo = computed<ReportTypeInfo | null>(
    () => REPORT_TYPES[this.scope()].find((t) => t.value === this.reportType()) ?? null,
  );

  reportTypesForScope(): ReportTypeInfo[] {
    return REPORT_TYPES[this.scope()];
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
    this.reportType.set(REPORT_TYPES[value][0]?.value ?? '');
    this.entityId = '';
    this.suggestName();
  }

  onTypeChange(value: ReportType): void {
    this.reportType.set(value);
    this.suggestName();
  }

  onEntityChange(): void {
    this.suggestName();
  }

  onNameInput(value: string): void {
    this.nameTouched = true;
    this.name.set(value);
  }

  /** Nombre sugerido: "<Tipo> — <entidad> — <fecha>"; se deja de sugerir si el usuario lo edita. */
  private suggestName(): void {
    if (this.nameTouched) return;
    const label = this.selectedInfo()?.label ?? 'Reporte';
    const entity = this.entityOptions().find((e) => e.id === this.entityId)?.label;
    const date = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
    this.name.set(entity ? `${label} — ${entity} — ${date}` : `${label} — ${date}`);
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
    this.suggestName();
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
    if (!this.name().trim() || !this.reportType()) return false;
    if (this.scope() !== 'platform' && !this.entityId) return false;
    return true;
  }

  submit(): void {
    if (!this.canSubmit()) return;
    const payload: GenerateReportPayload = {
      name: this.name().trim(),
      reportType: this.reportType() as ReportType,
      ...(this.scope() !== 'platform' ? { entityId: this.entityId } : {}),
      ...(this.scope() === 'platform' && this.programId() ? { programId: this.programId() } : {}),
    };
    this.dialogRef.close(payload);
  }
}
