import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';

export interface RequestDocumentResult {
  name: string;
  description?: string;
  isMandatory: boolean;
}

@Component({
  selector: 'app-request-document-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatCheckboxModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Solicitar documento</h2>
    <mat-dialog-content class="rdd">
      <mat-form-field appearance="outline">
        <mat-label>Nombre del documento</mat-label>
        <input matInput [(ngModel)]="name" placeholder="Ej. Prueba técnica, certificado, referencia" />
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Instrucciones (opcional)</mat-label>
        <textarea matInput rows="3" [(ngModel)]="description"></textarea>
      </mat-form-field>
      <mat-checkbox [(ngModel)]="isMandatory">Obligatorio</mat-checkbox>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="name.trim().length < 3" (click)="confirm()">Solicitar</button>
    </mat-dialog-actions>
  `,
  styles: [`.rdd { display: flex; flex-direction: column; gap: 4px; min-width: 360px; }`],
})
export class RequestDocumentDialogComponent {
  private readonly ref = inject(MatDialogRef<RequestDocumentDialogComponent>);

  name = '';
  description = '';
  isMandatory = true;

  confirm(): void {
    this.ref.close({
      name: this.name.trim(),
      description: this.description.trim() || undefined,
      isMandatory: this.isMandatory,
    } satisfies RequestDocumentResult);
  }
}
