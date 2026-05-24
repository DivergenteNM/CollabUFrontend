import {
  Component, ChangeDetectionStrategy, inject, input, signal, effect, computed, PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
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
import { ProjectType } from '../../../../core/enums';
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
  });

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
        positionsAvailable: p.positionsAvailable,
        // Backend uses locationType enum; map to isRemote boolean for the form
        isRemote: (p as any).locationType === 'remote',
        location: p.location ?? '',
        // Must convert ISO strings → Date objects for MatDatepicker (NativeDateAdapter)
        startDate: p.startDate ? new Date(p.startDate) : null,
        endDate: p.endDate ? new Date(p.endDate) : null,
        applicationDeadline: p.applicationDeadline ? new Date(p.applicationDeadline) : null,
      });
      this.requirements.set(p.requirements ?? []);
      // Tags come as ProjectTag[] objects from backend — extract the tag string
      const rawTags = (p as any).tags ?? [];
      this.tags.set(rawTags.map((t: any) => (typeof t === 'string' ? t : t.tag ?? '')).filter(Boolean));
    });
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
    const data: Record<string, any> = {
      title: raw.title,
      description: raw.description,
      positionsAvailable: raw.positionsAvailable,
      locationType: raw.isRemote ? 'remote' : 'onsite',
      location: raw.isRemote ? undefined : (raw.location || undefined),
      startDate: toIso(raw.startDate),
      endDate: toIso(raw.endDate),
      applicationDeadline: toIso(raw.applicationDeadline),
      tags: this.tags(),
    };

    this.projectService.update(this.id(), data as Partial<Project>).subscribe({
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
