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
import { Observable, of, switchMap, tap } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiResponse, CompanyProfile, UserProfile } from '../../../../core/models';
import { AuthStore } from '../../../../state/auth.store';
import { StudentService } from '../../../students/services/student.service';
import { CompanyProfileService } from '../../../../core/services/company-profile.service';
import { UserProfileService } from '../../../../core/services/user-profile.service';

@Component({
  selector: 'app-profile-edit',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink, ReactiveFormsModule,
    MatIconModule, MatButtonModule, MatCardModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatSnackBarModule,
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
    bio: [''],
    program: [''],
    semester: [null],
    githubUrl: [''],
    portfolioUrl: [''],
    personalWebsiteUrl: [''],
  });

  readonly companyForm: FormGroup = this.fb.group({
    companyName: ['', Validators.required],
    description: ['', [Validators.required, Validators.minLength(20)]],
    industry: ['', Validators.required],
    companySize: [''],
    headquartersCity: ['', Validators.required],
    headquartersState: [''],
    website: ['', [this.optionalHttpUrlValidator('website')]],
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
            bio: s.bio ?? '',
            program: s.program,
            semester: s.semester,
            githubUrl: s.githubUrl ?? '',
            portfolioUrl: s.portfolioUrl ?? '',
            personalWebsiteUrl: s.personalWebsiteUrl ?? '',
          });
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
      description: raw.description,
      industry: raw.industry,
      companySize: this.normalizeOptionalText(raw.companySize) as CompanyProfile['companySize'] | undefined,
      headquartersCity: raw.headquartersCity,
      headquartersState: this.normalizeOptionalText(raw.headquartersState),
      website: this.normalizeOptionalText(raw.website),
    };
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
