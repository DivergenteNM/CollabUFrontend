import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-reject-assignment-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Declinar asignación</h2>
    <mat-dialog-content>
      <p class="rad__warn">La Facultad deberá asignar un nuevo asesor para este proyecto.</p>
      <mat-form-field appearance="outline" class="rad__field">
        <mat-label>Motivo</mat-label>
        <textarea matInput rows="3" [(ngModel)]="reason" placeholder="Explica brevemente el motivo"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="warn" [disabled]="reason.trim().length < 5" (click)="confirm()">Declinar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .rad__warn { color: var(--text-secondary); font-size: .8125rem; margin: 0 0 12px; }
    .rad__field { width: 100%; min-width: 340px; }
  `],
})
export class RejectAssignmentDialogComponent {
  private readonly ref = inject(MatDialogRef<RejectAssignmentDialogComponent>);
  reason = '';

  confirm(): void {
    this.ref.close(this.reason.trim());
  }
}
