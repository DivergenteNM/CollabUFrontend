import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit, OnDestroy,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  FormBuilder, FormsModule, ReactiveFormsModule, Validators,
  AbstractControl, ValidationErrors, ValidatorFn,
} from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin, of } from 'rxjs';
import { concatMap, catchError } from 'rxjs/operators';

import { ProjectService } from '../../services/project.service';
import { ProjectType, ProjectStatus } from '../../../../core/enums';
import { ProjectRequirement, AcademicProgram, SkillCatalogEntry, SkillCategory } from '../../../../core/models';
import { AdminService } from '../../../admin/services/admin.service';
import { StorageService } from '../../../../core/services/storage.service';

const DRAFT_KEY = 'collabu_project_draft';

interface DraftSkill {
  name: string;
  catalogSkillId: string | null;
  category: SkillCategory;
  proficiencyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null;
  isMandatory: boolean;
}

const dateRangeValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const start = group.get('startDate');
  const end = group.get('endDate');
  const deadline = group.get('applicationDeadline');

  if (!start?.value) return null;

  const errors: ValidationErrors = {};
  const startDt = new Date(start.value);

  // Validar fecha de fin
  if (end?.value && startDt >= new Date(end.value)) {
    errors['endBeforeStart'] = true;
    if (!end.errors?.['endBeforeStart']) {
      end.setErrors({ ...end.errors, endBeforeStart: true });
    }
  } else if (end?.errors?.['endBeforeStart']) {
    const { endBeforeStart, ...rest } = end.errors;
    end.setErrors(Object.keys(rest).length ? rest : null);
  }

  // Validar límite de aplicaciones
  if (deadline?.value && new Date(deadline.value) >= startDt) {
    errors['deadlineAfterStart'] = true;
    if (!deadline.errors?.['deadlineAfterStart']) {
      deadline.setErrors({ ...deadline.errors, deadlineAfterStart: true });
    }
  } else if (deadline?.errors?.['deadlineAfterStart']) {
    const { deadlineAfterStart, ...rest } = deadline.errors;
    deadline.setErrors(Object.keys(rest).length ? rest : null);
  }

  return Object.keys(errors).length ? errors : null;
};

const hoursValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const weekly = group.get('weeklyHours');
  const total = group.get('totalHours');

  if (!weekly?.value || !total?.value) return null;

  const errors: ValidationErrors = {};

  if (Number(total.value) < Number(weekly.value)) {
    errors['totalLessThanWeekly'] = true;
    if (!total.errors?.['totalLessThanWeekly']) {
      total.setErrors({ ...total.errors, totalLessThanWeekly: true });
    }
  } else if (total?.errors?.['totalLessThanWeekly']) {
    const { totalLessThanWeekly, ...rest } = total.errors;
    total.setErrors(Object.keys(rest).length ? rest : null);
  }

  return Object.keys(errors).length ? errors : null;
};

