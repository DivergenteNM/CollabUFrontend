import {
  Component, ChangeDetectionStrategy, inject, input, signal, effect,
} from '@angular/core';
import { Router } from '@angular/router';
import { httpResource } from '@angular/common/http';
import {
  FormBuilder, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { COMMA, ENTER } from '@angular/cdk/keycodes';

import { environment } from '../../../../../environments/environment';
import { ProjectService } from '../../services/project.service';
import { ProjectType, ProjectStatus } from '../../../../core/enums';
import { ApiResponse, Project, ProjectRequirement } from '../../../../core/models';

@Component({
  selector: 'app-project-edit',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatStepperModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatIconModule, MatButtonModule,
    MatChipsModule, MatSlideToggleModule, MatCardModule, MatSnackBarModule, MatProgressBarModule,
  ],
  template: `
    <div class="project-edit">
      <h1>Editar Proyecto</h1>

      @if (projectResource.isLoading()) {
        <mat-progress-bar mode="indeterminate" />
      } @else if (projectResource.value(); as response) {
        <mat-stepper linear #stepper>
          <!-- Step 1: General Info -->
          <mat-step [stepControl]="infoForm" label="Información General">
            <form [formGroup]="infoForm" class="project-edit__form">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Título</mat-label>
                <input matInput formControlName="title" />
                <mat-error>Mín. 5 caracteres</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Descripción</mat-label>
                <textarea matInput formControlName="description" rows="6"></textarea>
                <mat-error>Mín. 50 caracteres</mat-error>
              </mat-form-field>

              <div class="project-edit__row">
                <mat-form-field appearance="outline">
                  <mat-label>Tipo</mat-label>
                  <mat-select formControlName="projectType">
                    @for (type of projectTypes; track type.value) {
                      <mat-option [value]="type.value">{{ type.label }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Posiciones</mat-label>
                  <input matInput type="number" formControlName="positionsAvailable" min="1" />
                </mat-form-field>
              </div>

              <div class="project-edit__row">
                <mat-slide-toggle formControlName="isRemote">Remoto</mat-slide-toggle>
                @if (!infoForm.value.isRemote) {
                  <mat-form-field appearance="outline" class="flex-1">
                    <mat-label>Ubicación</mat-label>
                    <input matInput formControlName="location" />
                  </mat-form-field>
                }
              </div>

              <div class="project-edit__row">
                <mat-form-field appearance="outline">
                  <mat-label>Inicio</mat-label>
                  <input matInput [matDatepicker]="sp" formControlName="startDate" />
                  <mat-datepicker-toggle matIconSuffix [for]="sp" />
                  <mat-datepicker #sp />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Fin</mat-label>
                  <input matInput [matDatepicker]="ep" formControlName="endDate" />
                  <mat-datepicker-toggle matIconSuffix [for]="ep" />
                  <mat-datepicker #ep />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Límite Apps</mat-label>
                  <input matInput [matDatepicker]="dp" formControlName="applicationDeadline" />
                  <mat-datepicker-toggle matIconSuffix [for]="dp" />
                  <mat-datepicker #dp />
                </mat-form-field>
              </div>

              <div class="project-edit__row">
                <mat-form-field appearance="outline">
                  <mat-label>Horas/Semana</mat-label>
                  <input matInput type="number" formControlName="weeklyHours" min="1" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Total Horas</mat-label>
                  <input matInput type="number" formControlName="totalHoursRequired" min="1" />
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Supervisor</mat-label>
                <input matInput formControlName="supervisorName" />
              </mat-form-field>

              <div class="project-edit__actions">
                <button mat-flat-button matStepperNext [disabled]="infoForm.invalid">Siguiente</button>
              </div>
            </form>
          </mat-step>

          <!-- Step 2: Requirements -->
          <mat-step label="Requisitos">
            <div class="project-edit__form">
              <h3>Requisitos</h3>
              @for (req of requirements(); track $index) {
                <mat-card class="project-edit__req-card">
                  <mat-card-content>
                    <div class="project-edit__row">
                      <mat-form-field appearance="outline" class="flex-1">
                        <mat-label>Nombre</mat-label>
                        <input matInput [value]="req.name"
                               (input)="updateReq($index, 'name', $any($event.target).value)" />
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>Tipo</mat-label>
                        <mat-select [value]="req.type"
                                    (selectionChange)="updateReq($index, 'type', $event.value)">
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
                                    (selectionChange)="updateReq($index, 'proficiencyLevel', $event.value)">
                          <mat-option value="basic">Básico</mat-option>
                          <mat-option value="intermediate">Intermedio</mat-option>
                          <mat-option value="advanced">Avanzado</mat-option>
                          <mat-option value="expert">Experto</mat-option>
                        </mat-select>
                      </mat-form-field>
                    </div>
                    <div class="project-edit__row">
                      <mat-slide-toggle [checked]="req.isMandatory"
                                        (change)="updateReq($index, 'isMandatory', $event.checked)">
                        Obligatorio
                      </mat-slide-toggle>
                      <button mat-icon-button color="warn" (click)="removeReq($index)">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </div>
                  </mat-card-content>
                </mat-card>
              }
              <button mat-stroked-button (click)="addReq()">
                <mat-icon>add</mat-icon> Agregar Requisito
              </button>

              <h3 style="margin-top: 24px">Tags</h3>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Tags</mat-label>
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

              <div class="project-edit__actions">
                <button mat-stroked-button matStepperPrevious>Anterior</button>
                <button mat-flat-button matStepperNext>Siguiente</button>
              </div>
            </div>
          </mat-step>

          <!-- Step 3: Review -->
          <mat-step label="Revisión">
            <div class="project-edit__form">
              <h3>Vista Previa</h3>
              <mat-card>
                <mat-card-content>
                  <h2>{{ infoForm.value.title }}</h2>
                  <p class="meta">
                    {{ getTypeLabel(infoForm.value.projectType) }} •
                    {{ infoForm.value.isRemote ? 'Remoto' : infoForm.value.location }} •
                    {{ infoForm.value.positionsAvailable }} pos. •
                    {{ infoForm.value.weeklyHours }}h/sem
                  </p>
                  <p style="white-space: pre-line; font-size: 0.875rem; color: var(--mat-sys-on-surface-variant)">
                    {{ infoForm.value.description }}
                  </p>
                  @if (requirements().length) {
                    <h4>Requisitos ({{ requirements().length }})</h4>
                    <ul>
                      @for (r of requirements(); track $index) {
                        <li>{{ r.name }} — {{ r.type }} @if (r.isMandatory) { *obligatorio }</li>
                      }
                    </ul>
                  }
                </mat-card-content>
              </mat-card>

              <div class="project-edit__actions">
                <button mat-stroked-button matStepperPrevious>Anterior</button>
                <button mat-flat-button (click)="save()" [disabled]="infoForm.invalid || submitting()">
                  Guardar Cambios
                </button>
              </div>
            </div>
          </mat-step>
        </mat-stepper>
      }
    </div>
  `,
  styles: `
    :host { display: block; padding: 24px; max-width: 960px; margin: 0 auto; }
    h1 { font-size: 1.75rem; font-weight: 700; margin: 0 0 24px; color: var(--mat-sys-on-surface); }
    .project-edit__form { padding: 16px 0; display: flex; flex-direction: column; gap: 12px; }
    .project-edit__row {
      display: flex; flex-wrap: wrap; align-items: center; gap: 16px;
      mat-form-field { flex: 1; min-width: 180px; }
    }
    .flex-1 { flex: 1; }
    .full-width { width: 100%; }
    .project-edit__actions { display: flex; gap: 12px; margin-top: 16px; justify-content: flex-end; }
    .project-edit__req-card { margin-bottom: 8px; }
    .meta { color: var(--mat-sys-on-surface-variant); font-size: 0.875rem; }
  `,
})
export class ProjectEditComponent {
  private readonly fb = inject(FormBuilder);
  private readonly projectService = inject(ProjectService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly id = input.required<string>();
  readonly separatorKeyCodes = [ENTER, COMMA] as const;
  readonly submitting = signal(false);
  readonly tags = signal<string[]>([]);
  readonly requirements = signal<Partial<ProjectRequirement>[]>([]);

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

  readonly projectResource = httpResource<ApiResponse<Project>>(
    () => ({ url: `${environment.apiUrl}/projects/${this.id()}` }),
  );

  constructor() {
    effect(() => {
      const res = this.projectResource.value();
      if (res?.data) {
        const p = res.data;
        this.infoForm.patchValue({
          title: p.title,
          description: p.description,
          projectType: p.projectType,
          positionsAvailable: p.positionsAvailable,
          isRemote: p.isRemote,
          location: p.location ?? '',
          startDate: p.startDate,
          endDate: p.endDate,
          applicationDeadline: p.applicationDeadline,
          weeklyHours: p.weeklyHours,
          totalHoursRequired: p.totalHoursRequired,
          supervisorName: p.supervisorName ?? '',
        });
        this.requirements.set(p.requirements ?? []);
        this.tags.set(p.tags ?? []);
      }
    });
  }

  getTypeLabel(v?: string): string {
    return this.projectTypes.find((t) => t.value === v)?.label ?? '';
  }

  addReq(): void {
    this.requirements.update((r) => [...r, { name: '', type: 'skill' as const, isMandatory: false, proficiencyLevel: 'basic' as const }]);
  }
  removeReq(i: number): void { this.requirements.update((r) => r.filter((_, idx) => idx !== i)); }
  updateReq(i: number, field: string, val: any): void {
    this.requirements.update((r) => r.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
  }

  addTag(event: MatChipInputEvent): void {
    const v = (event.value || '').trim();
    if (v && !this.tags().includes(v)) this.tags.update((t) => [...t, v]);
    event.chipInput.clear();
  }
  removeTag(tag: string): void { this.tags.update((t) => t.filter((v) => v !== tag)); }

  save(): void {
    if (this.submitting()) return;
    this.submitting.set(true);

    const data = {
      ...this.infoForm.getRawValue(),
      requirements: this.requirements() as any[],
      tags: this.tags(),
    };

    this.projectService.update(this.id(), data).subscribe({
      next: () => {
        this.snackBar.open('Proyecto actualizado', 'OK', { duration: 3000 });
        this.router.navigate(['/my-projects']);
      },
      error: () => {
        this.submitting.set(false);
        this.snackBar.open('Error al actualizar', 'Cerrar', { duration: 4000 });
      },
    });
  }
}
