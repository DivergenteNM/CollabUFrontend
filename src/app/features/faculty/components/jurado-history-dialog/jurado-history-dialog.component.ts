import { Component, ChangeDetectionStrategy, inject, computed, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import {
  ApplicationService, AcademicSubmission, SubmissionHistoryItem,
} from '../../../applications/services/application.service';
import { FileLinkComponent } from '../../../../shared/components/ui/file-link/file-link.component';
import { statusLabel as registryLabel } from '../../../../core/status/status-registry';

export interface JuradoHistoryDialogData {
  applicationId: string;
  projectTitle: string;
  studentName: string;
}

const HISTORY_LABELS: Record<string, string> = {
  submitted: 'Entregado', asesor_commented: 'Comentario del asesor',
  correction_requested: 'Corrección solicitada', revised: 'Re-entregado',
  approved: 'Visto bueno', rejected: 'Rechazado', expired: 'Plazo vencido',
  deadline_extended: 'Plazo extendido',
};
const ACTOR_LABELS: Record<string, string> = {
  student: 'Estudiante', asesor: 'Asesor', jurado_anteproyecto: 'Jurado',
  jurado_final: 'Jurado final', admin: 'Facultad', system: 'Sistema',
};

/**
 * Vista de solo lectura para un jurado que ya terminó su participación
 * (asignación `disconnected` tras aprobarse el anteproyecto). Diferencia
 * "ya no tengo acciones pendientes" de "nunca participé" — este diálogo es
 * exactamente ese historial, sin ningún botón de acción, consumido desde
 * `assigned-students-list` cuando la fila está en estado terminal.
 */
@Component({
  selector: 'app-jurado-history-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, MatDialogModule, MatIconModule, MatButtonModule, MatChipsModule, MatProgressSpinnerModule, FileLinkComponent],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>history</mat-icon>
      Mi historial de jurado
    </h2>
    <mat-dialog-content class="jhd">
      <div class="jhd__subject">
        <span class="jhd__project">{{ data.projectTitle }}</span>
        <span class="jhd__student">{{ data.studentName }}</span>
      </div>

      @if (loading()) {
        <div class="jhd__loading"><mat-spinner diameter="24" /></div>
      } @else if (error()) {
        <p class="jhd__error">No se pudo cargar el historial.</p>
      } @else if (submission(); as s) {
        <mat-chip [class]="'chip--' + s.status">{{ statusLabel(s.status) }}</mat-chip>
        <span class="jhd__meta">Versión final revisada: {{ s.versionNumber }}</span>

        @for (group of historyByVersion(); track group.version) {
          <div class="jhd__version-group">
            <div class="jhd__version-label">Versión {{ group.version }}</div>
            @for (h of group.items; track h.id) {
              <div class="jhd__item">
                <mat-icon>{{ iconFor(h.action) }}</mat-icon>
                <div class="jhd__item-body">
                  <div class="jhd__item-head">
                    <strong>{{ historyLabel(h.action) }}</strong>
                    <span>{{ actorLabel(h.actorRole) }}</span>
                    <span>{{ h.createdAt | date:'d MMM yyyy, h:mm a' }}</span>
                  </div>
                  @if (h.comment) { <p>{{ h.comment }}</p> }
                  @if (h.fileId) {
                    <span class="jhd__file-label">Documento adjunto:</span>
                    <app-file-link [fileId]="h.fileId" />
                  }
                </div>
              </div>
            }
          </div>
        }
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2[mat-dialog-title] { display: flex; align-items: center; gap: 8px; }
    .jhd { min-width: 420px; max-width: 560px; }
    .jhd__subject { display: flex; flex-direction: column; margin-bottom: 12px; }
    .jhd__project { font-weight: 600; font-size: .9375rem; }
    .jhd__student { font-size: .8125rem; color: var(--text-secondary); }
    .jhd__loading { display: flex; justify-content: center; padding: 24px 0; }
    .jhd__error { color: var(--color-error, #c62828); font-size: .875rem; }
    .jhd__meta { margin-left: 10px; font-size: .8125rem; color: var(--text-secondary); }
    .jhd__version-group { margin-top: 16px; display: flex; flex-direction: column; gap: 8px; }
    .jhd__version-label { font-size: .75rem; font-weight: 700; border-bottom: 1px solid var(--border-color); padding-bottom: 2px; }
    .jhd__item { display: flex; gap: 10px; font-size: .8125rem; padding: 8px 10px; background: var(--bg-secondary); border-radius: 6px; }
    .jhd__item mat-icon { font-size: 18px; width: 18px; height: 18px; color: var(--text-secondary); flex-shrink: 0; }
    .jhd__item-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
    .jhd__item-head { display: flex; gap: 8px; flex-wrap: wrap; color: var(--text-secondary); }
    .jhd__item-head strong { color: var(--text-primary); }
    .jhd__item-body p { margin: 0; color: var(--text-secondary); }
    .jhd__file-label { font-size: .6875rem; color: var(--text-secondary); text-transform: uppercase; }
  `],
})
export class JuradoHistoryDialogComponent {
  readonly data = inject<JuradoHistoryDialogData>(MAT_DIALOG_DATA);
  private readonly applicationService = inject(ApplicationService);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly submission = signal<AcademicSubmission | null>(null);
  readonly history = signal<SubmissionHistoryItem[]>([]);

  readonly historyByVersion = computed(() => {
    const groups = new Map<number, SubmissionHistoryItem[]>();
    let currentVersion = 0;
    for (const item of this.history()) {
      if (item.versionNumber) currentVersion = item.versionNumber;
      const key = item.versionNumber ?? currentVersion;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    }
    return [...groups.entries()].map(([version, items]) => ({ version, items })).sort((a, b) => b.version - a.version);
  });

  constructor() {
    this.applicationService.getJuradoAnteproyectoHistory(this.data.applicationId).subscribe({
      next: (res) => {
        this.submission.set(res.submission);
        this.history.set(res.history);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  statusLabel(status: string): string {
    return registryLabel('submission', status);
  }
  historyLabel(action: string): string {
    return HISTORY_LABELS[action] ?? action;
  }
  actorLabel(role: string): string {
    return ACTOR_LABELS[role] ?? role;
  }
  iconFor(action: string): string {
    if (action === 'approved') return 'check_circle';
    if (action === 'rejected') return 'cancel';
    if (action === 'correction_requested') return 'edit_note';
    return 'history';
  }
}
