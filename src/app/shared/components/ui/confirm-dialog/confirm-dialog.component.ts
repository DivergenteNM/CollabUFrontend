import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'warning' | 'danger';
}

const TYPE_CONFIG: Record<string, { icon: string; color: string }> = {
  info:    { icon: 'info',    color: 'var(--mat-sys-primary)' },
  warning: { icon: 'warning', color: '#f57c00' },
  danger:  { icon: 'error',   color: '#c62828' },
};

@Component({
  selector: 'app-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title class="confirm-dialog__title">
      <mat-icon [style.color]="typeConfig.color">{{ typeConfig.icon }}</mat-icon>
      {{ data.title }}
    </h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close(false)">
        {{ data.cancelText || 'Cancelar' }}
      </button>
      <button
        mat-flat-button
        [class]="'confirm-btn--' + (data.type || 'info')"
        (click)="dialogRef.close(true)">
        {{ data.confirmText || 'Confirmar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .confirm-dialog__title {
      display: flex;
      align-items: center;
      gap: 8px;

      mat-icon {
        font-size: 24px;
      }
    }

    mat-dialog-content p {
      color: var(--mat-sys-on-surface-variant);
      font-size: 0.9375rem;
      line-height: 1.5;
    }

    .confirm-btn--info {
      background-color: var(--mat-sys-primary) !important;
      color: var(--mat-sys-on-primary) !important;
    }

    .confirm-btn--warning {
      background-color: #f57c00 !important;
      color: white !important;
    }

    .confirm-btn--danger {
      background-color: #c62828 !important;
      color: white !important;
    }
  `,
})
export class ConfirmDialogComponent {
  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);

  protected get typeConfig() {
    return TYPE_CONFIG[this.data.type || 'info'];
  }
}
