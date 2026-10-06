import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnInit,
  OnDestroy,
  viewChild,
  ElementRef,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
  FormGroup,
} from '@angular/forms';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { forkJoin, of } from 'rxjs';
import { concatMap, catchError } from 'rxjs/operators';

import { ProjectService } from '../../services/project.service';
import { ProjectType, ProjectStatus, CompensationType } from '../../../../core/enums';
import {
  ProjectRequirement,
  AcademicProgram,
  SkillCatalogEntry,
  SkillCategory,
} from '../../../../core/models';
import { AdminService } from '../../../admin/services/admin.service';
import { StorageService } from '../../../../core/services/storage.service';
import { BreadcrumbsComponent, BreadcrumbItem } from '../../../../shared/components/ui/breadcrumbs/breadcrumbs.component';
import { ConfirmDialogComponent } from '../../../../shared/components/ui/confirm-dialog/confirm-dialog.component';

const DRAFT_KEY = 'collabu_project_draft';

export interface DraftSkill {
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

  const errors: ValidationErrors = {};

  if (start?.value && end?.value) {
    const startDt = new Date(start.value);
    const endDt = new Date(end.value);
    if (startDt >= endDt) {
      errors['endBeforeStart'] = true;
      if (!end.errors?.['endBeforeStart']) {
        end.setErrors({ ...end.errors, endBeforeStart: true });
      }
    } else if (end.errors?.['endBeforeStart']) {
      const { endBeforeStart, ...rest } = end.errors;
      end.setErrors(Object.keys(rest).length ? rest : null);
    }
  }

