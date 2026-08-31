import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface RejectDocumentDialogData {
  requirementName: string;
}

export interface RejectDocumentDialogResult {
  comment: string;
}

/**
 * Rechazar un documento exige explicar por qué: es el único canal por el que el
 * estudiante o la empresa sabrán qué corregir antes de volver a subirlo.
 */
@Component({
  selector: 'app-reject-document-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>Rechazar documento</h2>
    <mat-dialog-content>
      <p class="reject-dialog__target">{{ data.requirementName }}</p>
      <mat-form-field appearance="outline" class="reject-dialog__field">
        <mat-label>Motivo del rechazo</mat-label>
        <textarea
          matInput
          rows="4"
          required
          [ngModel]="comment()"
          (ngModelChange)="comment.set($event)"
          placeholder="Indica qué debe corregirse para que el documento sea aceptado."></textarea>
        @if (comment().trim().length > 0 && comment().trim().length < 10) {
          <mat-hint class="reject-dialog__hint">Explica el motivo con algo más de detalle.</mat-hint>
        }
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="dialogRef.close()">Cancelar</button>
      <button
        mat-flat-button
        color="warn"
        type="button"
        [disabled]="!isValid()"
        (click)="confirm()">
        Rechazar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .reject-dialog__target {
      margin: 0 0 var(--space-4);
      font-weight: 600;
      color: var(--text-primary);
    }
    .reject-dialog__field { width: 100%; }
    .reject-dialog__hint { color: var(--color-warning); }
  `],
})
export class RejectDocumentDialogComponent {
  readonly dialogRef = inject(MatDialogRef<RejectDocumentDialogComponent, RejectDocumentDialogResult>);
  readonly data = inject<RejectDocumentDialogData>(MAT_DIALOG_DATA);

  readonly comment = signal('');

  isValid(): boolean {
    return this.comment().trim().length >= 10;
  }

  confirm(): void {
    if (!this.isValid()) return;
    this.dialogRef.close({ comment: this.comment().trim() });
  }
}
