import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatButtonModule } from '@angular/material/button';

export interface CompleteInterviewResult {
  resolution: 'passed' | 'failed';
  score?: number;
  interviewerNotes?: string;
  resolutionComment?: string;
}

@Component({
  selector: 'app-complete-interview-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonToggleModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Completar entrevista</h2>
    <mat-dialog-content class="cid">
      <mat-button-toggle-group [(ngModel)]="resolution">
        <mat-button-toggle value="passed">Superada</mat-button-toggle>
        <mat-button-toggle value="failed">No superada</mat-button-toggle>
      </mat-button-toggle-group>
      <mat-form-field appearance="outline">
        <mat-label>Puntaje (0-100, opcional)</mat-label>
        <input matInput type="number" min="0" max="100" [(ngModel)]="score" />
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Notas internas (opcional)</mat-label>
        <textarea matInput rows="2" [(ngModel)]="interviewerNotes"></textarea>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Comentario visible para el estudiante (opcional)</mat-label>
        <textarea matInput rows="2" [(ngModel)]="resolutionComment"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" (click)="confirm()">Guardar</button>
    </mat-dialog-actions>
  `,
  styles: [`.cid { display: flex; flex-direction: column; gap: 12px; min-width: 340px; padding-top: 8px; }`],
})
export class CompleteInterviewDialogComponent {
  private readonly ref = inject(MatDialogRef<CompleteInterviewDialogComponent>);

  resolution: 'passed' | 'failed' = 'passed';
  score: number | null = null;
  interviewerNotes = '';
  resolutionComment = '';

  confirm(): void {
    this.ref.close({
      resolution: this.resolution,
      score: this.score ?? undefined,
      interviewerNotes: this.interviewerNotes || undefined,
      resolutionComment: this.resolutionComment || undefined,
    } satisfies CompleteInterviewResult);
  }
}
