import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AnalyticsService } from '../../../analytics/services/analytics.service';
import { GenerateReportPayload, Report } from '../../../../core/models';
import { GenerateReportDialogComponent } from './generate-report-dialog.component';

@Component({
  selector: 'app-reports',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    MatTableModule, MatButtonModule, MatIconModule,
    MatCardModule, MatProgressBarModule, MatChipsModule, MatTooltipModule,
  ],
  templateUrl: './reports.component.html',
})
export class ReportsComponent {
  private readonly analyticsService = inject(AnalyticsService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly reports = rxResource({
    stream: () => this.analyticsService.getReports(),
  });

  readonly displayedColumns = ['name', 'type', 'status', 'createdAt', 'actions'];
  readonly downloadingId = signal<string | null>(null);

  openGenerateDialog(): void {
    const ref = this.dialog.open(GenerateReportDialogComponent, { width: '500px' });

    ref.afterClosed().subscribe((payload: GenerateReportPayload | undefined) => {
      if (!payload) return;
      this.analyticsService.generateReport(payload).subscribe({
        next: () => {
          this.snackBar.open('Reporte en generación', 'Cerrar', { duration: 3000 });
          this.reports.reload();
        },
        error: () => {
          this.snackBar.open('Error al generar el reporte', 'Cerrar', { duration: 4000 });
        },
      });
    });
  }

  downloadPdf(report: Report): void {
    this.downloadingId.set(report.id);
    this.analyticsService.downloadReportPdf(report.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte-${report.reportType}-${report.id}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        this.downloadingId.set(null);
      },
      error: () => {
        this.snackBar.open('Error al descargar el PDF', 'Cerrar', { duration: 4000 });
        this.downloadingId.set(null);
      },
    });
  }

  typeLabel(type: string): string {
    const map: Record<string, string> = {
      period_summary: 'Resumen de Período',
      company_performance: 'Desempeño Empresa',
      student_outcomes: 'Resultados Estudiante',
      supervisor_report: 'Carga de Docente',
      skill_gap_analysis: 'Brecha de Skills',
      matching_effectiveness: 'Efectividad Matching',
      academic_process_summary: 'Resumen del Proceso Académico',
      supervisor_workload: 'Carga de Docentes (Plataforma)',
      project_completion_rates: 'Tasas de Completitud',
      custom: 'Personalizado',
    };
    return map[type] ?? type;
  }

  statusColor(status: string): 'primary' | 'warn' | 'accent' {
    if (status === 'completed') return 'primary';
    if (status === 'failed') return 'warn';
    return 'accent';
  }
}
