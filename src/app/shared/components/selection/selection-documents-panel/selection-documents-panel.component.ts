import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FileLinkComponent } from '../../ui/file-link/file-link.component';
import { SelectionDocument } from '../../../../features/applications/services/application.service';

const STATUS_LABELS: Record<string, string> = {
  requested: 'Pendiente de entrega', submitted: 'En revisión', approved: 'Aprobado', rejected: 'Rechazado',
};

/**
 * Documentos que la empresa solicita al estudiante durante la selección
 * (prueba técnica, certificado, referencia...). Distinto de los documentos
 * académicos (post-inicio) — usa `selection-documents`, no `documents`.
 */
@Component({
  selector: 'app-selection-documents-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatIconModule, MatButtonModule, FileLinkComponent],
  template: `
    <mat-card class="sdp">
      <mat-card-header>
        <mat-card-title>Documentos solicitados</mat-card-title>
        @if (canRequest()) {
          <button mat-stroked-button (click)="requestRequested.emit()">
            <mat-icon>add</mat-icon> Solicitar documento
          </button>
        }
      </mat-card-header>
      <mat-card-content>
        @if (documents().length === 0) {
          <p class="sdp__empty">
            @if (canRequest()) {
              No has solicitado documentos adicionales al candidato.
            } @else {
              La empresa no ha solicitado documentos adicionales.
            }
          </p>
        }
        @for (doc of documents(); track doc.id) {
          <div class="sdp__item">
            <div class="sdp__item-header">
              <span class="sdp__name">
                {{ doc.name }}
                @if (doc.isMandatory) { <span class="sdp__mandatory">Obligatorio</span> }
              </span>
              <span class="sdp__status sdp__status--{{ doc.status }}">{{ statusLabel(doc.status) }}</span>
            </div>
            @if (doc.description) { <p class="sdp__desc">{{ doc.description }}</p> }

            @if (doc.fileId) {
              <app-file-link [fileId]="doc.fileId" />
            } @else if (isStudent()) {
              <button mat-stroked-button (click)="submitRequested.emit(doc.id)">
                <mat-icon>upload</mat-icon> Entregar
              </button>
            }

            @if (doc.reviewerComment) {
              <p class="sdp__comment"><mat-icon>comment</mat-icon> {{ doc.reviewerComment }}</p>
            }

            @if (canReview() && doc.status === 'submitted') {
              <div class="sdp__actions">
                <button mat-button color="primary" (click)="reviewRequested.emit({ id: doc.id, status: 'approve' })">
                  <mat-icon>check</mat-icon> Aprobar
                </button>
                <button mat-button color="warn" (click)="reviewRequested.emit({ id: doc.id, status: 'reject' })">
                  <mat-icon>close</mat-icon> Rechazar
                </button>
              </div>
            }
          </div>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .sdp mat-card-header { display: flex; align-items: center; justify-content: space-between; }
    .sdp__empty { color: var(--text-secondary); font-size: .8125rem; font-style: italic; }
    .sdp__item { border: 1px solid var(--border-color); border-radius: 8px; padding: 12px; margin-top: 10px; }
    .sdp__item-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px; }
    .sdp__name { font-weight: 500; font-size: .8125rem; display: flex; align-items: center; gap: 6px; }
    .sdp__mandatory { font-size: .625rem; background: var(--color-warning-bg, #fff3e0); color: var(--color-warning, #e65100);
      padding: 1px 6px; border-radius: 8px; }
    .sdp__status { font-size: .6875rem; padding: 2px 8px; border-radius: 10px; background: var(--bg-tertiary); white-space: nowrap; }
    .sdp__status--requested { color: var(--color-warning); }
    .sdp__status--submitted { color: var(--color-info); }
    .sdp__status--approved { color: var(--color-success); }
    .sdp__status--rejected { color: var(--color-error); }
    .sdp__desc { font-size: .75rem; color: var(--text-secondary); margin: 0 0 8px; }
    .sdp__comment { display: flex; align-items: center; gap: 4px; font-size: .75rem; color: var(--text-secondary); margin-top: 6px; }
    .sdp__comment mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .sdp__actions { display: flex; gap: 4px; margin-top: 8px; }
  `],
})
export class SelectionDocumentsPanelComponent {
  readonly documents = input.required<SelectionDocument[]>();
  readonly canRequest = input(false);
  readonly canReview = input(false);
  readonly isStudent = input(false);

  readonly requestRequested = output<void>();
  readonly submitRequested = output<string>();
  readonly reviewRequested = output<{ id: string; status: 'approve' | 'reject' }>();

  statusLabel(s: string): string { return STATUS_LABELS[s] ?? s; }
}
