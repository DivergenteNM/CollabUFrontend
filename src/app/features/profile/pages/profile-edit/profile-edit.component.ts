import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Observable, of, switchMap, tap } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import {
  ApiResponse,
  CompanyProfile,
  CompanyContact,
  CompanyLocation,
  CompanyBusinessArea,
  UserProfile,
  AcademicProgram,
  StudentDocument,
} from '../../../../core/models';
import { AuthStore } from '../../../../state/auth.store';
import { StudentService } from '../../../students/services/student.service';
import { CompanyProfileService } from '../../../../core/services/company-profile.service';
import { UserProfileService } from '../../../../core/services/user-profile.service';
import { FacultyService } from '../../../faculty/services/faculty.service';
import { AdminService } from '../../../admin/services/admin.service';

import { AvatarUploadComponent } from '../../../../shared/components/ui/avatar-upload/avatar-upload.component';
import { FileUploadComponent } from '../../../../shared/components/ui/file-upload/file-upload.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../../shared/components/ui/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-profile-edit',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink, ReactiveFormsModule, FormsModule, DatePipe,
    MatIconModule, MatButtonModule, MatCardModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatSnackBarModule, MatTabsModule, MatCheckboxModule,
    AvatarUploadComponent, FileUploadComponent,
  ],
  templateUrl: './profile-edit.component.html',
  styleUrl: './profile-edit.component.scss',
})
export class ProfileEditComponent implements OnInit {
  readonly authStore = inject(AuthStore);
  private readonly fb = inject(FormBuilder);
  private readonly studentService = inject(StudentService);
  private readonly companyProfileService = inject(CompanyProfileService);
  private readonly userProfileService = inject(UserProfileService);
  private readonly facultyService = inject(FacultyService);
  private readonly adminService = inject(AdminService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  readonly saving = signal(false);
  readonly userProfileExists = signal(false);
  readonly roleProfileExists = signal(false);

  // ── Documentos y Hoja de Vida (CV) para Perfil Base ──
  readonly documents = signal<StudentDocument[]>([]);
  readonly loadingDocs = signal(false);
  readonly uploadingDoc = signal(false);
  readonly deletingDoc = signal(false);
  readonly selectedDocType = signal<StudentDocument['documentType']>('resume');

  readonly activeCv = computed(() => {
    const docs = this.documents();
    const resumeDoc = docs.find((d) => d.documentType === 'resume');
    if (resumeDoc) return resumeDoc;
    const formCvUrl = this.studentForm.controls['cvUrl']?.value;
    if (formCvUrl && typeof formCvUrl === 'string' && formCvUrl.trim()) {
      return {
        id: 'custom_cv',
        fileId: 'custom_cv',
        documentType: 'resume' as const,
        originalName: 'Curriculum Vitae (Enlace registrado)',
        fileUrl: formCvUrl.trim(),
        uploadedAt: '',
      };
    }
    return null;
  });

  readonly programs = signal<AcademicProgram[]>([]);
  /** programId real seleccionado — fuente de verdad al guardar, igual que en onboarding-flow. */
  readonly selectedProgramId = signal<string | null>(null);
  /** Texto de programa legacy que no matchea ningún programa del catálogo real. */
  readonly unrecognizedLegacyProgram = signal<string | null>(null);

  readonly semesters = Array.from({ length: 12 }, (_, i) => i + 1);

  readonly userForm: FormGroup = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    phone: [''],
    bio: [''],
    linkedinUrl: ['', [this.optionalLinkedInValidator()]],
  });

  readonly studentForm: FormGroup = this.fb.group({
    studentCode: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9-]+$/)]],
    bio: [''],
    program: [''],
    semester: [null],
    faculty: [''],
    enrollmentYear: [null],
    expectedGraduationYear: [null],
    gpa: [null],
    totalCreditsCompleted: [null],
    totalCreditsRequired: [null],
    headline: [''],
    cvUrl: [''],
    availability: [''],
    preferredWorkMode: [''],
    availableHoursPerWeek: [null],
    willingToRelocate: [false],
    githubUrl: [''],
    portfolioUrl: [''],
    personalWebsiteUrl: [''],
  });

  // Nested entities
  readonly languages = signal<any[]>([]);
  newLangName = '';
  newLangLevel = 'basic';

  readonly interests = signal<any[]>([]);
  newInterestName = '';

  readonly educationList = signal<any[]>([]);
  newEduInstitution = '';
  newEduDegree = '';
  newEduStartDate = '';

  readonly experiences = signal<any[]>([]);
  newExpTitle = '';
  newExpType = 'work';
  newExpStartDate = '';

  readonly companyForm: FormGroup = this.fb.group({
    companyName: ['', Validators.required],
    legalName: [''],
    nit: ['', [Validators.required, Validators.minLength(5)]],
    description: ['', [Validators.required, Validators.minLength(20)]],
    industry: ['', Validators.required],
    companySize: [''],
    foundedYear: [null],
    employeeCount: [null],
    headquartersCity: ['', Validators.required],
    headquartersState: [''],
    website: ['', [this.optionalHttpUrlValidator('website')]],
  });

  // Company nested signals
  readonly companyLogoUrl = signal<string | null>(null);
  readonly companyContacts = signal<CompanyContact[]>([]);
  readonly companyLocations = signal<CompanyLocation[]>([]);
  readonly companyBusinessAreas = signal<CompanyBusinessArea[]>([]);

  // New company contact form fields
  newContactFirstName = '';
  newContactLastName = '';
  newContactEmail = '';
  newContactPosition = '';
  newContactPhone = '';
  newContactIsPrimary = false;

  // New company location form fields
  newLocationCity = '';
  newLocationName = '';
  newLocationAddress = '';
  newLocationState = '';
  newLocationIsHeadquarters = false;

  // New company business area fields
  newAreaName = '';
  newAreaDescription = '';

  readonly supervisorRoles = [
    { value: 'faculty_supervisor', label: 'Supervisor de Facultad' },
    { value: 'internship_coordinator', label: 'Coordinador de Pasantías' },
    { value: 'thesis_advisor', label: 'Asesor de Tesis' },
    { value: 'academic_director', label: 'Director Académico' },
  ] as const;

  readonly facultyForm: FormGroup = this.fb.group({
    employeeCode: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9-]+$/)]],
    department: ['', [Validators.required, Validators.minLength(2)]],
    role: ['', Validators.required],
    specialization: [''],
  });

  ngOnInit(): void {
    this.userProfileService.getMyProfile().subscribe({
      next: (resp) => {
        this.userProfileExists.set(true);
        this.userForm.patchValue({
          firstName: resp.data.firstName ?? '',
          lastName: resp.data.lastName ?? '',
          phone: resp.data.phone ?? '',
          bio: resp.data.bio ?? '',
          linkedinUrl: resp.data.linkedinUrl ?? '',
        });
      },
      error: (error: HttpErrorResponse) => {
        if (error.status !== 404) {
          this.snackBar.open('No se pudo cargar el perfil base', 'Cerrar', { duration: 3500 });
        }
      },
    });

    if (this.authStore.isStudent()) {
      this.loadStudentDocuments();
      this.adminService.getPrograms(true).subscribe({
        next: (programs) => {
          this.programs.set(programs);
          this.resolveLegacyProgramIfNeeded();
        },
        error: () => {},
      });

      this.studentService.getProfile().subscribe({
        next: (resp) => {
          this.roleProfileExists.set(true);
          const s = resp.data;
          this.selectedProgramId.set(s.programId ?? null);
          this.studentForm.patchValue({
            studentCode: s.studentCode ?? '',
            bio: s.bio ?? '',
            program: s.program ?? '',
            semester: s.semester,
            faculty: s.faculty ?? '',
            enrollmentYear: s.enrollmentYear,
            expectedGraduationYear: s.expectedGraduationYear,
            gpa: s.gpa,
            totalCreditsCompleted: s.totalCreditsCompleted,
            totalCreditsRequired: s.totalCreditsRequired,
            headline: s.headline ?? '',
            cvUrl: s.cvUrl ?? '',
            availability: s.availability ?? '',
            preferredWorkMode: s.preferredWorkMode ?? '',
            availableHoursPerWeek: s.availableHoursPerWeek,
            willingToRelocate: s.willingToRelocate ?? false,
            githubUrl: s.githubUrl ?? '',
            portfolioUrl: s.portfolioUrl ?? '',
            personalWebsiteUrl: s.personalWebsiteUrl ?? '',
          });
          this.resolveLegacyProgramIfNeeded();

          // Load nested entities
          this.studentService.getLanguages().subscribe(res => this.languages.set(res.data));
          this.studentService.getInterests().subscribe(res => this.interests.set(res.data));
          this.studentService.getEducation().subscribe(res => this.educationList.set(res.data));
          this.studentService.getExperiences().subscribe(res => this.experiences.set(res.data));
        },
        error: (error: HttpErrorResponse) => {
          if (error.status !== 404) {
            this.snackBar.open('No se pudo cargar el perfil de estudiante', 'Cerrar', { duration: 3500 });
          }
        },
      });
    }

    if (this.authStore.isCompany()) {
      this.companyProfileService.getProfile().subscribe({
        next: (resp) => {
          this.roleProfileExists.set(true);
          const c = resp.data;
          this.companyLogoUrl.set(c.logoUrl ?? this.authStore.profile()?.avatarUrl ?? null);
          this.companyContacts.set(c.contacts ?? []);
          this.companyLocations.set(c.locations ?? []);
          this.companyBusinessAreas.set(c.businessAreas ?? []);
          this.companyForm.patchValue({
            companyName: c.companyName ?? '',
            legalName: c.legalName ?? '',
            nit: c.nit ?? '',
            description: c.description ?? '',
            industry: c.industry ?? '',
            companySize: c.companySize ?? '',
            foundedYear: c.foundedYear ?? null,
            employeeCount: c.employeeCount ?? null,
            headquartersCity: c.headquartersCity ?? c.city ?? '',
            headquartersState: c.headquartersState ?? c.department ?? '',
            website: c.website ?? c.websiteUrl ?? '',
          });
        },
        error: (error: HttpErrorResponse) => {
          if (error.status !== 404) {
            this.snackBar.open('No se pudo cargar el perfil de empresa', 'Cerrar', { duration: 3500 });
          }
        },
      });
    }

    if (this.authStore.isFaculty()) {
      this.facultyService.getMyProfile().subscribe({
        next: (res) => {
          this.roleProfileExists.set(true);
          this.facultyForm.patchValue({
            employeeCode: res.employeeCode ?? '',
            department: res.department ?? '',
            role: res.role ?? '',
            specialization: res.specialization ?? '',
          });
        },
        error: (error: HttpErrorResponse) => {
          if (error.status !== 404) {
            this.snackBar.open('No se pudo cargar el perfil de docente', 'Cerrar', { duration: 3500 });
          }
        },
      });
    }
  }

  /**
   * Resuelve programId por nombre normalizado cuando el perfil no trae uno (dato legacy) — mismo
   * criterio que el backend (`student.service.ts:resolveProgramId`). Requiere que tanto el catálogo
   * como el perfil ya hayan cargado; se llama desde ambos callbacks, es seguro llamarla dos veces.
   */
  private resolveLegacyProgramIfNeeded(): void {
    if (this.selectedProgramId() || this.programs().length === 0) return;
    const programText = this.studentForm.controls['program'].value as string;
    if (!programText) return;

    const norm = programText.toLowerCase().trim();
    const match = this.programs().find((p) => p.name.toLowerCase().trim() === norm);
    if (match) {
      this.selectedProgramId.set(match.id);
    } else {
      this.unrecognizedLegacyProgram.set(programText);
    }
  }

  /** Se dispara al cambiar el programa en el select — fija el programId real. */
  onProgramChange(programName: string): void {
    const programId = this.programs().find((p) => p.name === programName)?.id ?? null;
    this.selectedProgramId.set(programId);
    this.unrecognizedLegacyProgram.set(null);
  }

  saveBaseProfile(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.upsertUserProfile().subscribe({
      next: () => {
        this.authStore.refreshProfile();
        this.saving.set(false);
        this.snackBar.open('Perfil base actualizado', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/profile/view']);
      },
      error: (error: unknown) => {
        this.handleSaveError(error, 'No se pudo actualizar el perfil base');
        this.saving.set(false);
      },
    });
  }

  // ── Documentos y CV en Perfil Base ──

  loadStudentDocuments(): void {
    this.loadingDocs.set(true);
    this.studentService.getDocuments().subscribe({
      next: (resp) => {
        this.documents.set(resp.data);
        this.loadingDocs.set(false);
      },
      error: () => this.loadingDocs.set(false),
    });
  }

  onDocumentSelected(files: File[]): void {
    if (!files || files.length === 0) return;
    const file = files[0];
    const type = this.selectedDocType();

    this.uploadingDoc.set(true);
    this.studentService.uploadDocument(file, type).subscribe({
      next: (resp) => {
        this.uploadingDoc.set(false);
        const newDoc = resp.data;
        this.documents.update((list) => [
          ...(type === 'resume' ? list.filter((d) => d.documentType !== 'resume') : list),
          newDoc,
        ]);

        if (type === 'resume') {
          this.studentForm.patchValue({ cvUrl: newDoc.fileUrl });
          this.snackBar.open('¡Curriculum Vitae (CV) subido y vinculado a tu perfil!', 'Cerrar', { duration: 3500 });
        } else {
          this.snackBar.open('Documento subido exitosamente', 'Cerrar', { duration: 3000 });
        }
      },
      error: () => {
        this.uploadingDoc.set(false);
        this.snackBar.open('Error al subir el documento. Intenta nuevamente.', 'Cerrar', { duration: 3500 });
      },
    });
  }

  onDeleteDocument(doc: StudentDocument): void {
    const isCv = doc.documentType === 'resume';
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: isCv ? 'Eliminar Curriculum Vitae (CV)' : 'Eliminar Documento',
        message: `¿Estás seguro de eliminar "${doc.originalName}"?`,
        confirmText: 'Eliminar',
        type: 'danger',
      } satisfies ConfirmDialogData,
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.deletingDoc.set(true);
      this.studentService.deleteDocument(doc.id, isCv).subscribe({
        next: () => {
          this.documents.update((list) => list.filter((d) => d.id !== doc.id));
          if (isCv) {
            this.studentForm.patchValue({ cvUrl: '' });
          }
          this.deletingDoc.set(false);
          this.snackBar.open('Documento eliminado', 'Cerrar', { duration: 2500 });
        },
        error: () => {
          this.deletingDoc.set(false);
          this.snackBar.open('Error al eliminar el documento', 'Cerrar', { duration: 3000 });
        },
      });
    });
  }

  docTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      resume: 'Hoja de Vida (CV)',
      transcript: 'Certificado de Notas',
      certificate: 'Certificado Académico',
      id_document: 'Documento de Identidad',
      other: 'Otro Soporte',
    };
    return labels[type] ?? type;
  }

  cleanUrl(url?: string | null): string | null {
    if (!url) return null;
    return url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
  }

  saveStudent(): void {
    if (this.userForm.invalid || this.studentForm.invalid) {
      this.userForm.markAllAsTouched();
      this.studentForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);

    this.upsertUserProfile().pipe(
      switchMap(() => {
        const payload = { ...this.studentForm.getRawValue(), programId: this.selectedProgramId() ?? undefined };
        return this.roleProfileExists()
          ? this.studentService.updateProfile(payload)
          : this.studentService.createProfile(payload).pipe(
            tap(() => this.roleProfileExists.set(true)),
          );
      }),
    ).subscribe({
      next: () => {
        this.authStore.refreshProfile();
        this.saving.set(false);
        this.snackBar.open('Perfil actualizado exitosamente', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/profile/view']);
      },
      error: (error: unknown) => {
        this.handleSaveError(error, 'No se pudo actualizar el perfil de estudiante');
        this.saving.set(false);
      },
    });
  }

  saveCompany(): void {
    if (this.userForm.invalid || this.companyForm.invalid) {
      this.userForm.markAllAsTouched();
      this.companyForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);

    this.upsertUserProfile().pipe(
      switchMap(() => {
        const payload = this.buildCompanyPayload();
        return this.roleProfileExists()
          ? this.companyProfileService.updateProfile(payload)
          : this.companyProfileService.createProfile(payload).pipe(
            tap(() => this.roleProfileExists.set(true)),
          );
      }),
    ).subscribe({
      next: () => {
        this.authStore.refreshProfile();
        this.saving.set(false);
        this.snackBar.open('Perfil actualizado exitosamente', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/profile/view']);
      },
      error: (error: unknown) => {
        this.handleSaveError(error, 'No se pudo actualizar el perfil de empresa');
        this.saving.set(false);
      },
    });
  }

  saveFaculty(): void {
    if (this.userForm.invalid || this.facultyForm.invalid) {
      this.userForm.markAllAsTouched();
      this.facultyForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);

    this.upsertUserProfile().pipe(
      switchMap(() => {
        const raw = this.facultyForm.getRawValue();
        const payload = {
          employeeCode: raw.employeeCode,
          department: raw.department,
          role: raw.role as any,
          specialization: raw.specialization || undefined,
        };
        return this.facultyService.updateMyProfile(payload);
      }),
    ).subscribe({
      next: () => {
        this.authStore.refreshProfile();
        this.saving.set(false);
        this.snackBar.open('Perfil de docente actualizado', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/profile/view']);
      },
      error: (error: unknown) => {
        this.handleSaveError(error, 'No se pudo actualizar el perfil de docente');
        this.saving.set(false);
      },
    });
  }

  private upsertUserProfile(): Observable<ApiResponse<UserProfile> | null> {
    const role = this.authStore.role();
    const userId = this.authStore.user()?.id;
    if (!role || !userId) {
      return of(null);
    }

    const payload = this.buildUserPayload();

    if (this.userProfileExists()) {
      return this.userProfileService.updateProfile(payload);
    }

    return this.userProfileService.createProfile({ userId, role, ...payload }).pipe(
      tap(() => this.userProfileExists.set(true)),
    );
  }

  private handleSaveError(error: unknown, defaultMessage: string): void {
    const message = error instanceof HttpErrorResponse
      ? (error.error?.message ?? defaultMessage)
      : defaultMessage;

    this.snackBar.open(message, 'Cerrar', { duration: 4200 });
  }

  private buildUserPayload() {
    const raw = this.userForm.getRawValue();

    return {
      firstName: raw.firstName,
      lastName: raw.lastName,
      phone: this.normalizeOptionalText(raw.phone),
      bio: this.normalizeOptionalText(raw.bio),
      linkedinUrl: this.normalizeOptionalText(raw.linkedinUrl),
    };
  }

  onCompanyLogoChanged(newLogoUrl: string | null): void {
    this.companyLogoUrl.set(newLogoUrl);
  }

  private buildCompanyPayload() {
    const raw = this.companyForm.getRawValue();

    return {
      companyName: raw.companyName,
      legalName: this.normalizeOptionalText(raw.legalName),
      nit: raw.nit,
      description: raw.description,
      industry: raw.industry,
      companySize: this.normalizeOptionalText(raw.companySize) as CompanyProfile['companySize'] | undefined,
      foundedYear: raw.foundedYear ? Number(raw.foundedYear) : undefined,
      employeeCount: raw.employeeCount ? Number(raw.employeeCount) : undefined,
      headquartersCity: raw.headquartersCity,
      headquartersState: this.normalizeOptionalText(raw.headquartersState),
      website: this.normalizeOptionalText(raw.website),
      logoUrl: this.companyLogoUrl() || undefined,
    };
  }

  addCompanyContact(): void {
    if (!this.newContactFirstName?.trim() || !this.newContactLastName?.trim() || !this.newContactEmail?.trim()) {
      this.snackBar.open('Ingresa nombres, apellidos y correo electrónico del contacto', 'Cerrar', { duration: 3000 });
      return;
    }
    this.companyProfileService.addContact({
      firstName: this.newContactFirstName.trim(),
      lastName: this.newContactLastName.trim(),
      email: this.newContactEmail.trim(),
      position: this.normalizeOptionalText(this.newContactPosition),
      phone: this.normalizeOptionalText(this.newContactPhone),
      isPrimary: this.newContactIsPrimary,
    }).subscribe({
      next: (res) => {
        this.companyContacts.update(c => [...c, res.data]);
        this.newContactFirstName = '';
        this.newContactLastName = '';
        this.newContactEmail = '';
        this.newContactPosition = '';
        this.newContactPhone = '';
        this.newContactIsPrimary = false;
        this.snackBar.open('Contacto registrado', 'Cerrar', { duration: 2500 });
      },
      error: () => {
        this.snackBar.open('No se pudo registrar el contacto', 'Cerrar', { duration: 3000 });
      },
    });
  }

  removeCompanyContact(id: string): void {
    this.companyProfileService.deleteContact(id).subscribe({
      next: () => {
        this.companyContacts.update(c => c.filter(item => item.id !== id));
        this.snackBar.open('Contacto eliminado', 'Cerrar', { duration: 2500 });
      },
      error: () => {
        this.snackBar.open('No se pudo eliminar el contacto', 'Cerrar', { duration: 3000 });
      },
    });
  }

  addCompanyLocation(): void {
    if (!this.newLocationCity?.trim()) {
      this.snackBar.open('La ciudad de la sede es requerida', 'Cerrar', { duration: 3000 });
      return;
    }
    this.companyProfileService.addLocation({
      city: this.newLocationCity.trim(),
      name: this.normalizeOptionalText(this.newLocationName),
      address: this.normalizeOptionalText(this.newLocationAddress),
      state: this.normalizeOptionalText(this.newLocationState),
      isHeadquarters: this.newLocationIsHeadquarters,
    }).subscribe({
      next: (res) => {
        this.companyLocations.update(l => [...l, res.data]);
        this.newLocationCity = '';
        this.newLocationName = '';
        this.newLocationAddress = '';
        this.newLocationState = '';
        this.newLocationIsHeadquarters = false;
        this.snackBar.open('Sede agregada', 'Cerrar', { duration: 2500 });
      },
      error: () => {
        this.snackBar.open('No se pudo agregar la sede', 'Cerrar', { duration: 3000 });
      },
    });
  }

  removeCompanyLocation(id: string): void {
    this.companyProfileService.deleteLocation(id).subscribe({
      next: () => {
        this.companyLocations.update(l => l.filter(item => item.id !== id));
        this.snackBar.open('Sede eliminada', 'Cerrar', { duration: 2500 });
      },
      error: () => {
        this.snackBar.open('No se pudo eliminar la sede', 'Cerrar', { duration: 3000 });
      },
    });
  }

  addCompanyBusinessArea(): void {
    if (!this.newAreaName?.trim()) {
      this.snackBar.open('El nombre del área es requerido', 'Cerrar', { duration: 3000 });
      return;
    }
    this.companyProfileService.addBusinessArea({
      areaName: this.newAreaName.trim(),
      description: this.normalizeOptionalText(this.newAreaDescription),
    }).subscribe({
      next: (res) => {
        this.companyBusinessAreas.update(a => [...a, res.data]);
        this.newAreaName = '';
        this.newAreaDescription = '';
        this.snackBar.open('Área de negocio registrada', 'Cerrar', { duration: 2500 });
      },
      error: () => {
        this.snackBar.open('No se pudo registrar el área', 'Cerrar', { duration: 3000 });
      },
    });
  }

  removeCompanyBusinessArea(id: string): void {
    this.companyProfileService.deleteBusinessArea(id).subscribe({
      next: () => {
        this.companyBusinessAreas.update(a => a.filter(item => item.id !== id));
        this.snackBar.open('Área eliminada', 'Cerrar', { duration: 2500 });
      },
      error: () => {
        this.snackBar.open('No se pudo eliminar el área', 'Cerrar', { duration: 3000 });
      },
    });
  }

  // Nested entities handlers
  addLanguage() {
    if(!this.newLangName) return;
    this.studentService.addLanguage({ language: this.newLangName, proficiency: this.newLangLevel }).subscribe(res => {
      this.languages.update(l => [...l, res.data]);
      this.newLangName = '';
      this.newLangLevel = 'basic';
    });
  }

  removeLanguage(id: string) {
    this.studentService.removeLanguage(id).subscribe(() => {
      this.languages.update(l => l.filter(x => x.id !== id));
    });
  }

  addInterest() {
    if(!this.newInterestName) return;
    this.studentService.addInterest({ area: this.newInterestName }).subscribe(res => {
      this.interests.update(l => [...l, res.data]);
      this.newInterestName = '';
    });
  }

  removeInterest(id: string) {
    this.studentService.removeInterest(id).subscribe(() => {
      this.interests.update(l => l.filter(x => x.id !== id));
    });
  }

  addEducation() {
    if(!this.newEduInstitution || !this.newEduDegree || !this.newEduStartDate) return;
    this.studentService.addEducation({
      institution: this.newEduInstitution,
      degree: this.newEduDegree,
      startDate: this.newEduStartDate,
      isCurrent: true
    }).subscribe(res => {
      this.educationList.update(l => [...l, res.data]);
      this.newEduInstitution = '';
      this.newEduDegree = '';
      this.newEduStartDate = '';
    });
  }

  removeEducation(id: string) {
    this.studentService.removeEducation(id).subscribe(() => {
      this.educationList.update(l => l.filter(x => x.id !== id));
    });
  }

  addExperience() {
    if(!this.newExpTitle || !this.newExpStartDate) return;
    this.studentService.addExperience({
      title: this.newExpTitle,
      type: this.newExpType as any,
      startDate: this.newExpStartDate,
      isCurrent: true
    }).subscribe(res => {
      this.experiences.update(l => [...l, res.data]);
      this.newExpTitle = '';
      this.newExpStartDate = '';
    });
  }

  removeExperience(id: string) {
    this.studentService.removeExperience(id).subscribe(() => {
      this.experiences.update(l => l.filter(x => x.id !== id));
    });
  }

  levelLabel(level?: string): string {
    const labels: Record<string, string> = {
      basic: 'Básico',
      intermediate: 'Intermedio',
      advanced: 'Avanzado',
      native: 'Nativo',
    };
    return (level && labels[level]) ?? level ?? '';
  }

  formatExpType(type?: string): string {
    const labels: Record<string, string> = {
      professional: 'Profesional',
      academic: 'Académica',
      volunteer: 'Voluntariado',
      personal_project: 'Proyecto Personal',
    };
    return (type && labels[type]) ?? type ?? '';
  }

  private normalizeOptionalText(value: string | null | undefined): string | undefined {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  }

  private isValidHttpUrl(value: string): boolean {
    try {
      const parsed = new URL(value);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  private optionalHttpUrlValidator(errorKey: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = this.normalizeOptionalText(control.value as string | null | undefined);
      if (!value) return null;

      return this.isValidHttpUrl(value) ? null : { [errorKey]: true };
    };
  }

  private optionalLinkedInValidator(): ValidatorFn {
    const linkedInRegex = /^https?:\/\/(www\.)?linkedin\.com\/.+/i;

    return (control: AbstractControl): ValidationErrors | null => {
      const value = this.normalizeOptionalText(control.value as string | null | undefined);
      if (!value) return null;

      return linkedInRegex.test(value) ? null : { linkedinUrl: true };
    };
  }
}
