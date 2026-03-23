import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthStore } from '../../../../state/auth.store';
import { StudentService } from '../../../students/services/student.service';

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
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  readonly saving = signal(false);

  readonly semesters = Array.from({ length: 12 }, (_, i) => i + 1);

  readonly studentForm: FormGroup = this.fb.group({
    bio: [''],
    program: [''],
    semester: [null],
    linkedinUrl: [''],
    githubUrl: [''],
    portfolioUrl: [''],
  });

  readonly companyForm: FormGroup = this.fb.group({
    companyName: ['', Validators.required],
    description: [''],
    industry: [''],
    companySize: [''],
    city: [''],
    department: [''],
    address: [''],
    phone: [''],
    websiteUrl: [''],
  });

  ngOnInit(): void {
    if (this.authStore.isStudent()) {
      this.studentService.getProfile().subscribe((resp) => {
        const s = resp.data;
        this.studentForm.patchValue({
          bio: s.bio ?? '',
          program: s.program,
          semester: s.semester,
          linkedinUrl: s.linkedinUrl ?? '',
          githubUrl: s.githubUrl ?? '',
          portfolioUrl: s.portfolioUrl ?? '',
        });
      });
    }
  }

  saveStudent(): void {
    if (this.studentForm.invalid) return;
    this.saving.set(true);
    this.studentService.updateProfile(this.studentForm.value).subscribe({
      next: () => {
        this.snackBar.open('Perfil actualizado exitosamente', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/profile/view']);
      },
      error: () => this.saving.set(false),
    });
  }

  saveCompany(): void {
    if (this.companyForm.invalid) return;
    this.saving.set(true);
    // CompanyService.updateProfile() - handled same as StudentService pattern
    this.snackBar.open('Perfil actualizado exitosamente', 'Cerrar', { duration: 3000 });
    this.router.navigate(['/profile/view']);
  }
}
