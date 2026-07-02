import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { DeliverableType } from '../../../../core/enums';

export interface CreateDeliverableDialogData {
  applicationId: string;
}

@Component({
  selector: 'app-create-deliverable-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
  ],
  providers: [provideNativeDateAdapter()],
  template: `
    <h2 mat-dialog-title>Crear Entregable</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="create-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Título</mat-label>
          <input matInput formControlName="title" placeholder="Ej: Informe mensual de progreso" />
          @if (form.controls['title'].hasError('required')) {
            <mat-error>El título es obligatorio</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Descripción</mat-label>
          <textarea matInput formControlName="description" rows="3"
                    placeholder="Describe el entregable..."></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Tipo</mat-label>
          <mat-select formControlName="type">
            <mat-option value="">Seleccionar tipo</mat-option>
            @for (type of deliverableTypes; track type.value) {
              <mat-option [value]="type.value">{{ type.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Fecha límite</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="dueDate" />
          <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="submit()">
        Crear Entregable
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .create-form { display: flex; flex-direction: column; gap: 8px; min-width: 400px; }
    .full-width { width: 100%; }
  `],
})
export class CreateDeliverableDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<CreateDeliverableDialogComponent>);
  private readonly data: CreateDeliverableDialogData = inject(MAT_DIALOG_DATA);

  readonly deliverableTypes = [
    { value: DeliverableType.REPORT, label: 'Reporte' },
    { value: DeliverableType.PRESENTATION, label: 'Presentación' },
    { value: DeliverableType.CODE, label: 'Código' },
    { value: DeliverableType.DOCUMENT, label: 'Documento' },
    { value: DeliverableType.VIDEO, label: 'Video' },
    { value: DeliverableType.OTHER, label: 'Otro' },
  ];

  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    description: [''],
    type: [''],
    dueDate: [null as Date | null],
  });

  submit(): void {
    if (this.form.invalid) return;
    const { title, description, type, dueDate } = this.form.getRawValue();
    const result: any = { title };
    if (description) result.description = description;
    if (type) result.type = type;
    if (dueDate) result.dueDate = dueDate.toISOString();
    this.dialogRef.close(result);
  }
}