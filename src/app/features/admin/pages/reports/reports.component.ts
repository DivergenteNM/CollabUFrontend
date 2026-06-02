import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { environment } from '../../../../../environments/environment';
import { AnalyticsService } from '../../../analytics/services/analytics.service';
import { Report, GenerateReportPayload } from '../../../../core/models';
import { GenerateReportDialogComponent } from './generate-report-dialog.component';

@Component({
  selector: 'app-reports',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    MatTableModule, MatButtonModule, MatIconModule,
    MatCardModule, MatProgressBarModule, MatChipsModule,
  ],
  templateUrl: './reports.component.html',
})
export class ReportsComponent {
  private readonly analyticsService = inject(AnalyticsService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly reports = httpResource<Report[]>(
    () => ({ url: `${environment.apiUrl}/analytics/reports` })
  );

  readonly displayedColumns = ['name', 'type', 'status', 'createdAt', 'actions'];

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

  typeLabel(type: string): string {
    const map: Record<string, string> = {
      period_summary: 'Resumen de Período',
      company_performance: 'Desempeño Empresa',
      student_outcomes: 'Resultados Estudiante',
      skill_gap_analysis: 'Brecha de Skills',
      matching_effectiveness: 'Efectividad Matching',
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
