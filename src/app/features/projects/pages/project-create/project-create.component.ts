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
import { forkJoin, of } from 'rxjs';
import { concatMap, catchError } from 'rxjs/operators';

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
  templateUrl: './project-create.component.html',
  styleUrl: './project-create.component.scss',
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
    { value: ProjectType.THESIS, label: 'Tesis / Trabajo de Grado' },
    { value: ProjectType.RESEARCH, label: 'Investigación' },
    { value: ProjectType.INTERNSHIP, label: 'Pasantía' },
  ];

  readonly infoForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(10)]],
    description: ['', [Validators.required, Validators.minLength(50)]],
    projectType: ['' as string as ProjectType, Validators.required],
    positionsAvailable: [1, [Validators.required, Validators.min(1)]],
    isRemote: [false],
    location: [''],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    applicationDeadline: ['', Validators.required],
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
    
    // Mapear solo los datos que espera el backend
    const createData: any = {
      title: formValue.title,
      description: formValue.description,
      projectType: formValue.projectType,
      positionsAvailable: formValue.positionsAvailable,
      locationType: formValue.isRemote ? 'remote' : 'onsite',
      location: formValue.location || undefined,
      startDate: formValue.startDate ? new Date(formValue.startDate).toISOString() : undefined,
      applicationDeadline: formValue.applicationDeadline ? new Date(formValue.applicationDeadline).toISOString() : undefined,
      tags: this.tags(),
    };

    // Agregar compensación o duración (opcionales) si el backend lo requiere en un futuro
    // Por ahora omitimos endDate, weeklyHours, etc., que no existen en el CreateProjectDto

    this.projectService.create(createData).pipe(
      concatMap((res: any) => {
        // En algunos casos el backend no envuelve la respuesta en "data"
        const projectId = res?.data?.id || res?.id;
        
        if (!projectId) {
          throw new Error('No se pudo obtener el ID del proyecto creado.');
        }

        const requirementsRequests = this.requirements().map(req => {
          const reqDto = {
            requirementType: req.type,
            name: req.name,
            isMandatory: req.isMandatory ?? false,
            proficiencyLevel: req.proficiencyLevel 
          };
          return this.projectService.addRequirement(projectId, reqDto).pipe(catchError(() => of(null)));
        });
        
        // Si hay requisitos, guardarlos; si no, retornar un de una arreglo vacío
        const saveReqs$ = requirementsRequests.length > 0 ? forkJoin(requirementsRequests) : of([]);
        
        return saveReqs$.pipe(
          concatMap(() => {
            // Si se debe publicar
            if (status === ProjectStatus.PUBLISHED) {
              return this.projectService.updateStatus(projectId, ProjectStatus.PUBLISHED).pipe(
                catchError(() => of(null)) // ignorar error al publicar, el proyecto ya se creó
              );
            }
            return of(null);
          })
        );
      })
    ).subscribe({
      next: () => {
        localStorage.removeItem(DRAFT_KEY);
        this.submitting.set(false);
        this.snackBar.open(
          status === ProjectStatus.PUBLISHED ? 'Proyecto publicado' : 'Borrador guardado',
          'OK', { duration: 3000 },
        );
        this.router.navigate(['/my-projects']);
      },
      error: (err) => {
        console.error('Detalles del error:', err.error);
        
        let errorMsg = 'Error al guardar proyecto';
        if (err.error && err.error.message) {
          errorMsg = Array.isArray(err.error.message) ? err.error.message.join(', ') : err.error.message;
        }

        this.submitting.set(false);
        this.snackBar.open(errorMsg, 'Cerrar', { duration: 6000 });
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
