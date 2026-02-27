import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit, OnDestroy,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  FormBuilder, FormArray, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { COMMA, ENTER } from '@angular/cdk/keycodes';

import { ProjectService } from '../../services/project.service';
import { ProjectType, ProjectStatus } from '../../../../core/enums';
import { ProjectRequirement } from '../../../../core/models';

const DRAFT_KEY = 'collabu_project_draft';

@Component({
  selector: 'app-project-create',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatStepperModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatRadioModule, MatDatepickerModule, MatIconModule, MatButtonModule,
    MatChipsModule, MatSlideToggleModule, MatCardModule, MatSnackBarModule,
  ],
  template: `
    <div class="project-create">
      <h1>Crear Proyecto</h1>

      <mat-stepper linear #stepper>
        <!-- Step 1: General Info -->
        <mat-step [stepControl]="infoForm" label="Información General">
          <form [formGroup]="infoForm" class="project-create__form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Título del Proyecto</mat-label>
              <input matInput formControlName="title" placeholder="Ej: Desarrollo de App Móvil" />
              <mat-error>Título requerido (mín. 5 caracteres)</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Descripción</mat-label>
              <textarea matInput formControlName="description" rows="6"
                        placeholder="Describe las actividades, objetivos y alcance del proyecto..."></textarea>
              <mat-error>Descripción requerida (mín. 50 caracteres)</mat-error>
            </mat-form-field>

            <div class="project-create__row">
              <mat-form-field appearance="outline">
                <mat-label>Tipo de Proyecto</mat-label>
                <mat-select formControlName="projectType">
                  @for (type of projectTypes; track type.value) {
                    <mat-option [value]="type.value">{{ type.label }}</mat-option>
                  }
                </mat-select>
                <mat-error>Selecciona un tipo</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Posiciones Disponibles</mat-label>
                <input matInput type="number" formControlName="positionsAvailable" min="1" />
                <mat-error>Mín. 1 posición</mat-error>
              </mat-form-field>
            </div>

            <div class="project-create__row">
              <mat-slide-toggle formControlName="isRemote">Remoto</mat-slide-toggle>

              @if (!infoForm.value.isRemote) {
                <mat-form-field appearance="outline" class="flex-1">
                  <mat-label>Ubicación</mat-label>
                  <input matInput formControlName="location" />
                </mat-form-field>
              }
            </div>

            <div class="project-create__row">
              <mat-form-field appearance="outline">
                <mat-label>Fecha de Inicio</mat-label>
                <input matInput [matDatepicker]="startPicker" formControlName="startDate" />
                <mat-datepicker-toggle matIconSuffix [for]="startPicker" />
                <mat-datepicker #startPicker />
                <mat-error>Fecha requerida</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Fecha de Fin</mat-label>
                <input matInput [matDatepicker]="endPicker" formControlName="endDate" />
                <mat-datepicker-toggle matIconSuffix [for]="endPicker" />
                <mat-datepicker #endPicker />
                <mat-error>Fecha requerida</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Límite de Aplicaciones</mat-label>
                <input matInput [matDatepicker]="deadlinePicker" formControlName="applicationDeadline" />
                <mat-datepicker-toggle matIconSuffix [for]="deadlinePicker" />
                <mat-datepicker #deadlinePicker />
                <mat-error>Fecha requerida</mat-error>
              </mat-form-field>
            </div>

            <div class="project-create__row">
              <mat-form-field appearance="outline">
                <mat-label>Horas/Semana</mat-label>
                <input matInput type="number" formControlName="weeklyHours" min="1" />
                <mat-error>Requerido</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Total Horas Requeridas</mat-label>
                <input matInput type="number" formControlName="totalHoursRequired" min="1" />
                <mat-error>Requerido</mat-error>
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Nombre del Supervisor</mat-label>
              <input matInput formControlName="supervisorName" />
            </mat-form-field>

            <div class="project-create__step-actions">
              <button mat-flat-button matStepperNext [disabled]="infoForm.invalid">Siguiente</button>
            </div>
          </form>
        </mat-step>

        <!-- Step 2: Requirements -->
        <mat-step label="Requisitos">
          <div class="project-create__form">
            <h3>Requisitos del Proyecto</h3>

            @for (req of requirementsControls(); track $index) {
              <mat-card class="project-create__req-card">
                <mat-card-content>
                  <div class="project-create__row">
                    <mat-form-field appearance="outline" class="flex-1">
                      <mat-label>Nombre</mat-label>
                      <input matInput [value]="req.name"
                             (input)="updateRequirement($index, 'name', $any($event.target).value)" />
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Tipo</mat-label>
                      <mat-select [value]="req.type"
                                  (selectionChange)="updateRequirement($index, 'type', $event.value)">
                        <mat-option value="skill">Habilidad</mat-option>
                        <mat-option value="education">Educación</mat-option>
                        <mat-option value="experience">Experiencia</mat-option>
                        <mat-option value="language">Idioma</mat-option>
                        <mat-option value="other">Otro</mat-option>
                      </mat-select>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Nivel</mat-label>
                      <mat-select [value]="req.proficiencyLevel"
                                  (selectionChange)="updateRequirement($index, 'proficiencyLevel', $event.value)">
                        <mat-option value="basic">Básico</mat-option>
                        <mat-option value="intermediate">Intermedio</mat-option>
                        <mat-option value="advanced">Avanzado</mat-option>
                        <mat-option value="expert">Experto</mat-option>
                      </mat-select>
                    </mat-form-field>
                  </div>

                  <div class="project-create__row">
                    <mat-slide-toggle
                      [checked]="req.isMandatory"
                      (change)="updateRequirement($index, 'isMandatory', $event.checked)">
                      Obligatorio
                    </mat-slide-toggle>
                    <button mat-icon-button color="warn" (click)="removeRequirement($index)">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                </mat-card-content>
              </mat-card>
            }

            <button mat-stroked-button (click)="addRequirement()">
              <mat-icon>add</mat-icon> Agregar Requisito
            </button>

            <h3 style="margin-top: 24px">Tags</h3>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Tags del Proyecto</mat-label>
              <mat-chip-grid #chipGrid>
                @for (tag of tags(); track tag) {
                  <mat-chip-row (removed)="removeTag(tag)">
                    {{ tag }}
                    <button matChipRemove><mat-icon>cancel</mat-icon></button>
                  </mat-chip-row>
                }
              </mat-chip-grid>
              <input matInput placeholder="Agregar tag..."
                     [matChipInputFor]="chipGrid"
                     [matChipInputSeparatorKeyCodes]="separatorKeyCodes"
                     (matChipInputTokenEnd)="addTag($event)" />
            </mat-form-field>

            <div class="project-create__step-actions">
              <button mat-stroked-button matStepperPrevious>Anterior</button>
              <button mat-flat-button matStepperNext>Siguiente</button>
            </div>
          </div>
        </mat-step>

        <!-- Step 3: Review -->
        <mat-step label="Revisión">
          <div class="project-create__form">
            <h3>Vista Previa</h3>

            <mat-card class="project-create__preview">
              <mat-card-content>
                <h2>{{ infoForm.value.title || 'Sin título' }}</h2>
                <p class="project-create__preview-meta">
                  <span>{{ getProjectTypeLabel(infoForm.value.projectType) }}</span>
                  <span>{{ infoForm.value.isRemote ? 'Remoto' : infoForm.value.location }}</span>
                  <span>{{ infoForm.value.positionsAvailable }} posiciones</span>
                  <span>{{ infoForm.value.weeklyHours }}h/semana</span>
                </p>

                <h4>Descripción</h4>
                <p class="project-create__preview-desc">{{ infoForm.value.description }}</p>

                @if (requirementsControls().length > 0) {
                  <h4>Requisitos ({{ requirementsControls().length }})</h4>
                  <ul>
                    @for (req of requirementsControls(); track $index) {
                      <li>
                        <strong>{{ req.name }}</strong> — {{ req.type }}
                        @if (req.proficiencyLevel) { ({{ req.proficiencyLevel }}) }
                        @if (req.isMandatory) { <em>*obligatorio</em> }
                      </li>
                    }
                  </ul>
                }

                @if (tags().length > 0) {
                  <h4>Tags</h4>
                  <div class="project-create__preview-tags">
                    @for (tag of tags(); track tag) {
                      <span class="tag-chip">{{ tag }}</span>
                    }
                  </div>
                }
              </mat-card-content>
            </mat-card>

            <div class="project-create__step-actions">
              <button mat-stroked-button matStepperPrevious>Anterior</button>
              <button mat-stroked-button (click)="saveDraft()" [disabled]="submitting()">
                Guardar Borrador
              </button>
              <button mat-flat-button (click)="publish()" [disabled]="infoForm.invalid || submitting()">
                Publicar
              </button>
            </div>
          </div>
        </mat-step>
      </mat-stepper>
    </div>
  `,
  styles: `
    :host {
      display: block;
      padding: 24px;
      max-width: 960px;
      margin: 0 auto;
    }

    h1 {
      font-size: 1.75rem;
      font-weight: 700;
      margin: 0 0 24px;
      color: var(--mat-sys-on-surface);
    }

    .project-create__form {
      padding: 16px 0;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .project-create__row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 16px;

      mat-form-field {
        flex: 1;
        min-width: 180px;
      }
    }

    .flex-1 { flex: 1; }
    .full-width { width: 100%; }

    .project-create__step-actions {
      display: flex;
      gap: 12px;
      margin-top: 16px;
      justify-content: flex-end;
    }

    .project-create__req-card {
      margin-bottom: 8px;
    }

    .project-create__preview {
      margin-bottom: 16px;

      h2 {
        margin: 0 0 8px;
        font-size: 1.25rem;
        font-weight: 700;
      }

      h4 {
        margin: 16px 0 8px;
        font-weight: 600;
      }
    }

    .project-create__preview-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 16px;
      color: var(--mat-sys-on-surface-variant);
      font-size: 0.875rem;

      span::before {
        content: '•';
        margin-right: 8px;
      }

      span:first-child::before {
        content: '';
        margin: 0;
      }
    }

    .project-create__preview-desc {
      white-space: pre-line;
      color: var(--mat-sys-on-surface-variant);
      font-size: 0.875rem;
    }

    .project-create__preview-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .tag-chip {
      display: inline-block;
      padding: 4px 12px;
      background: color-mix(in srgb, var(--mat-sys-primary) 12%, transparent);
      color: var(--mat-sys-primary);
      border-radius: 16px;
      font-size: 0.8125rem;
    }
  `,
})
export class ProjectCreateComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly projectService = inject(ProjectService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly separatorKeyCodes = [ENTER, COMMA] as const;
  readonly submitting = signal(false);
  readonly tags = signal<string[]>([]);
  readonly requirements = signal<Partial<ProjectRequirement>[]>([]);
  readonly requirementsControls = this.requirements;

  private autoSaveTimer: ReturnType<typeof setInterval> | null = null;

  readonly projectTypes = [
    { value: ProjectType.PROFESSIONAL_PRACTICE, label: 'Práctica Profesional' },
    { value: ProjectType.SOCIAL_SERVICE, label: 'Servicio Social' },
    { value: ProjectType.RESEARCH, label: 'Investigación' },
    { value: ProjectType.INTERNSHIP, label: 'Pasantía' },
  ];

  readonly infoForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(5)]],
    description: ['', [Validators.required, Validators.minLength(50)]],
    projectType: ['' as string as ProjectType, Validators.required],
    positionsAvailable: [1, [Validators.required, Validators.min(1)]],
    isRemote: [false],
    location: [''],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    applicationDeadline: ['', Validators.required],
    weeklyHours: [20, [Validators.required, Validators.min(1)]],
    totalHoursRequired: [480, [Validators.required, Validators.min(1)]],
    supervisorName: [''],
  });

  ngOnInit(): void {
    this.loadDraft();
    this.autoSaveTimer = setInterval(() => this.saveToLocalStorage(), 30000);
  }

  ngOnDestroy(): void {
    if (this.autoSaveTimer) clearInterval(this.autoSaveTimer);
  }

  getProjectTypeLabel(value?: string): string {
    return this.projectTypes.find((t) => t.value === value)?.label ?? '';
  }

  addRequirement(): void {
    this.requirements.update((reqs) => [
      ...reqs,
      { name: '', type: 'skill' as const, isMandatory: false, proficiencyLevel: 'basic' as const },
    ]);
  }

  removeRequirement(index: number): void {
    this.requirements.update((reqs) => reqs.filter((_, i) => i !== index));
  }

  updateRequirement(index: number, field: string, value: any): void {
    this.requirements.update((reqs) =>
      reqs.map((r, i) => (i === index ? { ...r, [field]: value } : r)),
    );
  }

  addTag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value && !this.tags().includes(value)) {
      this.tags.update((t) => [...t, value]);
    }
    event.chipInput.clear();
  }

  removeTag(tag: string): void {
    this.tags.update((t) => t.filter((v) => v !== tag));
  }

  saveDraft(): void {
    this.submit(ProjectStatus.DRAFT);
  }

  publish(): void {
    this.submit(ProjectStatus.PUBLISHED);
  }

  private submit(status: ProjectStatus): void {
    if (this.submitting()) return;
    this.submitting.set(true);

    const formValue = this.infoForm.getRawValue();
    const data = {
      ...formValue,
      status,
      requirements: this.requirements() as any[],
      tags: this.tags(),
    };

    this.projectService.create(data).subscribe({
      next: () => {
        localStorage.removeItem(DRAFT_KEY);
        this.snackBar.open(
          status === ProjectStatus.PUBLISHED ? 'Proyecto publicado' : 'Borrador guardado',
          'OK', { duration: 3000 },
        );
        this.router.navigate(['/my-projects']);
      },
      error: () => {
        this.submitting.set(false);
        this.snackBar.open('Error al guardar', 'Cerrar', { duration: 4000 });
      },
    });
  }

  private saveToLocalStorage(): void {
    const draft = {
      info: this.infoForm.getRawValue(),
      requirements: this.requirements(),
      tags: this.tags(),
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }

  private loadDraft(): void {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;

    try {
      const draft = JSON.parse(raw);
      if (draft.info) this.infoForm.patchValue(draft.info);
      if (draft.requirements) this.requirements.set(draft.requirements);
      if (draft.tags) this.tags.set(draft.tags);
      this.snackBar.open('Borrador restaurado', 'OK', { duration: 3000 });
    } catch {
      localStorage.removeItem(DRAFT_KEY);
    }
  }
}
