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
