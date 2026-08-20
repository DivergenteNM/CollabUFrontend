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
  /**
   * Contexto opcional que se muestra en un bloque destacado sobre el mensaje.
   * Útil para diálogos que operan sobre una entidad concreta (proyecto,
   * postulación, entregable), evitando el "confirmar en vacío" del diálogo
   * genérico. §15.3 del planning.
   */
  context?: {
    label: string;              // p.ej. "Proyecto"
    value: string;              // p.ej. "Plataforma interna de RRHH"
    icon?: string;              // p.ej. "folder"
    status?: string;            // p.ej. "En progreso"
  };
  /** Lista de consecuencias que se aplican al confirmar. */
  consequences?: string[];
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
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss',
})
export class ConfirmDialogComponent {
  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);

  protected get typeConfig() {
    return TYPE_CONFIG[this.data.type || 'info'];
  }
}
