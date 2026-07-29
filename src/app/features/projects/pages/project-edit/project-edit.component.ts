import {
  Component, ChangeDetectionStrategy, inject, input, signal, effect, computed, PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DatePipe } from '@angular/common';
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
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { COMMA, ENTER } from '@angular/cdk/keycodes';

import { environment } from '../../../../../environments/environment';
import { ProjectService } from '../../services/project.service';
import { ProjectType, CompensationType } from '../../../../core/enums';
import { ApiResponse, Project, ProjectRequirement } from '../../../../core/models';

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
    ReactiveFormsModule, DatePipe,
    MatStepperModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatIconModule, MatButtonModule,
    MatChipsModule, MatSlideToggleModule, MatCardModule, MatSnackBarModule, MatProgressBarModule,
  ],
  templateUrl: './project-edit.component.html',
  styleUrl: './project-edit.component.scss',
})
export class ProjectEditComponent {
  private readonly fb = inject(FormBuilder);
  private readonly projectService = inject(ProjectService);
  readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly id = input.required<string>();
  readonly separatorKeyCodes = [ENTER, COMMA] as const;
  readonly submitting = signal(false);
  readonly tags = signal<string[]>([]);
  readonly requirements = signal<Partial<ProjectRequirement>[]>([]);
  readonly deliverables = signal<any[]>([]);

  readonly projectTypes = [
    { value: ProjectType.PROFESSIONAL_PRACTICE, label: 'Práctica Profesional' },
    { value: ProjectType.THESIS, label: 'Tesis / Trabajo de Grado' },
    { value: ProjectType.RESEARCH, label: 'Investigación' },
    { value: ProjectType.INTERNSHIP, label: 'Pasantía' },
    { value: ProjectType.OTHER, label: 'Otro' },
  ];

  readonly compensationTypes = [
    { value: CompensationType.UNPAID, label: 'No remunerado (Ad honorem)' },
    { value: CompensationType.PAID, label: 'Remunerado (Salario / Pago)' },
    { value: CompensationType.STIPEND, label: 'Estipendio / Auxilio (Transporte / Alimentación)' },
    { value: CompensationType.ACADEMIC_CREDIT, label: 'Crédito Académico' },
  ];

  readonly programs = [
    'Ingeniería de Sistemas',
    'Ingeniería Electrónica',
    'Ingeniería Civil',
  ];

  // Date controls typed as Date|null — NativeDateAdapter requires Date objects, not ISO strings.
  readonly infoForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(5)]],
    description: ['', [Validators.required, Validators.minLength(50)]],
    projectType: ['' as string as ProjectType, Validators.required],
    compensationType: [CompensationType.UNPAID as CompensationType, Validators.required],
    compensationAmount: [null as number | null, [Validators.min(0)]],
    currency: ['COP'],
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

  constructor() {
    // Populate form whenever the project data arrives
    effect(() => {
      const p = this.project();
      if (!p) return;

      this.infoForm.patchValue({
        title: p.title,
        description: p.description,
        projectType: p.projectType,
        compensationType: p.compensationType ?? CompensationType.UNPAID,
        compensationAmount: p.compensationAmount ? Number(p.compensationAmount) : null,
        currency: p.currency ?? 'COP',
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
      this.requirements.set(p.requirements ?? []);
      this.loadDeliverables();
      // Tags come as ProjectTag[] objects from backend — extract the tag string
      const rawTags = (p as any).tags ?? [];
      this.tags.set(rawTags.map((t: any) => (typeof t === 'string' ? t : t.tag ?? '')).filter(Boolean));
    });
  }

  private loadDeliverables(): void {
    const projectId = this.id();
    if (!projectId) return;
    this.projectService.getDeliverables(projectId).subscribe({
      next: (dels) => this.deliverables.set(dels),
      error: () => this.deliverables.set([]),
    });
  }

  addDel(): void {
    this.deliverables.update((d) => [
      ...d,
      { title: '', description: '', dueDate: '', weightPercentage: 10, isMandatory: true, displayOrder: d.length },
    ]);
  }
  removeDel(i: number): void { this.deliverables.update((d) => d.filter((_, idx) => idx !== i)); }
  updateDel(i: number, field: string, val: any): void {
    this.deliverables.update((d) => d.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
  }

  getTypeLabel(v?: string | null): string {
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

    const raw = this.infoForm.getRawValue();

    const toIso = (v: Date | null): string | undefined => {
      if (!v) return undefined;
      return v instanceof Date ? v.toISOString() : new Date(v).toISOString();
    };

    // Backend uses locationType enum ('remote'|'onsite'), not isRemote boolean.
    // weeklyHours, totalHoursRequired, supervisorName don't exist in DB — omit.
    const isPaidOrStipend = raw.compensationType === CompensationType.PAID || raw.compensationType === CompensationType.STIPEND;
    const data: Record<string, any> = {
      title: raw.title,
      description: raw.description,
      compensationType: raw.compensationType,
      compensationAmount: isPaidOrStipend ? (raw.compensationAmount || undefined) : undefined,
      currency: raw.currency || 'COP',
      positionsAvailable: raw.positionsAvailable,
      locationType: raw.isRemote ? 'remote' : 'onsite',
      location: raw.isRemote ? undefined : (raw.location || undefined),
      startDate: toIso(raw.startDate),
      endDate: toIso(raw.endDate),
      applicationDeadline: toIso(raw.applicationDeadline),
      academicPrograms: raw.academicPrograms,
      minimumSemester: raw.minimumSemester || undefined,
      tags: this.tags(),
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
      concatMap(() => {
        const dels$ = this.deliverables()
          .filter((d) => d.id)
          .map((d) =>
            this.projectService.updateDeliverable(this.id(), d.id, {
              title: d.title,
              description: d.description || undefined,
              dueDate: d.dueDate || undefined,
              weightPercentage: d.weightPercentage,
              isMandatory: d.isMandatory,
              displayOrder: d.displayOrder,
            }).pipe(catchError(() => of(null))),
          );
        return dels$.length > 0 ? forkJoin(dels$) : of([]);
      }),
    ).subscribe({
      next: () => {
        this.submitting.set(false);
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
