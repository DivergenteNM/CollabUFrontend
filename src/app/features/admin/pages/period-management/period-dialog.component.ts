import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AcademicPeriod } from '../../../../core/models';

@Component({
  selector: 'app-period-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatCheckboxModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Editar Periodo' : 'Crear Periodo' }}</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Código del periodo</mat-label>
        <input matInput [(ngModel)]="form.periodCode" placeholder="2026-A" />
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Nombre</mat-label>
        <input matInput [(ngModel)]="form.name" placeholder="Primer Semestre 2026" />
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Fecha inicio</mat-label>
        <input matInput type="date" [(ngModel)]="form.startDate" />
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Fecha fin</mat-label>
        <input matInput type="date" [(ngModel)]="form.endDate" />
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Plazo de aplicaciones</mat-label>
        <input matInput type="date" [(ngModel)]="form.applicationDeadline" />
      </mat-form-field>
      <mat-checkbox [(ngModel)]="form.isActive">Periodo activo</mat-checkbox>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close(null)">Cancelar</button>
      <button mat-flat-button color="primary"
        [disabled]="!form.periodCode || !form.name || !form.startDate || !form.endDate"
        (click)="dialogRef.close(form)">
        {{ data ? 'Guardar' : 'Crear' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .full-width { width: 100%; }
    mat-dialog-content { display: flex; flex-direction: column; gap: 4px; }
  `,
})
export class PeriodDialogComponent {
  readonly data = inject<AcademicPeriod | null>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<PeriodDialogComponent>);

  form: Partial<AcademicPeriod> = this.data
    ? { ...this.data }
    : { periodCode: '', name: '', startDate: '', endDate: '', applicationDeadline: '', isActive: false };
}
