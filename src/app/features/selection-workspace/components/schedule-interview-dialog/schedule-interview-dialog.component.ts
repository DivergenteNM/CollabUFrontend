import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

export interface ScheduleInterviewResult {
  scheduledAt: string;
  durationMinutes: number;
  interviewType: 'phone' | 'video' | 'in_person' | 'technical';
  location?: string;
  meetingLink?: string;
  notes?: string;
}

@Component({
  selector: 'app-schedule-interview-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideNativeDateAdapter()],
  imports: [
    FormsModule, MatDatepickerModule, MatDialogModule, MatFormFieldModule,
    MatIconModule, MatInputModule, MatSelectModule, MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>Programar entrevista</h2>
    <mat-dialog-content class="sid">
      <div class="sid__date-row">
        <mat-form-field appearance="outline" class="sid__date-field">
          <mat-label>Fecha</mat-label>
          <input matInput [matDatepicker]="picker" [(ngModel)]="date" />
          <mat-datepicker-toggle matIconSuffix [for]="picker" />
          <mat-datepicker #picker />
        </mat-form-field>
        <mat-form-field appearance="outline" class="sid__time-field">
          <mat-label>Hora</mat-label>
          <input matInput type="time" [(ngModel)]="time" />
          <mat-icon matIconSuffix>schedule</mat-icon>
        </mat-form-field>
      </div>

      <mat-form-field appearance="outline">
        <mat-label>Tipo</mat-label>
        <mat-select [(ngModel)]="interviewType">
          <mat-option value="video">Videollamada</mat-option>
          <mat-option value="phone">Telefónica</mat-option>
          <mat-option value="in_person">Presencial</mat-option>
          <mat-option value="technical">Prueba técnica</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Duración (minutos)</mat-label>
        <input matInput type="number" [(ngModel)]="durationMinutes" />
      </mat-form-field>
      @if (interviewType === 'in_person') {
        <mat-form-field appearance="outline">
          <mat-label>Ubicación</mat-label>
          <input matInput [(ngModel)]="location" />
        </mat-form-field>
      } @else if (interviewType === 'video' || interviewType === 'phone') {
        <mat-form-field appearance="outline">
          <mat-label>Enlace (opcional)</mat-label>
          <input matInput [(ngModel)]="meetingLink" placeholder="Link de la videollamada o contacto" />
        </mat-form-field>
      }
      <mat-form-field appearance="outline">
        <mat-label>Notas (opcional)</mat-label>
        <textarea matInput rows="2" [(ngModel)]="notes"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="!date || !time" (click)="confirm()">Programar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .sid { display: flex; flex-direction: column; gap: 4px; min-width: 480px; }
    .sid__date-row { display: flex; gap: 12px; }
    .sid__date-field { flex: 1.4; }
    .sid__time-field { flex: 1; }
  `],
})
export class ScheduleInterviewDialogComponent {
  private readonly ref = inject(MatDialogRef<ScheduleInterviewDialogComponent>);

  date: Date | null = null;
  time = '';
  durationMinutes = 30;
  interviewType: ScheduleInterviewResult['interviewType'] = 'video';
  location = '';
  meetingLink = '';
  notes = '';

  confirm(): void {
    if (!this.date || !this.time) return;
    const [hours, minutes] = this.time.split(':').map(Number);
    const scheduled = new Date(this.date);
    scheduled.setHours(hours, minutes, 0, 0);

    this.ref.close({
      scheduledAt: scheduled.toISOString(),
      durationMinutes: this.durationMinutes,
      interviewType: this.interviewType,
      location: this.location || undefined,
      meetingLink: this.meetingLink || undefined,
      notes: this.notes || undefined,
    } satisfies ScheduleInterviewResult);
  }
}
