import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { GenerateReportPayload, ReportType } from '../../../../core/models';

@Component({
  selector: 'app-generate-report-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, FormsModule,
  ],
  template: `
    <h2 mat-dialog-title>Generar Reporte</h2>

    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Nombre del reporte</mat-label>
        <input matInput [(ngModel)]="name" placeholder="Ej: Resumen Semestre 2025-1" />
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Tipo de reporte</mat-label>
        <mat-select [(ngModel)]="reportType">
          @for (opt of reportTypes; track opt.value) {
            <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button [disabled]="!name || !reportType" (click)="submit()">
        Generar
      </button>
    </mat-dialog-actions>
  `,
  styles: ['.full-width { width: 100%; display: block; margin-bottom: 12px; }'],
})
export class GenerateReportDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<GenerateReportDialogComponent>);

  name = '';
  reportType: ReportType | '' = '';

  readonly reportTypes: { value: ReportType; label: string }[] = [
    { value: 'period_summary', label: 'Resumen de Período' },
    { value: 'company_performance', label: 'Desempeño de Empresa' },
    { value: 'student_outcomes', label: 'Resultados de Estudiantes' },
    { value: 'skill_gap_analysis', label: 'Análisis de Brecha de Skills' },
    { value: 'matching_effectiveness', label: 'Efectividad del Matching' },
    { value: 'custom', label: 'Personalizado' },
  ];

  submit(): void {
    if (!this.name || !this.reportType) return;
    const payload: GenerateReportPayload = {
      name: this.name,
      reportType: this.reportType as ReportType,
    };
    this.dialogRef.close(payload);
  }
}
