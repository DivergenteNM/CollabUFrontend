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
import { environment } from '../../../../../environments/environment';

import { ApplicationService } from '../../../applications/services/application.service';
import { FileUploadComponent } from '../../../../shared/components/ui/file-upload/file-upload.component';
import { StorageService } from '../../../../core/services/storage.service';

import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

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
    MatProgressSpinnerModule, MatSnackBarModule, FileUploadComponent,
  ],
  templateUrl: './apply-dialog.component.html',
  styleUrl: './apply-dialog.component.scss',
})
export class ApplyDialogComponent {
  readonly data = inject<ApplyDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ApplyDialogComponent>);
  private readonly applicationService = inject(ApplicationService);
  private readonly storageService = inject(StorageService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

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
    const payload: any = {
      projectId: this.data.projectId,
      coverLetter: coverLetter!,
    };

    if (this.selectedFile) {
      this.storageService.upload(this.selectedFile, 'cv', true).subscribe({
        next: (uploadRes: any) => {
          console.log('[ApplyDialog] Upload success:', uploadRes);
          const fileData = uploadRes.data || uploadRes;
          const fileId = fileData.id || fileData.fileId;
          const resumeUrl = fileData.url || fileData.publicUrl || `${environment.apiUrl}/storage/files/${fileId}/download`;
          
          payload.resumeUrl = resumeUrl;
          this.submitApplication(payload);
        },
        error: (err) => {
          console.error('[ApplyDialog] Upload error details:', err);
          let msg = 'Error al subir el archivo CV';
          if (err.error && err.error.message) {
            msg = Array.isArray(err.error.message) ? err.error.message.join(', ') : err.error.message;
          }
          this.snackBar.open(msg, 'Cerrar', { duration: 6000 });
          this.submitting.set(false);
        }
      });
    } else {
      this.submitApplication(payload);
    }
  }

  private submitApplication(payload: any): void {
    this.applicationService.create(payload).subscribe({
      next: (res: any) => {
        this.submitting.set(false);
        const applicationData = res?.data ?? res;
        this.dialogRef.close(applicationData);
        if (applicationData?.id) {
          this.router.navigate(['/my-applications', applicationData.id]);
        } else {
          this.router.navigate(['/my-applications']);
        }
      },
      error: (err) => {
        console.error('[ApplyDialog] Create application error details:', err);
        let errorMsg = 'Error al enviar la postulación';
        if (err.error && err.error.message) {
          errorMsg = Array.isArray(err.error.message) ? err.error.message.join(', ') : err.error.message;
        }
        this.snackBar.open(errorMsg, 'Cerrar', { duration: 6000 });
        this.submitting.set(false);
      },
    });
  }
}