  if (deadline?.value && start?.value) {
    const startDt = new Date(start.value);
    const deadlineDt = new Date(deadline.value);
    if (deadlineDt > startDt) {
      errors['deadlineAfterStart'] = true;
      if (!deadline.errors?.['deadlineAfterStart']) {
        deadline.setErrors({ ...deadline.errors, deadlineAfterStart: true });
      }
    } else if (deadline.errors?.['deadlineAfterStart']) {
      const { deadlineAfterStart, ...rest } = deadline.errors;
      deadline.setErrors(Object.keys(rest).length ? rest : null);
    }
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
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatDatepickerModule,
    MatIconModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatCardModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule,
    MatChipsModule,
    MatProgressBarModule,
    MatDividerModule,
    BreadcrumbsComponent,
  ],
  templateUrl: './project-create.component.html',
  styleUrl: './project-create.component.scss',
})
export class ProjectCreateComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly projectService = inject(ProjectService);
  private readonly adminService = inject(AdminService);
  private readonly storageService = inject(StorageService);
  readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  readonly fileInputEl = viewChild<ElementRef<HTMLInputElement>>('fileInputEl');
  readonly stepperRef = viewChild<MatStepper>('stepper');

  readonly submitting = signal(false);
  readonly lastSavedTime = signal<string | null>(null);
  readonly hasDraftInStorage = signal<boolean>(false);
  readonly isDragging = signal(false);

  readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Mis Proyectos', link: '/my-projects', icon: 'folder_open' },
    { label: 'Nueva Convocatoria', icon: 'add_circle' },
  ];

  // ==========================================
  // FORMULARIO PASO 1: INFORMACIÓN & MODALIDAD
  // ==========================================
  readonly basicInfoForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(120)]],
    description: ['', [Validators.required, Validators.minLength(50)]],
    projectType: [ProjectType.PROFESSIONAL_PRACTICE as ProjectType, Validators.required],
    positionsAvailable: [1, [Validators.required, Validators.min(1), Validators.max(50)]],
    locationType: ['remote' as 'remote' | 'onsite' | 'hybrid', Validators.required],
    location: [''],
    compensationType: [CompensationType.UNPAID as CompensationType],
    compensationAmount: [null as number | null, [Validators.min(0)]],
    currency: ['COP'],
  });

  // ==========================================
  // FORMULARIO PASO 2: CRONOGRAMA & HORAS
  // ==========================================
  readonly scheduleForm = this.fb.nonNullable.group({
    applicationDeadline: ['', Validators.required],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    weeklyHours: [20 as number | null, [Validators.required, Validators.min(1), Validators.max(60)]],
    totalHours: [null as number | null, [Validators.min(1)]],
  }, { validators: [dateRangeValidator, hoursValidator] });

  // ==========================================
  // FORMULARIO PASO 3: PERFIL & PROGRAMAS
  // ==========================================
  readonly profileForm = this.fb.nonNullable.group({
    academicPrograms: [[] as string[], [Validators.required]],
    minimumSemester: [6 as number | null, [Validators.min(1), Validators.max(12)]],
  });

  // Señales reactivas a los cambios de formulario
  readonly basicInfoValues = toSignal(
    this.basicInfoForm.valueChanges,
    { initialValue: this.basicInfoForm.getRawValue() }
  );

  readonly scheduleValues = toSignal(
    this.scheduleForm.valueChanges,
    { initialValue: this.scheduleForm.getRawValue() }
  );

  readonly profileValues = toSignal(
    this.profileForm.valueChanges,
    { initialValue: this.profileForm.getRawValue() }
  );

  // Requisitos adicionales
  readonly requirements = signal<Partial<ProjectRequirement>[]>([]);
  readonly requirementsControls = this.requirements;

  // Catálogo y habilidades seleccionadas
  readonly academicPrograms = signal<AcademicProgram[]>([]);
  readonly loadingPrograms = signal(false);
  readonly skillCatalog = signal<SkillCatalogEntry[]>([]);
  readonly loadingCatalog = signal(false);
  readonly skills = signal<DraftSkill[]>([]);

  // Filtros de búsqueda para catálogo
  readonly skillSearch = signal('');
  readonly selectedCategory = signal<string>('all');
  customSkillDraft = '';

  // Documento formal
  readonly documentFileId = signal<string | null>(null);
  readonly documentFileName = signal<string | null>(null);
  readonly documentFileSize = signal<number | null>(null);
  readonly uploadingDocument = signal(false);

  private autoSaveTimer: ReturnType<typeof setInterval> | null = null;

  // Catálogos estáticos de opciones para UI enriquecida
  readonly projectTypes = [
    {
      value: ProjectType.PROFESSIONAL_PRACTICE,
      label: 'Práctica Profesional',
      icon: 'work',
      desc: 'Requisito curricular de grado con seguimiento formal.',
      badge: 'Curricular',
    },
    {
      value: ProjectType.INTERNSHIP,
      label: 'Pasantía Empresarial',
      icon: 'business_center',
      desc: 'Inmersión formativa temprana en dinámicas reales.',
      badge: 'Formativo',
    },
    {
      value: ProjectType.THESIS,
      label: 'Tesis / Grado',
      icon: 'menu_book',
      desc: 'Investigación o desarrollo aplicado en convenio.',
      badge: 'Académico',
    },
    {
      value: ProjectType.RESEARCH,
      label: 'Proyecto I+D',
      icon: 'science',
      desc: 'Innovación, prototipado o experimentación tecnológica.',
      badge: 'Investigación',
    },
    {
      value: ProjectType.OTHER,
      label: 'Otro Proyecto',
      icon: 'category',
      desc: 'Iniciativas colaborativas o convenios específicos.',
      badge: 'Especial',
    },
  ];

  readonly locationTypes = [
    {
      value: 'remote' as const,
      label: '100% Remoto',
      icon: 'home_work',
      desc: 'Trabajo virtual desde cualquier ubicación.',
    },
    {
      value: 'onsite' as const,
      label: 'Presencial',
      icon: 'apartment',
      desc: 'En las oficinas o instalaciones de la empresa.',
    },
    {
      value: 'hybrid' as const,
      label: 'Híbrido',
      icon: 'sync_alt',
      desc: 'Alternancia entre sede física y días remotos.',
    },
  ];

  readonly compensationTypes = [
    {
      value: CompensationType.UNPAID,
      label: 'No Remunerado',
      icon: 'volunteer_activism',
      desc: 'Práctica académica formativa y créditos universitarios.',
    },
    {
      value: CompensationType.STIPEND,
      label: 'Beca / Estipendio',
      icon: 'payments',
      desc: 'Auxilio económico de sostenimiento o transporte.',
    },
    {
      value: CompensationType.PAID,
      label: 'Remunerado / Salario',
      icon: 'attach_money',
      desc: 'Compensación económica convenida formalmente.',
    },
    {
      value: CompensationType.ACADEMIC_CREDIT,
      label: 'Crédito Académico',
      icon: 'stars',
      desc: 'Homologación académica y curricular directa.',
    },
  ];

  readonly skillCategories = [
    { id: 'all', label: 'Todas', icon: 'apps' },
    { id: 'language', label: 'Lenguajes', icon: 'code' },
    { id: 'framework', label: 'Frameworks', icon: 'layers' },
    { id: 'tool', label: 'Herramientas', icon: 'build' },
    { id: 'concept', label: 'Metodologías', icon: 'psychology' },
    { id: 'soft_skill', label: 'Blandas', icon: 'handshake' },
  ];

  // Cálculo de duración estimada en tiempo real
  readonly durationSummary = computed(() => {
    const values = this.scheduleValues();
    const start = values?.startDate;
    const end = values?.endDate;
    const weekly = values?.weeklyHours;

    if (!start || !end) return null;

    const startDate = new Date(start);
    const endDate = new Date(end);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || endDate <= startDate) {
      return null;
    }

    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.max(1, Math.round(diffDays / 7));
    const diffMonths = Math.max(1, Math.round(diffDays / 30));
    const suggestedTotalHours = weekly ? Math.round(diffWeeks * weekly) : null;

    return {
      days: diffDays,
      weeks: diffWeeks,
      months: diffMonths,
      suggestedTotalHours,
    };
  });

  // Catálogo de habilidades filtrado en vivo
  readonly filteredCatalog = computed(() => {
    const query = this.skillSearch().toLowerCase().trim();
    const category = this.selectedCategory();
    let list = this.skillCatalog();

    if (category !== 'all') {
      list = list.filter((s) => s.category === category);
    }

    if (query) {
      list = list.filter((s) =>
        s.displayName.toLowerCase().includes(query) ||
        s.name.toLowerCase().includes(query)
      );
    }

    return list;
  });

  // Habilidades agrupadas para la previsualización
  readonly mandatorySkills = computed(() => this.skills().filter((s) => s.isMandatory));
  readonly optionalSkills = computed(() => this.skills().filter((s) => !s.isMandatory));

  // Auditoría y checklist de preparación para publicación
  readonly readinessChecklist = computed(() => {
    this.basicInfoValues();
    this.scheduleValues();
    this.profileValues();

    const basic = this.basicInfoForm.valid;
    const schedule = this.scheduleForm.valid;
    const progCount = this.profileForm.get('academicPrograms')?.value?.length ?? 0;
    const hasPrograms = progCount > 0;
    const skillCount = this.skills().length;
    const hasSkills = skillCount > 0;
    const hasDoc = !!this.documentFileId();

    return [
      {
        title: 'Información y modalidad',
        done: basic,
        detail: basic ? 'Título, tipo, modalidad y descripción válidos' : 'Requiere título (≥10 chars) y descripción (≥50 chars)',
        critical: true,
      },
      {
        title: 'Cronograma y dedicación',
        done: schedule,
        detail: schedule ? 'Fechas y horas coherentes' : 'Configura fecha límite, inicio, fin y horas semanales',
        critical: true,
      },
      {
        title: 'Programas académicos',
        done: hasPrograms,
        detail: hasPrograms ? `${progCount} carrera(s) vinculada(s)` : 'Selecciona al menos un programa afín',
        critical: true,
      },
      {
        title: 'Habilidades requeridas',
        done: hasSkills,
        detail: hasSkills ? `${skillCount} competencia(s) configurada(s)` : 'Agrega al menos una habilidad requerida',
        critical: true,
      },
      {
        title: 'Oficio o carta formal',
        done: hasDoc,
        detail: hasDoc ? (this.documentFileName() ?? 'Documento cargado') : 'Necesario para enviar a aprobación institucional',
        critical: false,
      },
    ];
  });

  readonly canSubmitForApproval = computed(() => {
    this.basicInfoValues();
    this.scheduleValues();
    this.profileValues();

    return (
      this.basicInfoForm.valid &&
      this.scheduleForm.valid &&
      (this.profileForm.get('academicPrograms')?.value?.length ?? 0) > 0 &&
      this.skills().length > 0 &&
      !!this.documentFileId() &&
      !this.submitting()
    );
  });

  ngOnInit(): void {
    this.loadDraft();
    this.loadPrograms();
    this.loadSkillCatalog([]);
    this.autoSaveTimer = setInterval(() => this.saveToLocalStorage(), 25000);
  }

  ngOnDestroy(): void {
    if (this.autoSaveTimer) clearInterval(this.autoSaveTimer);
  }

  // ==========================================
  // MÉTODOS DE NAVEGACIÓN Y VALIDACIÓN DEL STEPPER
  // ==========================================
  validateAndNext(stepper: MatStepper, form: FormGroup, stepName: string): void {
    if (form.valid) {
      stepper.next();
      window.scrollTo({ top: 120, behavior: 'smooth' });
    } else {
      form.markAllAsTouched();
      this.snackBar.open(
        `Por favor completa los campos obligatorios de ${stepName} antes de avanzar.`,
        'Entendido',
        { duration: 4000 }
      );
    }
  }

  validateStep3AndNext(stepper: MatStepper): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.snackBar.open('Selecciona al menos un programa académico.', 'Entendido', { duration: 4000 });
      return;
    }
    if ((this.profileForm.value.academicPrograms ?? []).length === 0) {
      this.snackBar.open('Debes vincular al menos una carrera a la convocatoria.', 'Entendido', { duration: 4000 });
      return;
    }
    if (this.skills().length === 0) {
      this.snackBar.open('Agrega al menos una habilidad requerida antes de continuar.', 'Entendido', { duration: 4000 });
      return;
    }
    stepper.next();
    window.scrollTo({ top: 120, behavior: 'smooth' });
  }

  // ==========================================
  // HELPERS DE UI
  // ==========================================
  getProjectTypeLabel(value?: string): string {
    return this.projectTypes.find((t) => t.value === value)?.label ?? '';
  }

  getLocationTypeLabel(value?: string): string {
    return this.locationTypes.find((l) => l.value === value)?.label ?? 'Remoto';
  }

  getCompensationTypeLabel(value?: string): string {
    return this.compensationTypes.find((c) => c.value === value)?.label ?? 'No Remunerado';
  }

  getProgramName(id: string): string {
    return this.academicPrograms().find((p) => p.id === id)?.name ?? id;
  }

  getCategoryLabel(category?: string): string {
    switch (category) {
      case 'language': return 'Lenguaje';
      case 'framework': return 'Framework';
      case 'tool': return 'Herramienta';
      case 'concept': return 'Metodología';
      case 'soft_skill': return 'Blanda';
      default: return 'General';
    }
  }

  getProficiencyLabel(level?: string | null): string {
    switch (level) {
      case 'beginner': return 'Principiante';
      case 'intermediate': return 'Intermedio';
      case 'advanced': return 'Avanzado';
      case 'expert': return 'Experto';
      default: return 'Sin mínimo';
    }
  }

  formatBytes(bytes?: number | null): string {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  applySuggestedHours(): void {
    const suggested = this.durationSummary()?.suggestedTotalHours;
    if (suggested) {
      this.scheduleForm.patchValue({ totalHours: suggested });
      this.snackBar.open(`Horas totales actualizadas a ${suggested} h según las semanas estimadas.`, 'OK', { duration: 2500 });
    }
  }

  adjustPositions(delta: number): void {
    const current = this.basicInfoForm.get('positionsAvailable')?.value || 1;
    const next = Math.max(1, Math.min(50, current + delta));
    this.basicInfoForm.patchValue({ positionsAvailable: next });
  }

  // ==========================================
  // CARGA DE DATOS (PROGRAMAS Y CATÁLOGO)
  // ==========================================
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

  // ==========================================
  // GESTIÓN DE HABILIDADES
  // ==========================================
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
      {
        name: entry.displayName,
        catalogSkillId: entry.id,
        category: entry.category,
        proficiencyLevel: null,
        isMandatory: false,
      },
    ]);
  }

  addCustomSkill(): void {
    const value = (this.customSkillDraft ?? '').trim();
    if (value.length < 2) return;
    if (this.isSkillSelected(value)) {
      this.snackBar.open('Esta habilidad ya está en la lista', 'OK', { duration: 2000 });
      this.customSkillDraft = '';
      return;
    }
    this.skills.update((current) => [
      ...current,
      {
        name: value,
        catalogSkillId: null,
        category: 'concept',
        proficiencyLevel: null,
        isMandatory: false,
      },
    ]);
    this.customSkillDraft = '';
  }

  removeSkill(name: string): void {
    this.skills.set(this.skills().filter((s) => s.name.toLowerCase() !== name.toLowerCase()));
  }

  setSkillProficiency(name: string, level: DraftSkill['proficiencyLevel']): void {
    this.skills.update((current) =>
      current.map((s) => (s.name === name ? { ...s, proficiencyLevel: level } : s))
    );
  }

  toggleSkillMandatory(name: string, isMandatory: boolean): void {
    this.skills.update((current) =>
      current.map((s) => (s.name === name ? { ...s, isMandatory } : s))
    );
  }

  // ==========================================
  // REQUISITOS ADICIONALES
  // ==========================================
  addRequirement(): void {
    this.requirements.update((reqs) => [
      ...reqs,
      { name: '', type: 'experience' as const, isMandatory: false },
    ]);
  }

  removeRequirement(index: number): void {
    this.requirements.update((reqs) => reqs.filter((_, i) => i !== index));
  }

  updateRequirement(index: number, field: string, value: any): void {
    this.requirements.update((reqs) =>
      reqs.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
  }

  // ==========================================
  // SUBIDA DE DOCUMENTOS (DRAG & DROP Y PICKER)
  // ==========================================
  openFilePicker(): void {
    this.fileInputEl()?.nativeElement.click();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.processFile(file);
    }
  }

  onDocumentSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.processFile(file);
    }
  }

  private processFile(file: File): void {
    const allowed = ['.pdf', '.doc', '.docx'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowed.includes(ext)) {
      this.snackBar.open('Formato no válido. Solo se admiten archivos PDF o DOC/DOCX.', 'Cerrar', { duration: 4000 });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.snackBar.open('El archivo supera el tamaño máximo permitido (10 MB).', 'Cerrar', { duration: 4000 });
      return;
    }

    this.uploadingDocument.set(true);
    this.storageService.upload(file, 'project_document').subscribe({
      next: (res) => {
        this.documentFileId.set(res.data.fileId);
        this.documentFileName.set(file.name);
        this.documentFileSize.set(file.size);
        this.uploadingDocument.set(false);
        this.snackBar.open('Oficio formal adjuntado exitosamente', 'OK', { duration: 2500 });
        this.saveToLocalStorage();
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
    this.documentFileSize.set(null);
    if (this.fileInputEl()) {
      this.fileInputEl()!.nativeElement.value = '';
    }
    this.saveToLocalStorage();
  }

  // ==========================================
  // GUARDAR BORRADOR & ENVIAR
  // ==========================================
  saveDraft(): void {
    this.submit(ProjectStatus.DRAFT);
  }

  publish(): void {
    if (!this.canSubmitForApproval()) {
      this.snackBar.open('Revisa los requisitos faltantes en el checklist antes de enviar a aprobación.', 'Cerrar', { duration: 4500 });
      return;
    }
    this.submit(ProjectStatus.PENDING_APPROVAL);
  }

  private submit(status: ProjectStatus): void {
    if (this.submitting()) return;
    this.submitting.set(true);

    const basic = this.basicInfoForm.getRawValue();
    const schedule = this.scheduleForm.getRawValue();
    const profile = this.profileForm.getRawValue();

    const createData: any = {
      title: basic.title,
      description: basic.description,
      projectType: basic.projectType,
      positionsAvailable: basic.positionsAvailable,
      locationType: basic.locationType,
      location: basic.locationType !== 'remote' ? (basic.location || undefined) : undefined,
      compensationType: basic.compensationType || undefined,
      compensationAmount: (basic.compensationType === 'paid' || basic.compensationType === 'stipend') ? (basic.compensationAmount || undefined) : undefined,
      currency: basic.currency || 'COP',
      startDate: schedule.startDate ? new Date(schedule.startDate).toISOString() : undefined,
      endDate: schedule.endDate ? new Date(schedule.endDate).toISOString() : undefined,
      applicationDeadline: schedule.applicationDeadline ? new Date(schedule.applicationDeadline).toISOString() : undefined,
      weeklyHours: schedule.weeklyHours || undefined,
      totalHours: schedule.totalHours || undefined,
      academicPrograms: profile.academicPrograms || [],
      minimumSemester: profile.minimumSemester || undefined,
      skills: this.skills().map((s) => ({
        name: s.name,
        catalogSkillId: s.catalogSkillId ?? undefined,
        category: s.category,
        proficiencyLevel: s.proficiencyLevel ?? undefined,
        isMandatory: s.isMandatory,
      })),
      requestDocumentFileId: this.documentFileId() ?? undefined,
    };

    this.projectService.create(createData).pipe(
      concatMap((res: any) => {
        const projectId = res?.data?.id || res?.id;
        if (!projectId) {
          throw new Error('No se pudo obtener el ID del proyecto creado.');
        }

        const validReqs = this.requirements().filter((r) => r.name && r.name.trim().length > 0);
        const requirementsRequests = validReqs.map((req) => {
          const reqDto = {
            requirementType: req.type,
            name: req.name,
            isMandatory: req.isMandatory ?? false,
            proficiencyLevel: req.proficiencyLevel,
          };
          return this.projectService.addRequirement(projectId, reqDto).pipe(catchError(() => of(null)));
        });

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
          status === ProjectStatus.PENDING_APPROVAL
            ? '¡Convocatoria enviada exitosamente a revisión institucional!'
            : 'Borrador guardado en tus proyectos.',
          'OK',
          { duration: 4000 }
        );
        this.router.navigate(['/my-projects']);
      },
      error: (err) => {
        console.error('Detalles del error al crear proyecto:', err);
        let errorMsg = 'Ocurrió un error al guardar la convocatoria.';
        if (err.error?.message) {
          errorMsg = Array.isArray(err.error.message) ? err.error.message.join(', ') : err.error.message;
        }
        this.submitting.set(false);
        this.snackBar.open(errorMsg, 'Cerrar', { duration: 6000 });
      },
    });
  }

  // ==========================================
  // PERSISTENCIA LOCAL (AUTOGUARDADO / BORRADOR)
  // ==========================================
  saveToLocalStorage(): void {
    const draft = {
      basicInfo: this.basicInfoForm.getRawValue(),
      schedule: this.scheduleForm.getRawValue(),
      profile: this.profileForm.getRawValue(),
      requirements: this.requirements(),
      skills: this.skills(),
      documentFileId: this.documentFileId(),
      documentFileName: this.documentFileName(),
      documentFileSize: this.documentFileSize(),
      savedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      this.lastSavedTime.set(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      this.hasDraftInStorage.set(true);
    } catch {
      // Ignorar quota exceeded
    }
  }

  private loadDraft(): void {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;

    try {
      const draft = JSON.parse(raw);

      if (draft.basicInfo) {
        this.basicInfoForm.patchValue(draft.basicInfo);
      } else if (draft.info) {
        // Compatibilidad con borradores anteriores
        this.basicInfoForm.patchValue({
          title: draft.info.title || '',
          description: draft.info.description || '',
          projectType: draft.info.projectType || ProjectType.PROFESSIONAL_PRACTICE,
          positionsAvailable: draft.info.positionsAvailable || 1,
          locationType: draft.info.isRemote ? 'remote' : 'onsite',
          location: draft.info.location || '',
        });
      }

      if (draft.schedule) {
        this.scheduleForm.patchValue(draft.schedule);
      } else if (draft.info) {
        this.scheduleForm.patchValue({
          startDate: draft.info.startDate || '',
          endDate: draft.info.endDate || '',
          applicationDeadline: draft.info.applicationDeadline || '',
          weeklyHours: draft.info.weeklyHours || 20,
          totalHours: draft.info.totalHours || null,
        });
      }

      if (draft.profile) {
        this.profileForm.patchValue(draft.profile);
      } else if (draft.info) {
        this.profileForm.patchValue({
          academicPrograms: draft.info.academicPrograms || [],
          minimumSemester: draft.info.minimumSemester || 6,
        });
      }

      if (draft.requirements) this.requirements.set(draft.requirements);
      if (draft.skills) this.skills.set(draft.skills);
      if (draft.documentFileId) this.documentFileId.set(draft.documentFileId);
      if (draft.documentFileName) this.documentFileName.set(draft.documentFileName);
      if (draft.documentFileSize) this.documentFileSize.set(draft.documentFileSize);

      if (draft.savedAt) {
        this.lastSavedTime.set(new Date(draft.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
      this.hasDraftInStorage.set(true);

      const progs = this.profileForm.get('academicPrograms')?.value;
      if (progs && progs.length > 0) {
        this.loadSkillCatalog(progs);
      }
    } catch {
      localStorage.removeItem(DRAFT_KEY);
    }
  }

  isFormDirty(): boolean {
    return (
      this.basicInfoForm.dirty ||
      this.scheduleForm.dirty ||
      this.profileForm.dirty ||
      this.skills().length > 0 ||
      !!this.documentFileId()
    );
  }

  goBack(): void {
    if (this.isFormDirty()) {
      const ref = this.dialog.open(ConfirmDialogComponent, {
        data: {
          title: '¿Regresar a Mis Proyectos?',
          message: 'Tu progreso actual queda guardado localmente en este equipo. Podrás retomarlo cuando regreses.',
          confirmText: 'Volver a la lista',
          cancelText: 'Continuar editando',
          type: 'info',
        },
      });
      ref.afterClosed().subscribe((confirmed) => {
        if (confirmed) this.router.navigate(['/my-projects']);
      });
    } else {
      this.router.navigate(['/my-projects']);
    }
  }

  discardDraft(): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: '¿Descartar este borrador?',
        message: 'Se borrarán todos los datos ingresados y el formulario volverá a su estado inicial. Esta acción no se puede deshacer.',
        confirmText: 'Sí, descartar borrador',
        cancelText: 'Cancelar',
        type: 'danger',
      },
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        localStorage.removeItem(DRAFT_KEY);
        this.basicInfoForm.reset({
          title: '',
          description: '',
          projectType: ProjectType.PROFESSIONAL_PRACTICE,
          positionsAvailable: 1,
          locationType: 'remote',
          location: '',
          compensationType: CompensationType.UNPAID,
          compensationAmount: null,
          currency: 'COP',
        });
        this.scheduleForm.reset({
          applicationDeadline: '',
          startDate: '',
          endDate: '',
          weeklyHours: 20,
          totalHours: null,
        });
        this.profileForm.reset({
          academicPrograms: [],
          minimumSemester: 6,
        });
        this.skills.set([]);
        this.requirements.set([]);
        this.clearDocument();
        this.hasDraftInStorage.set(false);
        this.lastSavedTime.set(null);
        this.stepperRef()?.reset();
        this.snackBar.open('Borrador descartado correctamente', 'OK', { duration: 2500 });
      }
    });
  }
}
