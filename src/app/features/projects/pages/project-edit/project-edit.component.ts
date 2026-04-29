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
  templateUrl: './project-edit.component.html',
  styleUrl: './project-edit.component.scss',
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
    { value: ProjectType.THESIS, label: 'Tesis / Trabajo de Grado' },
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