@Component({
  selector: 'app-project-create',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule, FormsModule,
    MatStepperModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatRadioModule, MatDatepickerModule, MatIconModule, MatButtonModule,
    MatSlideToggleModule, MatCardModule, MatSnackBarModule,
  ],
  templateUrl: './project-create.component.html',
  styleUrl: './project-create.component.scss',
})
export class ProjectCreateComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly projectService = inject(ProjectService);
  private readonly adminService = inject(AdminService);
  private readonly storageService = inject(StorageService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly submitting = signal(false);
  readonly requirements = signal<Partial<ProjectRequirement>[]>([]);
  readonly requirementsControls = this.requirements;

  readonly academicPrograms = signal<AcademicProgram[]>([]);
  readonly loadingPrograms = signal(false);
  readonly skillCatalog = signal<SkillCatalogEntry[]>([]);
  readonly loadingCatalog = signal(false);
  readonly skills = signal<DraftSkill[]>([]);
  customSkillDraft = '';

  readonly documentFileId = signal<string | null>(null);
  readonly documentFileName = signal<string | null>(null);
  readonly uploadingDocument = signal(false);

  private autoSaveTimer: ReturnType<typeof setInterval> | null = null;

  readonly projectTypes = [
    { value: ProjectType.PROFESSIONAL_PRACTICE, label: 'Práctica Profesional' },
    { value: ProjectType.THESIS, label: 'Tesis / Trabajo de Grado' },
    { value: ProjectType.RESEARCH, label: 'Investigación' },
    { value: ProjectType.INTERNSHIP, label: 'Pasantía' },
    { value: ProjectType.OTHER, label: 'Otro' },
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
    academicPrograms: [[] as string[]],
    minimumSemester: [null as number | null, [Validators.min(1), Validators.max(12)]],
    weeklyHours: [null as number | null, [Validators.required, Validators.min(1)]],
    totalHours: [null as number | null, [Validators.min(1)]],
  }, { validators: [dateRangeValidator, hoursValidator] });

  ngOnInit(): void {
    this.loadDraft();
    this.loadPrograms();
    this.loadSkillCatalog([]);
    this.autoSaveTimer = setInterval(() => this.saveToLocalStorage(), 30000);
  }

  ngOnDestroy(): void {
    if (this.autoSaveTimer) clearInterval(this.autoSaveTimer);
  }

  getProjectTypeLabel(value?: string): string {
    return this.projectTypes.find((t) => t.value === value)?.label ?? '';
  }

  getProgramName(id: string): string {
    return this.academicPrograms().find((p) => p.id === id)?.name ?? id;
  }

  private loadPrograms(): void {
    this.loadingPrograms.set(true);
    this.adminService.getPrograms(true).subscribe({
      next: (programs) => {
        this.academicPrograms.set(programs);
        this.loadingPrograms.set(false);
      },
      error: () => this.loadingPrograms.set(false),
    });
  }

  onProgramsChange(programIds: string[]): void {
    this.loadSkillCatalog(programIds);
  }

  private loadSkillCatalog(programIds: string[]): void {
    this.loadingCatalog.set(true);

    const requests = programIds.length > 0
      ? programIds.map((id) => this.adminService.getSkillCatalog({ programId: id }))
      : [this.adminService.getSkillCatalog()];

    forkJoin(requests).subscribe({
      next: (results) => {
        const merged = new Map<string, SkillCatalogEntry>();
        for (const list of results) {
          for (const entry of list) merged.set(entry.id, entry);
        }
        this.skillCatalog.set(Array.from(merged.values()));
        this.loadingCatalog.set(false);
      },
      error: () => this.loadingCatalog.set(false),
    });
  }

  isSkillSelected(name: string): boolean {
    return this.skills().some((s) => s.name.toLowerCase() === name.toLowerCase());
  }

  toggleCatalogSkill(entry: SkillCatalogEntry): void {
    if (this.isSkillSelected(entry.displayName)) {
      this.removeSkill(entry.displayName);
      return;
    }
    this.skills.update((current) => [
      ...current,
      { name: entry.displayName, catalogSkillId: entry.id, category: entry.category, proficiencyLevel: null, isMandatory: false },
    ]);
  }

  addCustomSkill(): void {
    const value = (this.customSkillDraft ?? '').trim();
    if (value.length < 2 || this.isSkillSelected(value)) {
      this.customSkillDraft = '';
      return;
    }
    this.skills.update((current) => [
      ...current,
      { name: value, catalogSkillId: null, category: 'concept', proficiencyLevel: null, isMandatory: false },
    ]);
    this.customSkillDraft = '';
  }

  removeSkill(name: string): void {
    this.skills.set(this.skills().filter((s) => s.name.toLowerCase() !== name.toLowerCase()));
  }

  setSkillProficiency(name: string, level: DraftSkill['proficiencyLevel']): void {
    this.skills.update((current) => current.map((s) => (s.name === name ? { ...s, proficiencyLevel: level } : s)));
  }

  onDocumentSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.uploadingDocument.set(true);
    this.storageService.upload(file, 'project_document').subscribe({
      next: (res) => {
        this.documentFileId.set(res.data.fileId);
        this.documentFileName.set(file.name);
        this.uploadingDocument.set(false);
        this.snackBar.open('Documento cargado', 'OK', { duration: 2400 });
      },
      error: (err) => {
        this.uploadingDocument.set(false);
        const msg = err?.error?.message ?? 'No se pudo cargar el documento';
        this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
      },
    });
  }

  clearDocument(): void {
    this.documentFileId.set(null);
    this.documentFileName.set(null);
  }

  addRequirement(): void {
    this.requirements.update((reqs) => [
      ...reqs,
      { name: '', type: 'other' as const, isMandatory: false },
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

  saveDraft(): void {
    this.submit(ProjectStatus.DRAFT);
  }

  publish(): void {
    if (this.skills().length === 0) {
      this.snackBar.open('Agrega al menos una habilidad requerida antes de enviar a revisión.', 'Cerrar', { duration: 4000 });
      return;
    }
    if ((this.infoForm.value.academicPrograms ?? []).length === 0) {
      this.snackBar.open('Selecciona al menos un programa académico antes de enviar a revisión.', 'Cerrar', { duration: 4000 });
      return;
    }
    if (!this.documentFileId()) {
      this.snackBar.open('Adjunta el documento de solicitud formal antes de enviar a revisión.', 'Cerrar', { duration: 4000 });
      return;
    }
    this.submit(ProjectStatus.PENDING_APPROVAL);
  }

  private submit(status: ProjectStatus): void {
    if (this.submitting()) return;
    this.submitting.set(true);

    // Mapear los datos que espera el backend
    const formValue = this.infoForm.getRawValue();
    const createData: any = {
      title: formValue.title,
      description: formValue.description,
      projectType: formValue.projectType,
      positionsAvailable: formValue.positionsAvailable,
      locationType: formValue.isRemote ? 'remote' : 'onsite',
      location: formValue.location || undefined,
      startDate: formValue.startDate ? new Date(formValue.startDate).toISOString() : undefined,
      endDate: formValue.endDate ? new Date(formValue.endDate).toISOString() : undefined,
      applicationDeadline: formValue.applicationDeadline ? new Date(formValue.applicationDeadline).toISOString() : undefined,
      academicPrograms: formValue.academicPrograms,
      minimumSemester: formValue.minimumSemester || undefined,
      skills: this.skills().map((s) => ({
        name: s.name,
        catalogSkillId: s.catalogSkillId ?? undefined,
        category: s.category,
        proficiencyLevel: s.proficiencyLevel ?? undefined,
        isMandatory: s.isMandatory,
      })),
      requestDocumentFileId: this.documentFileId() ?? undefined,
      weeklyHours: formValue.weeklyHours || undefined,
      totalHours: formValue.totalHours || undefined,
    };

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
            if (status === ProjectStatus.PENDING_APPROVAL) {
              return this.projectService.updateStatus(projectId, ProjectStatus.PENDING_APPROVAL).pipe(
                catchError(() => of(null)),
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
          status === ProjectStatus.PENDING_APPROVAL ? 'Proyecto enviado a revisión' : 'Borrador guardado',
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
      skills: this.skills(),
      documentFileId: this.documentFileId(),
      documentFileName: this.documentFileName(),
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
      if (draft.skills) this.skills.set(draft.skills);
      if (draft.documentFileId) this.documentFileId.set(draft.documentFileId);
      if (draft.documentFileName) this.documentFileName.set(draft.documentFileName);
      this.snackBar.open('Borrador restaurado', 'OK', { duration: 3000 });
    } catch {
      localStorage.removeItem(DRAFT_KEY);
    }
  }
}
