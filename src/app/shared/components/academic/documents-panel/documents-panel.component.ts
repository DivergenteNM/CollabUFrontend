import { Component, ChangeDetectionStrategy, inject, input, output, signal, computed } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';

import {
  ApplicationService, ProjectDocument, ProjectDocumentRequirementLite,
} from '../../../../features/applications/services/application.service';
import { statusLabel as registryLabel } from '../../../../core/status/status-registry';
import { FileLinkComponent } from '../../ui/file-link/file-link.component';
import { EmptyStateComponent } from '../../ui/empty-state/empty-state.component';
import {
  RejectDocumentDialogComponent,
  RejectDocumentDialogResult,
} from './reject-document-dialog.component';

interface DocumentRow {
  requirement: ProjectDocumentRequirementLite;
  document: ProjectDocument | null;
}

type PanelData = { requirements: ProjectDocumentRequirementLite[]; documents: ProjectDocument[] };


/**
 * Documentos requeridos de una postulación.
 *
 * La revisión (`canReview`) es la pieza que faltaba para que el flujo avanzara:
 * sin aprobar los documentos obligatorios, el checklist de iniciación nunca daba
 * `readyForAgreement`, el acuerdo no podía emitirse y el proyecto jamás llegaba
 * a estado activo.
 */
@Component({
  selector: 'app-documents-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule, MatIconModule, MatButtonModule, MatChipsModule, MatTooltipModule,
    MatProgressSpinnerModule, MatDialogModule, MatSnackBarModule,
    FileLinkComponent, EmptyStateComponent,
  ],
  template: `
    <mat-card class="docs-panel">
      <mat-card-header>
        <mat-card-title>{{ title() }}</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        @if (resource.isLoading()) {
          <div class="docs-panel__state">
            <mat-spinner diameter="24" />
            <p>Cargando documentos…</p>
          </div>
        } @else if (resource.error()) {
          <app-empty-state
            icon="cloud_off"
            title="No se pudieron cargar los documentos"
            message="Hubo un problema al consultar los requisitos documentales."
            actionLabel="Reintentar"
            (actionClicked)="resource.reload()" />
        } @else if (rows().length === 0) {
          <div class="docs-panel__state">
            <mat-icon>hourglass_top</mat-icon>
            <p>Esperando que el administrador defina los documentos requeridos para este proyecto</p>
          </div>
        } @else {
          @for (row of rows(); track row.requirement.id) {
            <div class="docs-panel__row">
              <div class="docs-panel__info">
                <div class="docs-panel__heading">
                  <strong>{{ row.requirement.name }}</strong>
                  @if (row.requirement.isMandatory) {
                    <span class="badge badge--required">Obligatorio</span>
                  } @else {
                    <span class="badge badge--optional">Opcional</span>
                  }
                  <mat-chip [class]="'chip--' + (row.document?.status ?? 'pending')">
                    {{ statusLabel(row.document?.status) }}
                  </mat-chip>
                </div>

                @if (row.requirement.description) {
                  <p class="docs-panel__desc">{{ row.requirement.description }}</p>
                }

                @if (row.requirement.templateFileId) {
                  <div class="docs-panel__template">
                    <span class="docs-panel__template-label">Plantilla:</span>
                    <app-file-link [fileId]="row.requirement.templateFileId" />
                  </div>
                }

                @if (row.document?.fileId) {
                  <app-file-link
                    [fileId]="row.document!.fileId"
                    [downloadName]="row.requirement.name" />
                }

                @if (row.document?.reviewerComment) {
                  <p class="docs-panel__comment" [class.docs-panel__comment--rejected]="row.document!.status === 'rejected'">
                    <mat-icon>{{ row.document!.status === 'rejected' ? 'error_outline' : 'comment' }}</mat-icon>
                    {{ row.document!.reviewerComment }}
                  </p>
                }
              </div>

              <div class="docs-panel__actions">
                @if (canUpload()) {
                  @if (uploadingId() === row.requirement.id) {
                    <button mat-stroked-button type="button" disabled>
                      <mat-spinner diameter="18" />
                    </button>
                  } @else {
                    <button mat-stroked-button type="button" (click)="fileInput.click()">
                      <mat-icon>upload_file</mat-icon>
                      {{ row.document?.fileId ? 'Reemplazar' : 'Subir' }}
                    </button>
                  }
                  <input
                    #fileInput
                    type="file"
                    hidden
                    (change)="onFileSelected($event, row.requirement.id)" />
                }

                @if (canReview() && row.document?.status === 'submitted') {
                  <button
                    mat-flat-button
                    color="primary"
                    type="button"
                    [disabled]="reviewingId() === row.document!.id"
                    (click)="approve(row.document!)">
                    <mat-icon>check</mat-icon> Aprobar
                  </button>
                  <button
                    mat-stroked-button
                    color="warn"
                    type="button"
                    [disabled]="reviewingId() === row.document!.id"
                    (click)="reject(row.document!)">
                    <mat-icon>close</mat-icon> Rechazar
                  </button>
                }
              </div>
            </div>
          }

          @if (canReview() && pendingReviewCount() > 0) {
            <p class="docs-panel__hint">
              <mat-icon>info</mat-icon>
              El acuerdo de iniciación no puede emitirse hasta aprobar todos los documentos obligatorios.
            </p>
          }
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .docs-panel { margin-bottom: var(--space-4); }
    .docs-panel__state {
      display: flex; flex-direction: column; align-items: center;
      padding: var(--space-6) 0; color: var(--text-secondary); gap: var(--space-2);
      text-align: center;
    }
    .docs-panel__state p { margin: 0; font-size: .875rem; }
    .docs-panel__row {
      display: flex; justify-content: space-between; align-items: flex-start;
      padding: var(--space-3) 0; border-bottom: 1px solid var(--border-color);
      gap: var(--space-4); flex-wrap: wrap;
    }
    .docs-panel__row:last-of-type { border-bottom: none; }
    .docs-panel__info { flex: 1 1 320px; min-width: 0; display: flex; flex-direction: column; gap: var(--space-2); }
    .docs-panel__heading { display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap; }
    .docs-panel__desc { margin: 0; font-size: .8125rem; color: var(--text-secondary); }
    .docs-panel__template { display: flex; align-items: center; gap: 6px; }
    .docs-panel__template-label { font-size: .6875rem; text-transform: uppercase; color: var(--text-secondary); }
    .docs-panel__comment {
      display: flex; align-items: flex-start; gap: var(--space-2);
      margin: 0; font-size: .8125rem; color: var(--text-secondary);
      background: var(--bg-secondary); padding: var(--space-2) var(--space-3);
      border-radius: var(--border-radius-sm);
    }
    .docs-panel__comment--rejected { color: var(--color-error); background: color-mix(in srgb, var(--color-error) 8%, transparent); }
    .docs-panel__comment mat-icon { font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; }
    .docs-panel__actions { flex-shrink: 0; display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap; }
    .docs-panel__hint {
      display: flex; align-items: center; gap: var(--space-2);
      margin: var(--space-4) 0 0; font-size: .8125rem; color: var(--color-warning);
    }
    .docs-panel__hint mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .badge { font-size: .7rem; padding: 1px 8px; border-radius: 10px; }
    .badge--required { background: color-mix(in srgb, var(--color-error) 10%, transparent); color: var(--color-error); }
    .badge--optional { background: var(--bg-tertiary); color: var(--text-secondary); }
  `],
})
export class DocumentsPanelComponent {
  readonly applicationId = input.required<string>();
  /** Tipo de actor cuyos requisitos se listan. */
  readonly actorType = input.required<'student' | 'company'>();
  /** Permite subir. El propio actor lo hace; un revisor externo no. */
  readonly canUpload = input(true);
  /** Habilita aprobar y rechazar. Solo Facultad/Admin y el jurado final. */
  readonly canReview = input(false);
  readonly title = input('Documentos requeridos');

