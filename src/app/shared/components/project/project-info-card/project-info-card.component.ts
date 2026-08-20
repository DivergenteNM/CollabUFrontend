import { Component, ChangeDetectionStrategy, inject, input, computed, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Project, AcademicProgram } from '../../../../core/models';
import { AdminService } from '../../../../features/admin/services/admin.service';
import { SkillChipListComponent } from '../../ui/skill-chip-list/skill-chip-list.component';
import { FileLinkComponent } from '../../ui/file-link/file-link.component';

const TYPE_LABELS: Record<string, string> = {
  internship: 'Pasantía',
  professional_practice: 'Práctica Profesional',
  thesis: 'Tesis / Trabajo de Grado',
  research: 'Investigación',
  other: 'Otro',
};

const MODALITY_LABELS: Record<string, string> = {
  remote: 'Remoto',
  onsite: 'Presencial',
  hybrid: 'Híbrido',
};

const COMPENSATION_LABELS: Record<string, string> = {
  paid: 'Remunerado',
  stipend: 'Con auxilio',
  academic_credit: 'Créditos académicos',
  unpaid: 'No remunerado',
};

/**
 * Muestra la información propia del proyecto (título, descripción, modalidad,
 * duración, programas académicos, skills, documento de solicitud) dentro de
 * un workspace. El workspace solo tenía datos del *proceso* (postulación,
 * estado, acciones) — esta tarjeta expone lo que el proyecto ya tiene
 * definido desde su creación y que en ningún lado se estaba mostrando.
 */
