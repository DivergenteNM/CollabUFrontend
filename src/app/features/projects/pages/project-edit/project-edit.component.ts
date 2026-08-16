import {
  Component, ChangeDetectionStrategy, inject, input, signal, effect, computed, PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { httpResource } from '@angular/common/http';
import { of, forkJoin } from 'rxjs';
import { concatMap, catchError } from 'rxjs/operators';
import {
  FormBuilder, ReactiveFormsModule, Validators,
  AbstractControl, ValidationErrors, ValidatorFn,
} from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { environment } from '../../../../../environments/environment';
import { ProjectService } from '../../services/project.service';
import { ProjectType } from '../../../../core/enums';
import { ApiResponse, Project, ProjectRequirement, AcademicProgram, SkillCatalogEntry, SkillCategory } from '../../../../core/models';
import { AdminService } from '../../../admin/services/admin.service';
import { StorageService } from '../../../../core/services/storage.service';

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

  if (end?.value && startDt >= new Date(end.value)) {
    errors['endBeforeStart'] = true;
    if (!end.errors?.['endBeforeStart']) {
      end.setErrors({ ...end.errors, endBeforeStart: true });
    }
  } else if (end?.errors?.['endBeforeStart']) {
    const { endBeforeStart, ...rest } = end.errors;
    end.setErrors(Object.keys(rest).length ? rest : null);
  }

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
  selector: 'app-project-edit',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule, FormsModule,
    MatStepperModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatIconModule, MatButtonModule,
    MatSlideToggleModule, MatCardModule, MatSnackBarModule, MatProgressBarModule,
  ],
  templateUrl: './project-edit.component.html',
  styleUrl: './project-edit.component.scss',
})
export class ProjectEditComponent {
  private readonly fb = inject(FormBuilder);
  private readonly projectService = inject(ProjectService);
  private readonly adminService = inject(AdminService);
  private readonly storageService = inject(StorageService);
  readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly id = input.required<string>();
  readonly submitting = signal(false);
  readonly requirements = signal<Partial<ProjectRequirement>[]>([]);

  readonly academicPrograms = signal<AcademicProgram[]>([]);
  readonly skillCatalog = signal<SkillCatalogEntry[]>([]);
  readonly loadingCatalog = signal(false);
  readonly skills = signal<DraftSkill[]>([]);
  customSkillDraft = '';

  readonly documentFileId = signal<string | null>(null);
  readonly documentFileName = signal<string | null>(null);
  readonly uploadingDocument = signal(false);

  readonly projectTypes = [
    { value: ProjectType.PROFESSIONAL_PRACTICE, label: 'Práctica Profesional' },
    { value: ProjectType.THESIS, label: 'Tesis / Trabajo de Grado' },
    { value: ProjectType.RESEARCH, label: 'Investigación' },
    { value: ProjectType.INTERNSHIP, label: 'Pasantía' },
    { value: ProjectType.OTHER, label: 'Otro' },
  ];