  /** Se emite tras aprobar o rechazar, para que el panel contenedor recargue. */
  readonly reviewed = output<void>();

  private readonly applicationService = inject(ApplicationService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  readonly uploadingId = signal<string | null>(null);
  readonly reviewingId = signal<string | null>(null);

  readonly resource = rxResource<PanelData, { applicationId: string }>({
    params: () => ({ applicationId: this.applicationId() }),
    stream: ({ params }) =>
      forkJoin({
        // Requisitos seleccionados por el admin para ESTE proyecto (no el catálogo
        // global completo) — su ausencia significa "el admin no ha definido nada
        // todavía", no un error.
        requirements: this.applicationService.getProjectDocumentRequirements(params.applicationId)
          .pipe(catchError(() => of([] as ProjectDocumentRequirementLite[]))),
        documents: this.applicationService.getDocuments(params.applicationId),
      }).pipe(map((data) => data as PanelData)),
  });

  readonly rows = computed<DocumentRow[]>(() => {
    const data = this.resource.value();
    if (!data) return [];
    return data.requirements
      .filter((requirement) => requirement.actorType === this.actorType())
      .map((requirement) => ({
        requirement,
        document: data.documents.find((d) => d.requirementId === requirement.id) ?? null,
      }));
  });

  readonly pendingReviewCount = computed(
    () => this.rows().filter((r) => r.document?.status === 'submitted').length,
  );

  statusLabel(status: string | undefined): string {
    return registryLabel('document', status ?? 'pending');
  }

  onFileSelected(event: Event, requirementId: string): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploadingId.set(requirementId);
    this.applicationService.uploadDocument(this.applicationId(), requirementId, file).subscribe({
      next: () => {
        this.uploadingId.set(null);
        input.value = '';
        this.snackBar.open('Documento cargado', 'OK', { duration: 2500 });
        this.resource.reload();
      },
      error: (err: HttpErrorResponse) => {
        this.uploadingId.set(null);
        input.value = '';
        const msg = Array.isArray(err?.error?.message)
          ? err.error.message.join('; ')
          : err?.error?.message ?? 'Error al cargar el documento';
        this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
      },
    });
  }

  approve(document: ProjectDocument): void {
    this.review(document, 'approved');
  }

  reject(document: ProjectDocument): void {
    const ref = this.dialog.open(RejectDocumentDialogComponent, {
      width: '480px',
      data: { requirementName: document.requirementName },
    });

    ref.afterClosed().subscribe((result: RejectDocumentDialogResult | undefined) => {
      if (result?.comment) {
        this.review(document, 'rejected', result.comment);
      }
    });
  }

  private review(document: ProjectDocument, status: 'approved' | 'rejected', comment?: string): void {
    this.reviewingId.set(document.id);
    this.applicationService
      .reviewDocument(this.applicationId(), document.id, status, comment)
      .subscribe({
        next: () => {
          this.reviewingId.set(null);
          this.snackBar.open(
            status === 'approved' ? 'Documento aprobado' : 'Documento rechazado',
            'OK',
            { duration: 2500 },
          );
          this.resource.reload();
          this.reviewed.emit();
        },
        error: (err: HttpErrorResponse) => {
          this.reviewingId.set(null);
          this.snackBar.open(
            err?.error?.message ?? 'No se pudo registrar la revisión',
            'Cerrar',
            { duration: 4000 },
          );
        },
      });
  }
}
