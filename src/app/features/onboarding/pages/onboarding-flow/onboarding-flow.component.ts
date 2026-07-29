import { HttpErrorResponse } from '@angular/common/http';
import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { CompanyProfile, StudentProfile, StudentSkill } from '../../../../core/models';
import { UserRole } from '../../../../core/enums';
import { CompanyProfileService } from '../../../../core/services/company-profile.service';
import { UserProfileService } from '../../../../core/services/user-profile.service';
import { StudentService } from '../../../students/services/student.service';
import { AuthStore } from '../../../../state/auth.store';
import { FacultyService } from '../../../faculty/services/faculty.service';

import { AvatarUploadComponent } from '../../../../shared/components/ui/avatar-upload/avatar-upload.component';

@Component({
  selector: 'app-onboarding-flow',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatStepperModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    AvatarUploadComponent,
  ],
  templateUrl: './onboarding-flow.component.html',
  styleUrl: './onboarding-flow.component.scss',
})
export class OnboardingFlowComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly authStore = inject(AuthStore);
  private readonly userProfileService = inject(UserProfileService);
  private readonly studentService = inject(StudentService);
  private readonly companyProfileService = inject(CompanyProfileService);
  private readonly facultyService = inject(FacultyService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly submitting = signal(false);

  readonly studentPrograms = [
    'Ingeniería de Sistemas',
    'Ingeniería Civil',
    'Ingeniería Electrónica',
  ] as const;

  readonly supervisorRoles = [
    { value: 'faculty_supervisor', label: 'Supervisor de Facultad' },
    { value: 'internship_coordinator', label: 'Coordinador de Pasantías' },
    { value: 'thesis_advisor', label: 'Asesor de Tesis' },
    { value: 'academic_director', label: 'Director Académico' },
  ] as const;

  readonly userProfileExists = signal(false);
  readonly roleProfileExists = signal(false);

  readonly existingSkills = signal(0);
  readonly existingExperiences = signal(0);
  readonly existingEducation = signal(0);
  readonly existingContacts = signal(0);
  readonly existingBusinessAreas = signal(0);

  readonly onboardingCompleted = computed(() => {
    return this.authStore.profileLoaded() && !this.authStore.onboardingRequired();
  });

  readonly userForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    phone: [''],
    bio: [''],
    linkedinUrl: ['', [this.optionalLinkedInValidator()]],
  });

  readonly studentForm = this.fb.nonNullable.group({
    studentCode: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9-]+$/)]],
    program: ['', [Validators.required, this.allowedProgramValidator()]],
    semester: [1, [Validators.required, Validators.min(1), Validators.max(16)]],
    bio: ['', [Validators.required, Validators.minLength(10)]],
    githubUrl: ['', [this.optionalGithubValidator()]],
    portfolioUrl: ['', [this.optionalHttpUrlValidator('portfolioUrl')]],
  });

  readonly skillForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    category: ['technical', Validators.required],
    proficiencyLevel: ['intermediate', Validators.required],
  });

  readonly educationForm = this.fb.nonNullable.group({
    institution: ['', [Validators.required, Validators.minLength(2)]],
    degree: ['', [Validators.required, Validators.minLength(2)]],
    startDate: ['', Validators.required],
  });

  readonly companyForm = this.fb.nonNullable.group({
    companyName: ['', [Validators.required, Validators.minLength(2)]],
    nit: ['', [Validators.required, Validators.minLength(5)]],
    industry: ['', Validators.required],
    description: ['', [Validators.required, Validators.minLength(20)]],
    headquartersCity: ['', Validators.required],
    companySize: ['small'],
    website: ['', [this.optionalHttpUrlValidator('website')]],
  });

  readonly contactForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    position: [''],
    phone: [''],
  });

  readonly businessAreaForm = this.fb.nonNullable.group({
    areaName: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
  });

  readonly facultyForm = this.fb.nonNullable.group({
    employeeCode: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9-]+$/)]],
    department: ['', [Validators.required, Validators.minLength(2)]],
    role: ['', Validators.required],
    specialization: [''],
  });

  ngOnInit(): void {
    this.bootstrap();
  }

  get isStudent(): boolean {
    return this.authStore.role() === UserRole.STUDENT;
  }

  get isCompany(): boolean {
    return this.authStore.role() === UserRole.COMPANY;
  }

  get isFaculty(): boolean {
    return this.authStore.role() === UserRole.FACULTY;
  }

  async saveUserStep(stepper: MatStepper): Promise<void> {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const role = this.authStore.role();
    const userId = this.authStore.user()?.id;

    if (!role || !userId) {
      this.snackBar.open('No se pudo identificar al usuario autenticado', 'Cerrar', { duration: 3200 });
      return;
    }

    this.submitting.set(true);

    try {
      const payload = this.buildUserPayload();

      if (this.userProfileExists()) {
        await firstValueFrom(this.userProfileService.updateProfile(payload));
      } else {
        await firstValueFrom(this.userProfileService.createProfile({ userId, role, ...payload }));
        this.userProfileExists.set(true);
      }

      this.authStore.refreshProfile();
      this.snackBar.open('Perfil base actualizado', 'Cerrar', { duration: 2400 });
      stepper.next();
    } catch (error) {
      this.handleSaveError(error, 'No se pudo guardar el perfil base');
    } finally {
      this.submitting.set(false);
    }
  }

  async saveRoleProfileStep(stepper: MatStepper): Promise<void> {
    if (this.isStudent) {
      await this.saveStudentProfile(stepper);
      return;
    }

    if (this.isCompany) {
      await this.saveCompanyProfile(stepper);
      return;
    }

    if (this.isFaculty) {
      await this.saveFacultyProfile(stepper);
    }
  }

  async saveRoleRequirementsStep(stepper: MatStepper): Promise<void> {
    if (this.isStudent) {
      await this.saveStudentRequirements(stepper);
      return;
    }

    if (this.isCompany) {
      await this.saveCompanyRequirements(stepper);
    }
  }

  refreshStatus(): void {
    this.authStore.refreshProfile();
    this.snackBar.open('Estado actualizado. Si ya cumples requisitos, podrás continuar.', 'Cerrar', {
      duration: 3000,
    });
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  private async bootstrap(): Promise<void> {
    this.loading.set(true);
    this.authStore.refreshProfile();

    await Promise.all([
      this.tryLoadUserProfile(),
      this.tryLoadRoleProfile(),
      this.tryLoadRoleRequirements(),
    ]);

    this.loading.set(false);
  }

  private async tryLoadUserProfile(): Promise<void> {
    try {
      const response = await firstValueFrom(this.userProfileService.getMyProfile());
      this.userProfileExists.set(true);
      this.userForm.patchValue({
        firstName: response.data.firstName ?? '',
        lastName: response.data.lastName ?? '',
        phone: response.data.phone ?? '',
        bio: response.data.bio ?? '',
        linkedinUrl: response.data.linkedinUrl ?? '',
      });
      this.authStore.setProfile(response.data);
    } catch (error) {
      if (!this.isNotFound(error)) {
        console.warn('Error cargando perfil base', error);
      }
    }
  }

  private async tryLoadRoleProfile(): Promise<void> {
    if (this.isStudent) {
      try {
        const response = await firstValueFrom(this.studentService.getProfile());
        this.roleProfileExists.set(true);
        this.studentForm.patchValue({
          studentCode: response.data.studentCode ?? '',
          program: response.data.program ?? '',
          semester: response.data.semester ?? 1,
          bio: response.data.bio ?? '',
          githubUrl: response.data.githubUrl ?? '',
          portfolioUrl: response.data.portfolioUrl ?? '',
        });
      } catch (error) {
        if (!this.isNotFound(error)) {
          console.warn('Error cargando perfil de estudiante', error);
        }
      }
      return;
    }

    if (this.isCompany) {
      try {
        const response = await firstValueFrom(this.companyProfileService.getProfile());
        this.roleProfileExists.set(true);
        this.companyForm.patchValue({
          companyName: response.data.companyName ?? '',
          nit: response.data.nit ?? '',
          industry: response.data.industry ?? '',
          description: response.data.description ?? '',
          headquartersCity: response.data.headquartersCity ?? response.data.city ?? '',
          companySize: response.data.companySize ?? 'small',
          website: response.data.website ?? response.data.websiteUrl ?? '',
        });
      } catch (error) {
        if (!this.isNotFound(error)) {
          console.warn('Error cargando perfil de empresa', error);
        }
      }
      return;
    }

    if (this.isFaculty) {
      try {
        const response = await firstValueFrom(this.facultyService.getMyProfile());
        this.roleProfileExists.set(true);
        this.facultyForm.patchValue({
          employeeCode: response.employeeCode ?? '',
          department: response.department ?? '',
          role: response.role ?? '',
          specialization: response.specialization ?? '',
        });
      } catch (error) {
        if (!this.isNotFound(error)) {
          console.warn('Error cargando perfil de supervisor', error);
        }
      }
    }
  }

  private async tryLoadRoleRequirements(): Promise<void> {
    if (this.isStudent) {
      await this.loadStudentRequirements();
      return;
    }

    if (this.isCompany) {
      await this.loadCompanyRequirements();
    }
  }

  private async loadStudentRequirements(): Promise<void> {
    try {
      const [skills, experiences, education] = await Promise.all([
        firstValueFrom(this.studentService.getSkills()),
        firstValueFrom(this.studentService.getExperiences()),
        firstValueFrom(this.studentService.getEducation()),
      ]);

      this.existingSkills.set(skills.data.length);
      this.existingExperiences.set(experiences.data.length);
      this.existingEducation.set(education.data.length);
    } catch (error) {
      if (!this.isNotFound(error)) {
        console.warn('Error cargando requisitos de estudiante', error);
      }
    }
  }

  private async loadCompanyRequirements(): Promise<void> {
    try {
      const [contacts, areas] = await Promise.all([
        firstValueFrom(this.companyProfileService.getContacts()),
        firstValueFrom(this.companyProfileService.getBusinessAreas()),
      ]);

      this.existingContacts.set(contacts.data.length);
      this.existingBusinessAreas.set(areas.data.length);
    } catch (error) {
      if (!this.isNotFound(error)) {
        console.warn('Error cargando requisitos de empresa', error);
      }
    }
  }

  private async saveStudentProfile(stepper: MatStepper): Promise<void> {
    if (this.studentForm.invalid) {
      this.studentForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);

    try {
      const userId = this.authStore.user()?.id;
      if (!userId) {
        throw new Error('No se pudo resolver el userId para crear perfil de estudiante');
      }

      const createPayload = this.buildStudentCreatePayload(userId);
      const updatePayload = this.buildStudentUpdatePayload();

      if (this.roleProfileExists()) {
        await firstValueFrom(this.studentService.updateProfile(updatePayload));
      } else {
        await firstValueFrom(this.studentService.createProfile(createPayload));

        if (this.hasOptionalStudentLinks(updatePayload)) {
          await firstValueFrom(
            this.studentService.updateProfile({
              githubUrl: updatePayload.githubUrl,
              portfolioUrl: updatePayload.portfolioUrl,
            }),
          );
        }

        this.roleProfileExists.set(true);
      }

      await this.loadStudentRequirements();
      this.authStore.refreshProfile();
      this.snackBar.open('Perfil académico actualizado', 'Cerrar', { duration: 2400 });
      stepper.next();
    } catch (error) {
      this.handleSaveError(error, 'No se pudo guardar el perfil de estudiante');
    } finally {
      this.submitting.set(false);
    }
  }

  private async saveCompanyProfile(stepper: MatStepper): Promise<void> {
    if (this.companyForm.invalid) {
      this.companyForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);

    try {
      const raw = this.companyForm.getRawValue();
      const payload = {
        companyName: raw.companyName,
        nit: raw.nit,
        industry: raw.industry,
        description: raw.description,
        headquartersCity: raw.headquartersCity,
        companySize: raw.companySize as CompanyProfile['companySize'],
        website: this.normalizeOptionalText(raw.website),
      };

      if (this.roleProfileExists()) {
        await firstValueFrom(this.companyProfileService.updateProfile(payload));
      } else {
        await firstValueFrom(this.companyProfileService.createProfile(payload));
        this.roleProfileExists.set(true);
      }

      await this.loadCompanyRequirements();
      this.authStore.refreshProfile();
      this.snackBar.open('Perfil corporativo actualizado', 'Cerrar', { duration: 2400 });
      stepper.next();
    } catch (error) {
      this.handleSaveError(error, 'No se pudo guardar el perfil de empresa');
    } finally {
      this.submitting.set(false);
    }
  }

  private async saveFacultyProfile(stepper: MatStepper): Promise<void> {
    if (this.facultyForm.invalid) {
      this.facultyForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);

    try {
      const raw = this.facultyForm.getRawValue();
      const payload = {
        employeeCode: raw.employeeCode,
        department: raw.department,
        role: raw.role as 'academic_director' | 'internship_coordinator' | 'thesis_advisor' | 'faculty_supervisor',
        specialization: this.normalizeOptionalText(raw.specialization),
      };

      await firstValueFrom(this.facultyService.updateMyProfile(payload));
      this.roleProfileExists.set(true);
      this.authStore.refreshProfile();
      this.snackBar.open('Perfil de docente actualizado', 'Cerrar', { duration: 2400 });
      stepper.next();
    } catch (error) {
      this.handleSaveError(error, 'No se pudo guardar el perfil de docente');
    } finally {
      this.submitting.set(false);
    }
  }

  private async saveStudentRequirements(stepper: MatStepper): Promise<void> {
    const requiresSkill = this.existingSkills() === 0;
    const requiresEducation = this.existingEducation() + this.existingExperiences() === 0;

    if (requiresSkill && this.skillForm.invalid) {
      this.skillForm.markAllAsTouched();
      return;
    }

    if (requiresEducation && this.educationForm.invalid) {
      this.educationForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);

    try {
      if (requiresSkill) {
        const rawSkill = this.skillForm.getRawValue();
        const skillPayload: Partial<StudentSkill> = {
          name: rawSkill.name,
          category: rawSkill.category,
          proficiencyLevel: rawSkill.proficiencyLevel as StudentSkill['proficiencyLevel'],
        };
        await firstValueFrom(this.studentService.addSkill(skillPayload));
      }

      if (requiresEducation) {
        const educationPayload = {
          ...this.educationForm.getRawValue(),
          isCurrent: true,
        };
        await firstValueFrom(this.studentService.addEducation(educationPayload));
      }

      await this.loadStudentRequirements();
      this.authStore.refreshProfile();
      this.snackBar.open('Requisitos mínimos registrados', 'Cerrar', { duration: 2600 });
      stepper.next();
    } catch (error) {
      this.handleSaveError(error, 'No se pudieron guardar los requisitos del estudiante');
    } finally {
      this.submitting.set(false);
    }
  }

  private async saveCompanyRequirements(stepper: MatStepper): Promise<void> {
    const requiresContact = this.existingContacts() === 0;
    const requiresArea = this.existingBusinessAreas() === 0;

    if (requiresContact && this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    if (requiresArea && this.businessAreaForm.invalid) {
      this.businessAreaForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);

    try {
      if (requiresContact) {
        await firstValueFrom(this.companyProfileService.addContact(this.contactForm.getRawValue()));
      }

      if (requiresArea) {
        await firstValueFrom(
          this.companyProfileService.addBusinessArea(this.businessAreaForm.getRawValue()),
        );
      }

      await this.loadCompanyRequirements();
      this.authStore.refreshProfile();
      this.snackBar.open('Requisitos mínimos registrados', 'Cerrar', { duration: 2600 });
      stepper.next();
    } catch (error) {
      this.handleSaveError(error, 'No se pudieron guardar los requisitos de empresa');
    } finally {
      this.submitting.set(false);
    }
  }

  private handleSaveError(error: unknown, defaultMessage: string): void {
    const message = error instanceof HttpErrorResponse
      ? (error.error?.message ?? defaultMessage)
      : defaultMessage;

    this.snackBar.open(message, 'Cerrar', { duration: 4200 });
  }

  private isNotFound(error: unknown): boolean {
    return error instanceof HttpErrorResponse && error.status === 404;
  }

  private buildUserPayload() {
    const raw = this.userForm.getRawValue();

    return {
      firstName: raw.firstName.trim(),
      lastName: raw.lastName.trim(),
      phone: this.normalizeOptionalText(raw.phone),
      bio: this.normalizeOptionalText(raw.bio),
      linkedinUrl: this.normalizeOptionalText(raw.linkedinUrl),
    };
  }

  private buildStudentCreatePayload(userId: string): Pick<StudentProfile, 'userId' | 'program' | 'semester' | 'studentCode'> & { bio?: string } {
    const raw = this.studentForm.getRawValue();

    return {
      userId,
      studentCode: raw.studentCode,
      program: raw.program,
      semester: raw.semester,
      bio: this.normalizeOptionalText(raw.bio),
    };
  }

  private buildStudentUpdatePayload(): Partial<StudentProfile> {
    const raw = this.studentForm.getRawValue();

    return {
      studentCode: raw.studentCode,
      program: raw.program,
      semester: raw.semester,
      bio: this.normalizeOptionalText(raw.bio),
      githubUrl: this.normalizeOptionalText(raw.githubUrl),
      portfolioUrl: this.normalizeOptionalText(raw.portfolioUrl),
    };
  }

  private hasOptionalStudentLinks(payload: Partial<StudentProfile>): boolean {
    return !!payload.githubUrl || !!payload.portfolioUrl;
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

  private allowedProgramValidator(): ValidatorFn {
    const allowed = new Set(this.studentPrograms);

    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value as string | null;
      if (!value) return null;
      return allowed.has(value as (typeof this.studentPrograms)[number]) ? null : { invalidProgram: true };
    };
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

  private optionalGithubValidator(): ValidatorFn {
    const githubRegex = /^https?:\/\/(www\.)?github\.com\/[A-Za-z0-9-]+(?:\/)?$/i;

    return (control: AbstractControl): ValidationErrors | null => {
      const value = this.normalizeOptionalText(control.value as string | null | undefined);
      if (!value) return null;

      return githubRegex.test(value) ? null : { githubUrl: true };
    };
  }
}