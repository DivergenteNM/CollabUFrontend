import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import {
  MAT_DIALOG_DATA, MatDialogRef, MatDialogModule,
} from '@angular/material/dialog';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { signal } from '@angular/core';
import { Router } from '@angular/router';

import { ApplicationService } from '../../../applications/services/application.service';
import { FileUploadComponent } from '../../../../shared/components/ui/file-upload/file-upload.component';

export interface ApplyDialogData {
  projectId: string;
  projectTitle: string;
}

@Component({
  selector: 'app-apply-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatRadioModule, MatDatepickerModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, FileUploadComponent,
  ],
  template: `
    <h2 mat-dialog-title>Aplicar a: {{ data.projectTitle }}</h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="apply-form">
        <mat-form-field appearance="outline" class="apply-form__field--full">
          <mat-label>Carta de motivación</mat-label>
          <textarea matInput formControlName="coverLetter"
                    rows="5"
                    placeholder="Explica por qué te interesa este proyecto y qué puedes aportar..."></textarea>
          <mat-hint align="end">{{ form.get('coverLetter')?.value?.length || 0 }} / 100 min</mat-hint>
          @if (form.get('coverLetter')?.hasError('required')) {
            <mat-error>La carta de motivación es requerida</mat-error>
          }
          @if (form.get('coverLetter')?.hasError('minlength')) {
            <mat-error>Mínimo 100 caracteres</mat-error>
          }
        </mat-form-field>

        <div class="apply-form__row">
          <div class="apply-form__field">
            <label class="apply-form__label">Disponibilidad</label>
            <mat-radio-group formControlName="availability">
              <mat-radio-button value="full_time">Tiempo completo</mat-radio-button>
              <mat-radio-button value="part_time">Medio tiempo</mat-radio-button>
            </mat-radio-group>
          </div>

          <mat-form-field appearance="outline" class="apply-form__field">
            <mat-label>Fecha inicio preferida</mat-label>
            <input matInput [matDatepicker]="startPicker" formControlName="preferredStartDate" />
            <mat-datepicker-toggle matIconSuffix [for]="startPicker" />
            <mat-datepicker #startPicker />
          </mat-form-field>
        </div>

        <div class="apply-form__upload">
          <label class="apply-form__label">Adjuntar CV (opcional)</label>
          <app-file-upload
            accept=".pdf"
            [maxSizeMB]="5"
            label="Arrastra tu CV aquí o haz clic para seleccionar"
            (fileSelected)="onFileSelected($event)" />
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button
              [disabled]="form.invalid || submitting()"
              (click)="submit()">
        @if (submitting()) {
          <mat-spinner diameter="20" />
        } @else {
          <ng-container>
            <mat-icon>send</mat-icon> Enviar Aplicación
          </ng-container>
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .apply-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 400px;
      max-width: 560px;
    }

    .apply-form__field--full {
      width: 100%;
    }

    .apply-form__row {
      display: flex;
      gap: 16px;
      align-items: flex-start;

      @media (max-width: 600px) {
        flex-direction: column;
      }
    }

    .apply-form__field {
      flex: 1;
    }

    .apply-form__label {
      display: block;
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--mat-sys-on-surface-variant);
      margin-bottom: 8px;
    }

    mat-radio-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .apply-form__upload {
      margin-top: 8px;
    }
  `,
})
export class ApplyDialogComponent {
  readonly data = inject<ApplyDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ApplyDialogComponent>);
  private readonly applicationService = inject(ApplicationService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly submitting = signal(false);
  private selectedFile: File | null = null;

  readonly form = this.fb.group({
    coverLetter: ['', [Validators.required, Validators.minLength(100)]],
    availability: ['full_time', Validators.required],
    preferredStartDate: [null as Date | null],
  });

  onFileSelected(files: File[]): void {
    this.selectedFile = files[0] ?? null;
  }

  submit(): void {
    if (this.form.invalid || this.submitting()) return;
    this.submitting.set(true);

    const { coverLetter } = this.form.getRawValue();

    this.applicationService.create({
      projectId: this.data.projectId,
      coverLetter: coverLetter!,
    }).subscribe({
      next: (res) => {
        this.submitting.set(false);
        this.dialogRef.close(res.data);
        this.router.navigate(['/my-applications', res.data.id]);
      },
      error: () => {
        this.submitting.set(false);
      },
    });
  }
}
