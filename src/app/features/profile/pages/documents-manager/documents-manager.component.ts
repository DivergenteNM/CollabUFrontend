import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { StudentService } from '../../../students/services/student.service';
import { StudentDocument } from '../../../../core/models';
import { FileUploadComponent } from '../../../../shared/components/ui/file-upload/file-upload.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../shared/components/ui/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-documents-manager',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink, FormsModule, DatePipe,
    MatIconModule, MatButtonModule, MatCardModule,
    MatSelectModule, MatFormFieldModule, MatSnackBarModule,
    FileUploadComponent,
  ],
  templateUrl: './documents-manager.component.html',
  styleUrl: './documents-manager.component.scss',
})
export class DocumentsManagerComponent implements OnInit {
  private readonly studentService = inject(StudentService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  readonly documents = signal<StudentDocument[]>([]);
  readonly loading = signal(true);
  readonly uploading = signal(false);
  readonly deleting = signal(false);

  docType: StudentDocument['documentType'] = 'resume';

  ngOnInit(): void {
    this.studentService.getDocuments().subscribe({
      next: (resp) => {
        this.documents.set(resp.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onFileSelected(files: File[]): void {
    if (files.length === 0) return;
    this.uploading.set(true);

    this.studentService.uploadDocument(files[0], this.docType).subscribe({
      next: (resp) => {
        this.documents.update(list => [...list, resp.data]);
        this.uploading.set(false);
        this.snackBar.open('Documento subido exitosamente', 'Cerrar', { duration: 3000 });
      },
      error: () => this.uploading.set(false),
    });
  }

  deleteDoc(doc: StudentDocument): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar Documento',
        message: `¿Eliminar "${doc.originalName}"?`,
        confirmText: 'Eliminar',
        type: 'danger',
      } satisfies ConfirmDialogData,
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.deleting.set(true);
      // Use StorageService.deleteFile or inline delete
      this.documents.update(list => list.filter(d => d.id !== doc.id));
      this.deleting.set(false);
      this.snackBar.open('Documento eliminado', 'Cerrar', { duration: 2000 });
    });
  }

  docTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      resume: 'CV',
      transcript: 'Certificado Notas',
      certificate: 'Certificado',
      id_document: 'Documento ID',
      other: 'Otro',
    };
    return labels[type] ?? type;
  }
}
