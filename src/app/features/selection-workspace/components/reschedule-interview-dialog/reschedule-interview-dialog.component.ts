import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

export interface RescheduleInterviewResult {
  scheduledAt: string;
  reason?: string;
}

@Component({
  selector: 'app-reschedule-interview-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideNativeDateAdapter()],
  imports: [FormsModule, MatDatepickerModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Reagendar entrevista</h2>
    <mat-dialog-content class="rid">
      <div class="rid__date-row">
        <mat-form-field appearance="outline" class="rid__date-field">
          <mat-label>Nueva fecha</mat-label>
          <input matInput [matDatepicker]="picker" [(ngModel)]="date" />
          <mat-datepicker-toggle matIconSuffix [for]="picker" />
          <mat-datepicker #picker />
        </mat-form-field>
        <mat-form-field appearance="outline" class="rid__time-field">
          <mat-label>Hora</mat-label>
          <input matInput type="time" [(ngModel)]="time" />
          <mat-icon matIconSuffix>schedule</mat-icon>
        </mat-form-field>
      </div>
      <mat-form-field appearance="outline">
        <mat-label>Motivo (opcional)</mat-label>
        <textarea matInput rows="2" [(ngModel)]="reason"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="!date || !time" (click)="confirm()">Reagendar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .rid { display: flex; flex-direction: column; gap: 4px; min-width: 480px; }
    .rid__date-row { display: flex; gap: 12px; }
    .rid__date-field { flex: 1.4; }
    .rid__time-field { flex: 1; }
  `],
})
export class RescheduleInterviewDialogComponent {
  private readonly ref = inject(MatDialogRef<RescheduleInterviewDialogComponent>);

  date: Date | null = null;
  time = '';
  reason = '';

  confirm(): void {
    if (!this.date || !this.time) return;
    const [hours, minutes] = this.time.split(':').map(Number);
    const scheduled = new Date(this.date);
    scheduled.setHours(hours, minutes, 0, 0);

    this.ref.close({
      scheduledAt: scheduled.toISOString(),
      reason: this.reason || undefined,
    } satisfies RescheduleInterviewResult);
  }
}
