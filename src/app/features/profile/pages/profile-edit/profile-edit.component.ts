import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
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
import { ApiResponse, CompanyProfile, UserProfile } from '../../../../core/models';
import { AuthStore } from '../../../../state/auth.store';
import { StudentService } from '../../../students/services/student.service';
import { CompanyProfileService } from '../../../../core/services/company-profile.service';
import { UserProfileService } from '../../../../core/services/user-profile.service';
import { FacultyService } from '../../../faculty/services/faculty.service';

@Component({
  selector: 'app-profile-edit',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink, ReactiveFormsModule, FormsModule,
    MatIconModule, MatButtonModule, MatCardModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatSnackBarModule, MatTabsModule,
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
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  readonly saving = signal(false);
  readonly userProfileExists = signal(false);
  readonly roleProfileExists = signal(false);

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
    nit: ['', [Validators.required, Validators.minLength(5)]],
    description: ['', [Validators.required, Validators.minLength(20)]],
    industry: ['', Validators.required],
    companySize: [''],
    headquartersCity: ['', Validators.required],
    headquartersState: [''],
    website: ['', [this.optionalHttpUrlValidator('website')]],
  });

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
      this.studentService.getProfile().subscribe({
        next: (resp) => {
          this.roleProfileExists.set(true);
          const s = resp.data;
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
          this.companyForm.patchValue({
            companyName: c.companyName ?? '',
            nit: c.nit ?? '',
            description: c.description ?? '',
            industry: c.industry ?? '',
            companySize: c.companySize ?? '',
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

  saveStudent(): void {
    if (this.userForm.invalid || this.studentForm.invalid) {
      this.userForm.markAllAsTouched();
      this.studentForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);

    this.upsertUserProfile().pipe(
      switchMap(() => {
        const payload = this.studentForm.getRawValue();
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

  private buildCompanyPayload() {
    const raw = this.companyForm.getRawValue();

    return {
      companyName: raw.companyName,
      nit: raw.nit,
      description: raw.description,
      industry: raw.industry,
      companySize: this.normalizeOptionalText(raw.companySize) as CompanyProfile['companySize'] | undefined,
      headquartersCity: raw.headquartersCity,
      headquartersState: this.normalizeOptionalText(raw.headquartersState),
      website: this.normalizeOptionalText(raw.website),
    };
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
