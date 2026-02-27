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
  template: `
    <div class="profile-edit">
      <div class="profile-edit__header">
        <h1>Editar Perfil</h1>
        <a mat-button routerLink="/profile/view">
          <mat-icon>arrow_back</mat-icon>
          Cancelar
        </a>
      </div>

      @if (authStore.isStudent()) {
        <mat-card>
          <mat-card-content>
            <form [formGroup]="studentForm" (ngSubmit)="saveStudent()">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Biografía</mat-label>
                <textarea matInput formControlName="bio" rows="4"
                  placeholder="Cuéntanos sobre ti..."></textarea>
              </mat-form-field>

              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Programa académico</mat-label>
                  <input matInput formControlName="program" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Semestre</mat-label>
                  <mat-select formControlName="semester">
                    @for (s of semesters; track s) {
                      <mat-option [value]="s">{{ s }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>LinkedIn URL</mat-label>
                <input matInput formControlName="linkedinUrl" placeholder="https://linkedin.com/in/..." />
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>GitHub URL</mat-label>
                <input matInput formControlName="githubUrl" placeholder="https://github.com/..." />
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Portfolio URL</mat-label>
                <input matInput formControlName="portfolioUrl" placeholder="https://..." />
              </mat-form-field>

              <div class="form-actions">
                <button mat-flat-button color="primary" type="submit"
                  [disabled]="studentForm.invalid || saving()">
                  @if (saving()) {
                    Guardando...
                  } @else {
                    <ng-container><mat-icon>save</mat-icon></ng-container>
                    Guardar Cambios
                  }
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      }

      @if (authStore.isCompany()) {
        <mat-card>
          <mat-card-content>
            <form [formGroup]="companyForm" (ngSubmit)="saveCompany()">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Nombre de la empresa</mat-label>
                <input matInput formControlName="companyName" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Descripción</mat-label>
                <textarea matInput formControlName="description" rows="4"></textarea>
              </mat-form-field>

              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Industria</mat-label>
                  <input matInput formControlName="industry" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Tamaño</mat-label>
                  <mat-select formControlName="companySize">
                    <mat-option value="micro">Micro</mat-option>
                    <mat-option value="small">Pequeña</mat-option>
                    <mat-option value="medium">Mediana</mat-option>
                    <mat-option value="large">Grande</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Ciudad</mat-label>
                  <input matInput formControlName="city" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Departamento</mat-label>
                  <input matInput formControlName="department" />
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Dirección</mat-label>
                <input matInput formControlName="address" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Teléfono</mat-label>
                <input matInput formControlName="phone" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Sitio Web</mat-label>
                <input matInput formControlName="websiteUrl" />
              </mat-form-field>

              <div class="form-actions">
                <button mat-flat-button color="primary" type="submit"
                  [disabled]="companyForm.invalid || saving()">
                  @if (saving()) {
                    Guardando...
                  } @else {
                    <ng-container><mat-icon>save</mat-icon></ng-container>
                    Guardar Cambios
                  }
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: `
    .profile-edit {
      max-width: 700px;
      margin: 0 auto;

      &__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 24px;

        h1 {
          font-size: 1.75rem;
          font-weight: 500;
        }
      }
    }

    .full-width {
      width: 100%;
    }

    .form-row {
      display: flex;
      gap: 16px;

      mat-form-field {
        flex: 1;
      }

      @media (max-width: 599px) {
        flex-direction: column;
      }
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 16px;
    }
  `,
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
