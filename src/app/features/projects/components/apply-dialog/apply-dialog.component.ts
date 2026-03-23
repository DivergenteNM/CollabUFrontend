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
  templateUrl: './apply-dialog.component.html',
  styleUrl: './apply-dialog.component.scss',
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
