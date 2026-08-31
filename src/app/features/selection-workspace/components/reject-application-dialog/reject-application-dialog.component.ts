import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-reject-application-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Rechazar postulación</h2>
    <mat-dialog-content>
      <p class="rad__warn">Esta acción no se puede deshacer. El estudiante será notificado.</p>
      <mat-form-field appearance="outline" class="rad__field">
        <mat-label>Motivo del rechazo</mat-label>
        <textarea matInput rows="3" [(ngModel)]="reason" placeholder="Explica brevemente el motivo"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="warn" [disabled]="reason.trim().length < 3" (click)="confirm()">Rechazar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .rad__warn { color: var(--text-secondary); font-size: .8125rem; margin: 0 0 12px; }
    .rad__field { width: 100%; min-width: 340px; }
  `],
})
export class RejectApplicationDialogComponent {
  private readonly ref = inject(MatDialogRef<RejectApplicationDialogComponent>);
  reason = '';

  confirm(): void {
    this.ref.close(this.reason.trim());
  }
}