@Component({
  selector: 'app-project-info-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, MatCardModule, MatIconModule, MatButtonModule, SkillChipListComponent, FileLinkComponent],
  template: `
    <mat-card class="pic">
      <mat-card-header>
        <mat-card-title class="pic__title"><mat-icon>work</mat-icon> Información del proyecto</mat-card-title>
      </mat-card-header>

      <mat-card-content>
        @if (project(); as p) {
          <div class="pic__badges">
            <span class="pic__badge">{{ typeLabel() }}</span>
            @if (p.locationType) {
              <span class="pic__badge">{{ modalityLabel() }}</span>
            }
          </div>

          <div class="pic__meta">
            @if (p.location) {
              <span class="pic__meta-item"><mat-icon>location_on</mat-icon> {{ p.location }}</span>
            }
            @if (p.durationMonths) {
              <span class="pic__meta-item"><mat-icon>date_range</mat-icon> {{ p.durationMonths }} {{ p.durationMonths === 1 ? 'mes' : 'meses' }}</span>
            }
            @if (p.weeklyHours) {
              <span class="pic__meta-item"><mat-icon>schedule</mat-icon> {{ p.weeklyHours }}h/semana</span>
            }
            @if (p.totalHours) {
              <span class="pic__meta-item"><mat-icon>hourglass_bottom</mat-icon> {{ p.totalHours }}h total</span>
            }
            @if (p.minimumSemester) {
              <span class="pic__meta-item"><mat-icon>school</mat-icon> Desde semestre {{ p.minimumSemester }}</span>
            }
            @if (compensationLabel(); as comp) {
              <span class="pic__meta-item"><mat-icon>payments</mat-icon> {{ comp }}</span>
            }
            @if (p.startDate) {
              <span class="pic__meta-item">
                <mat-icon>event</mat-icon> {{ p.startDate | date:'d MMM yyyy' }}
                @if (p.endDate) { — {{ p.endDate | date:'d MMM yyyy' }} }
              </span>
            }
          </div>

          @if (programNames().length > 0) {
            <div class="pic__section">
              <h4 class="pic__section-title">Programas académicos</h4>
              <div class="pic__chips">
                @for (name of programNames(); track name) {
                  <span class="pic__chip pic__chip--program">{{ name }}</span>
                }
              </div>
            </div>
          }

          @if (skillNames().length > 0) {
            <div class="pic__section">
              <h4 class="pic__section-title">Habilidades</h4>
              <app-skill-chip-list [skills]="skillNames()" [maxVisible]="10" />
            </div>
          }

          @if (p.description) {
            <div class="pic__section">
              <h4 class="pic__section-title">Descripción</h4>
              <p class="pic__description" [class.pic__description--clamped]="!expanded()">{{ p.description }}</p>
              @if (p.description.length > 220) {
                <button mat-button class="pic__toggle" (click)="expanded.set(!expanded())">
                  {{ expanded() ? 'Ver menos' : 'Ver más' }}
                </button>
              }
            </div>
          }

          @if (p.requestDocumentFileId) {
            <div class="pic__section">
              <h4 class="pic__section-title">Documento de solicitud</h4>
              <app-file-link [fileId]="p.requestDocumentFileId" downloadName="documento-solicitud.pdf" />
            </div>
          }
        } @else {
          <p class="pic__empty">Sin información adicional del proyecto.</p>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .pic__title { display: flex; align-items: center; gap: 8px; font-size: 1rem; }
    .pic__badges { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
    .pic__badge {
      background: color-mix(in srgb, var(--mat-sys-primary, #1565c0) 12%, transparent);
      color: var(--mat-sys-primary, #1565c0);
      font-size: .75rem; font-weight: 600;
      padding: 3px 10px; border-radius: 12px;
    }
    .pic__meta { display: flex; flex-direction: column; gap: 6px; margin-bottom: 4px; }
    .pic__meta-item {
      display: flex; align-items: center; gap: 6px;
      font-size: .8125rem; color: var(--text-secondary);
      mat-icon { font-size: 16px; width: 16px; height: 16px; flex-shrink: 0; }
    }
    .pic__section { margin-top: 14px; }
    .pic__section-title {
      margin: 0 0 6px; font-size: .7rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: .04em;
      color: var(--text-secondary);
    }
    .pic__chips { display: flex; flex-wrap: wrap; gap: 6px; }
    .pic__chip {
      font-size: .75rem; padding: 3px 10px; border-radius: 12px;
      background: var(--bg-tertiary, #f0f0f0);
    }
    .pic__chip--program {
      background: color-mix(in srgb, var(--mat-sys-tertiary, #7c4dff) 12%, transparent);
      color: var(--mat-sys-tertiary, #7c4dff);
    }
    .pic__description {
      font-size: .8125rem; color: var(--text-secondary); line-height: 1.5;
      margin: 0; white-space: pre-line;
    }
    .pic__description--clamped {
      display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .pic__toggle { font-size: .75rem; padding: 0; min-width: 0; margin-top: 2px; }
    .pic__empty { color: var(--text-secondary); font-size: .8125rem; font-style: italic; margin: 0; }
  `],
})
export class ProjectInfoCardComponent {
  readonly project = input<Project | null>(null);

  private readonly adminService = inject(AdminService);
  private readonly programs = signal<AcademicProgram[]>([]);
  readonly expanded = signal(false);

  constructor() {
    this.adminService.getPrograms(true).subscribe({
      next: (programs) => this.programs.set(programs),
      error: () => {},
    });
  }

  readonly typeLabel = computed(() => TYPE_LABELS[this.project()?.projectType ?? ''] ?? this.project()?.projectType ?? '');
  readonly modalityLabel = computed(() => {
    const type = this.project()?.locationType;
    return type ? (MODALITY_LABELS[type] ?? type) : '';
  });
  readonly compensationLabel = computed(() => {
    const type = this.project()?.compensationType;
    return type ? (COMPENSATION_LABELS[type] ?? type) : null;
  });

  readonly programNames = computed(() => {
    const ids = this.project()?.academicPrograms ?? [];
    const catalog = this.programs();
    return ids.map((id) => catalog.find((p) => p.id === id)?.name ?? id);
  });

  readonly skillNames = computed(() => {
    const skills = this.project()?.skills ?? [];
    return skills.map((s) => s.name);
  });
}