  // Date controls typed as Date|null — NativeDateAdapter requires Date objects, not ISO strings.
  readonly infoForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(5)]],
    description: ['', [Validators.required, Validators.minLength(50)]],
    projectType: ['' as string as ProjectType, Validators.required],
    positionsAvailable: [1, [Validators.required, Validators.min(1)]],
    isRemote: [false],
    location: [''],
    startDate: [null as Date | null, Validators.required],
    endDate: [null as Date | null, Validators.required],
    applicationDeadline: [null as Date | null, Validators.required],
    academicPrograms: [[] as string[]],
    minimumSemester: [null as number | null, [Validators.min(1), Validators.max(12)]],
    weeklyHours: [null as number | null, [Validators.min(1)]],
    totalHours: [null as number | null, [Validators.min(1)]],
  }, { validators: [dateRangeValidator, hoursValidator] });

  readonly projectResource = httpResource<ApiResponse<Project>>(
    () => {
      const id = this.id();
      // Guard: don't fire if id not yet available or not in browser
      if (!this.isBrowser || !id) return undefined;
      return { url: `${environment.apiUrl}/projects/${id}` };
    },
  );

  // Normalize backend response — handles both { data: Project } and bare Project shapes
  readonly project = computed(() => {
    const res = this.projectResource.value() as any;
    return (res?.data ?? res ?? null) as Project | null;
  });

  readonly isLoading = computed(() => this.projectResource.isLoading());
  readonly hasError = computed(() => !!this.projectResource.error());
  readonly errorMessage = computed(() => {
    const err = this.projectResource.error() as any;
    if (!err) return '';
    const raw = err?.error?.message ?? err?.message;
    return Array.isArray(raw) ? raw.join('; ') : (raw ?? 'Error desconocido');
  });

  constructor() {
    this.loadPrograms();

    // Populate form whenever the project data arrives
    effect(() => {
      const p = this.project();
      if (!p) return;

      this.infoForm.patchValue({
        title: p.title,
        description: p.description,
        projectType: p.projectType,
        positionsAvailable: p.positionsAvailable,
        // Backend uses locationType enum; map to isRemote boolean for the form
        isRemote: (p as any).locationType === 'remote',
        location: p.location ?? '',
        // Must convert ISO strings → Date objects for MatDatepicker (NativeDateAdapter)
        startDate: p.startDate ? new Date(p.startDate) : null,
        endDate: p.endDate ? new Date(p.endDate) : null,
        applicationDeadline: p.applicationDeadline ? new Date(p.applicationDeadline) : null,
        academicPrograms: p.academicPrograms ?? [],
        minimumSemester: p.minimumSemester ?? null,
        weeklyHours: p.weeklyHours ?? null,
        totalHours: p.totalHours ?? null,
      });
      this.requirements.set((p.requirements ?? []).filter((r) => (r.type as string) !== 'skill'));
      this.loadSkillCatalog(p.academicPrograms ?? []);

      const rawSkills = (p as any).skills ?? [];
      this.skills.set(rawSkills.map((s: any) => ({
        name: s.name,
        catalogSkillId: s.catalogSkillId ?? null,
        category: s.category,
        proficiencyLevel: s.proficiencyLevel ?? null,
        isMandatory: !!s.isMandatory,
      })));

      if (p.requestDocumentFileId) {
        this.documentFileId.set(p.requestDocumentFileId);
        this.documentFileName.set('Documento ya cargado');
      }
    });
  }

  private loadPrograms(): void {
    this.adminService.getPrograms(true).subscribe({
      next: (programs) => this.academicPrograms.set(programs),
      error: () => {},
    });
  }

  getProgramName(programId: string): string {
    return this.academicPrograms().find((p) => p.id === programId)?.name ?? programId;
  }

  onProgramsChange(programIds: string[]): void {
    this.loadSkillCatalog(programIds);
  }

  private loadSkillCatalog(programIds: string[]): void {
    this.loadingCatalog.set(true);
    const requests = programIds.length > 0
      ? programIds.map((pid) => this.adminService.getSkillCatalog({ programId: pid }))
      : [this.adminService.getSkillCatalog()];

    forkJoin(requests).subscribe({
      next: (results) => {
        const merged = new Map<string, SkillCatalogEntry>();
        for (const list of results) for (const entry of list) merged.set(entry.id, entry);
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

  getTypeLabel(v?: string | null): string {
    return this.projectTypes.find((t) => t.value === v)?.label ?? '';
  }

  addReq(): void {
    this.requirements.update((r) => [...r, { name: '', type: 'other' as const, isMandatory: false }]);
  }
  removeReq(i: number): void { this.requirements.update((r) => r.filter((_, idx) => idx !== i)); }
  updateReq(i: number, field: string, val: any): void {
    this.requirements.update((r) => r.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
  }

  save(): void {
    if (this.submitting()) return;
    this.submitting.set(true);

    const raw = this.infoForm.getRawValue();

    const toIso = (v: Date | null): string | undefined => {
      if (!v) return undefined;
      return v instanceof Date ? v.toISOString() : new Date(v).toISOString();
    };

    // Backend uses locationType enum ('remote'|'onsite'), not isRemote boolean.
    // weeklyHours, totalHoursRequired, supervisorName don't exist in DB — omit.
    const data: Record<string, any> = {
      title: raw.title,
      description: raw.description,
      positionsAvailable: raw.positionsAvailable,
      locationType: raw.isRemote ? 'remote' : 'onsite',
      location: raw.isRemote ? undefined : (raw.location || undefined),
      startDate: toIso(raw.startDate),
      endDate: toIso(raw.endDate),
      applicationDeadline: toIso(raw.applicationDeadline),
      academicPrograms: raw.academicPrograms,
      minimumSemester: raw.minimumSemester || undefined,
      skills: this.skills().map((s) => ({
        name: s.name,
        catalogSkillId: s.catalogSkillId ?? undefined,
        category: s.category,
        proficiencyLevel: s.proficiencyLevel ?? undefined,
        isMandatory: s.isMandatory,
      })),
      requestDocumentFileId: this.documentFileId() ?? undefined,
      weeklyHours: raw.weeklyHours || undefined,
      totalHours: raw.totalHours || undefined,
    };

    this.projectService.update(this.id(), data as Partial<Project>).pipe(
      concatMap(() => {
        const reqs$ = this.requirements().map((r) =>
          this.projectService.addRequirement(this.id(), {
            requirementType: r.type,
            name: r.name,
            isMandatory: r.isMandatory ?? false,
            proficiencyLevel: r.proficiencyLevel,
          }).pipe(catchError(() => of(null))),
        );
        return reqs$.length > 0 ? forkJoin(reqs$) : of([]);
      }),
    ).subscribe({
      next: () => {
        this.submitting.set(false);
        this.snackBar.open('Proyecto actualizado', 'OK', { duration: 3000 });
        this.router.navigate(['/my-projects']);
      },
      error: (err) => {
        this.submitting.set(false);
        const raw = err?.error?.message;
        const msg = Array.isArray(raw) ? raw.join('; ') : raw ?? 'Error al actualizar';
        this.snackBar.open(msg, 'Cerrar', { duration: 6000 });
      },
    });
  }
}
