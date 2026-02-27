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
  template: `
    <div class="docs-manager">
      <div class="docs-manager__header">
        <h1>Mis Documentos</h1>
        <a mat-button routerLink="/profile/view">
          <mat-icon>arrow_back</mat-icon>
          Volver al perfil
        </a>
      </div>

      <!-- Upload -->
      <mat-card class="docs-manager__upload">
        <mat-card-header>
          <mat-card-title>Subir Documento</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <mat-form-field appearance="outline">
            <mat-label>Tipo de documento</mat-label>
            <mat-select [(ngModel)]="docType">
              <mat-option value="resume">Hoja de Vida (CV)</mat-option>
              <mat-option value="transcript">Certificado de Notas</mat-option>
              <mat-option value="certificate">Certificado</mat-option>
              <mat-option value="id_document">Documento de Identidad</mat-option>
              <mat-option value="other">Otro</mat-option>
            </mat-select>
          </mat-form-field>

          <app-file-upload
            accept=".pdf,.doc,.docx,.jpg,.png"
            [maxSizeMB]="10"
            label="Arrastra tu documento aquí o haz clic para seleccionar"
            (fileSelected)="onFileSelected($event)" />
        </mat-card-content>
      </mat-card>

      <!-- Document List -->
      <mat-card>
        <mat-card-header>
          <mat-card-title>Documentos Subidos ({{ documents().length }})</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          @if (loading()) {
            <p>Cargando documentos...</p>
          }

          @for (doc of documents(); track doc.id) {
            <div class="doc-row">
              <mat-icon class="doc-icon">description</mat-icon>
              <div class="doc-info">
                <strong>{{ doc.originalName }}</strong>
                <span class="doc-meta">
                  {{ docTypeLabel(doc.documentType) }} · {{ doc.uploadedAt | date:'d MMM yyyy' }}
                </span>
              </div>
              <a mat-icon-button [href]="doc.fileUrl" target="_blank" aria-label="Descargar">
                <mat-icon>download</mat-icon>
              </a>
              <button mat-icon-button (click)="deleteDoc(doc)" aria-label="Eliminar"
                [disabled]="deleting()">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          } @empty {
            @if (!loading()) {
              <div class="empty">
                <mat-icon>folder_open</mat-icon>
                <p>No tienes documentos subidos</p>
              </div>
            }
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: `
    .docs-manager {
      max-width: 800px;
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

      &__upload {
        margin-bottom: 24px;

        mat-form-field {
          width: 100%;
          margin-bottom: 16px;
        }
      }
    }

    .doc-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 0;
      border-bottom: 1px solid var(--mat-sys-outline-variant);

      &:last-child {
        border-bottom: none;
      }

      .doc-icon {
        color: var(--mat-sys-primary);
      }

      .doc-info {
        flex: 1;

        strong {
          display: block;
          font-size: 0.9375rem;
        }

        .doc-meta {
          font-size: 0.8125rem;
          color: var(--mat-sys-on-surface-variant);
        }
      }
    }

    .empty {
      text-align: center;
      padding: 32px;
      color: var(--mat-sys-on-surface-variant);

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        margin-bottom: 8px;
      }
    }
  `,
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
