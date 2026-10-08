import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface TermsPolicyDialogData {
  defaultTab?: number;
}

@Component({
  selector: 'app-terms-policy-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatDialogModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './terms-policy-dialog.component.html',
  styleUrl: './terms-policy-dialog.component.scss',
})
export class TermsPolicyDialogComponent {
  readonly data = inject<TermsPolicyDialogData | null>(MAT_DIALOG_DATA, { optional: true });
  readonly dialogRef = inject(MatDialogRef<TermsPolicyDialogComponent>);

  readonly selectedTab = signal<number>(this.data?.defaultTab ?? 0);

  onTabChange(index: number): void {
    this.selectedTab.set(index);
  }

  close(): void {
    this.dialogRef.close();
  }
}
