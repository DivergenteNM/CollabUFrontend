import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

export interface WithdrawDialogData {
  projectTitle: string;
  companyName: string;
}

export interface WithdrawDialogResult {
  confirmed: boolean;
  reason?: string;
}

@Component({
  selector: 'app-withdraw-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    FormsModule,
  ],
  templateUrl: './withdraw-dialog.component.html',
  styleUrl: './withdraw-dialog.component.scss',
})
export class WithdrawDialogComponent {
  readonly data = inject<WithdrawDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<WithdrawDialogComponent, WithdrawDialogResult>);

  readonly predefinedReasons = [
    'Horarios o carga académica incompatible',
    'Acepté otra oferta o proyecto',
    'Cambio de intereses profesionales',
    'Motivos personales o de fuerza mayor',
    'Retiro voluntario de la postulación',
  ];

  readonly selectedReason = signal<string>(this.predefinedReasons[0]);
  readonly customReason = signal<string>(this.predefinedReasons[0]);

  selectPredefined(reason: string): void {
    this.selectedReason.set(reason);
    this.customReason.set(reason);
  }

  onCustomInput(value: string): void {
    this.customReason.set(value);
  }

  get isValid(): boolean {
    return this.customReason().trim().length >= 10;
  }

  confirm(): void {
    if (!this.isValid) return;
    this.dialogRef.close({
      confirmed: true,
      reason: this.customReason().trim(),
    });
  }

  cancel(): void {
    this.dialogRef.close({ confirmed: false });
  }
}
