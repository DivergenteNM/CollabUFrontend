import {
  Component, ChangeDetectionStrategy, inject, input, signal, computed, output,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  ApplicationService,
  FinalDocActor,
  FinalDocumentRequirement,
  FinalDocumentSubmission,
} from '../../../../features/applications/services/application.service';
import { FileLinkComponent } from '../../ui/file-link/file-link.component';

interface Row {
  requirement: FinalDocumentRequirement;
  submission: FinalDocumentSubmission | null;
}

interface Group {
  actor: FinalDocActor;
  label: string;
  icon: string;
  rows: Row[];
}

const ACTOR_LABEL: Record<FinalDocActor, { label: string; icon: string }> = {
  student: { label: 'Estudiante', icon: 'school' },
  company: { label: 'Empresa', icon: 'business' },
  asesor: { label: 'Asesor', icon: 'supervisor_account' },
};

@Component({
  selector: 'app-final-documents-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe, FormsModule,
    MatCardModule, MatIconModule, MatButtonModule, MatChipsModule,
    MatDividerModule, MatSnackBarModule, MatFormFieldModule, MatInputModule,
    FileLinkComponent,
  ],
  template: `
    <mat-card class="fdp">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>folder_special</mat-icon> Documentos finales
        </mat-card-title>
        <mat-card-subtitle>
          Documentos requeridos para cerrar el proyecto académicamente.
        </mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        @if (loading()) {
          <p class="fdp__hint">Cargando documentos finales…</p>
        } @else if (requirements().length === 0) {
          <div class="fdp__empty">
            <mat-icon>hourglass_empty</mat-icon>
            <p>El admin aún no ha definido documentos finales. Aparecerán aquí cuando se inicie la finalización.</p>
          </div>
        } @else {
          @for (group of groups(); track group.actor) {
            <div class="fdp__group">
              <h4 class="fdp__group-title">
                <mat-icon>{{ group.icon }}</mat-icon> {{ group.label }}
                <span class="fdp__group-count">({{ group.rows.length }})</span>
              </h4>

              @for (row of group.rows; track row.requirement.id) {
                <div class="fdp__row" [class.fdp__row--mine]="canUpload(row.requirement)">
                  <div class="fdp__row-main">
                    <div class="fdp__row-header">
                      <strong>{{ row.requirement.name }}</strong>
                      @if (row.requirement.isMandatory) {
                        <span class="fdp__chip fdp__chip--mand">Obligatorio</span>
                      } @else {
                        <span class="fdp__chip fdp__chip--opt">Opcional</span>
                      }
                      <span class="fdp__chip fdp__chip--status" [class]="'fdp__chip--' + (row.submission?.status ?? 'pending')">
                        {{ statusLabel(row.submission?.status) }}
                      </span>
                    </div>
                    @if (row.requirement.description) {
                      <p class="fdp__desc">{{ row.requirement.description }}</p>
                    }
                    @if (row.submission?.fileId) {
                      <app-file-link [fileId]="row.submission!.fileId!" />
                    }
                    @if (row.submission?.reviewerComment) {
                      <div class="fdp__feedback">
                        <strong>Revisión:</strong> {{ row.submission?.reviewerComment }}
                      </div>
                    }
                    @if (row.submission?.submittedAt) {
                      <p class="fdp__meta">Entregado: {{ row.submission?.submittedAt | date:'d MMM yyyy HH:mm' }}</p>
                    }
                  </div>

                  <div class="fdp__row-actions">
                    @if (canUpload(row.requirement)) {
                      <button mat-stroked-button [disabled]="uploading() === row.requirement.id" (click)="pickFile(row.requirement.id, fileInput)">
                        <mat-icon>upload_file</mat-icon>
                        {{ row.submission ? 'Reemplazar' : 'Subir' }}
                      </button>
                      <input #fileInput type="file" hidden
                        accept=".pdf,.doc,.docx,.zip,.rar,.pptx,.xlsx,.jpg,.png"
                        (change)="onFileSelected($event, row.requirement.id)" />
                    }

                    @if (canReview() && row.submission?.status === 'submitted') {
                      <button mat-stroked-button color="primary" (click)="review(row.submission!.id, 'approve')">
                        <mat-icon>check</mat-icon> Aprobar
                      </button>
                      <button mat-stroked-button color="warn" (click)="promptReject(row.submission!.id)">
                        <mat-icon>close</mat-icon> Rechazar
                      </button>
                    }
                  </div>
                </div>
              }
            </div>
            <mat-divider></mat-divider>
          }
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .fdp { margin-bottom: 16px; }
    mat-card-title { display: flex; align-items: center; gap: 8px; }

    .fdp__hint, .fdp__empty { color: var(--mat-sys-on-surface-variant); text-align: center; padding: 16px; }
    .fdp__empty mat-icon { font-size: 40px; width: 40px; height: 40px; opacity: 0.6; }

    .fdp__group { margin: 12px 0; }
    .fdp__group-title {
      display: flex; align-items: center; gap: 8px;
      font-size: 0.9375rem; margin: 8px 0;
    }
    .fdp__group-count { color: var(--mat-sys-on-surface-variant); font-weight: 400; }

    .fdp__row {
      display: flex; justify-content: space-between; gap: 16px;
      padding: 10px 12px; border-radius: 6px;
      background: var(--mat-sys-surface-container-lowest);
      margin-bottom: 6px;
      flex-wrap: wrap;
    }
    .fdp__row--mine { background: var(--mat-sys-secondary-container); }
    .fdp__row-main { flex: 1; min-width: 240px; display: flex; flex-direction: column; gap: 4px; }
    .fdp__row-header { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .fdp__desc { margin: 0; font-size: 0.8125rem; color: var(--mat-sys-on-surface-variant); }
    .fdp__meta { margin: 0; font-size: 0.75rem; color: var(--mat-sys-on-surface-variant); }
    .fdp__feedback {
      padding: 6px 10px;
      background: var(--mat-sys-surface-container-low);
      border-radius: 6px;
      font-size: 0.8125rem;
    }
    .fdp__row-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }

    .fdp__chip {
      font-size: 0.75rem; padding: 2px 8px; border-radius: var(--border-radius-pill); font-weight: 500;
    }
    .fdp__chip--mand { background: var(--color-warning-bg); color: var(--color-warning-text); }
    .fdp__chip--opt { background: var(--color-success-bg); color: var(--color-success-text); }
    .fdp__chip--pending { background: var(--bg-secondary); color: var(--text-secondary); }
    .fdp__chip--submitted { background: var(--color-info-bg); color: var(--color-info-text); }
    .fdp__chip--approved { background: var(--color-success-bg); color: var(--color-success-text); }
    .fdp__chip--rejected { background: var(--color-error-bg); color: var(--color-error-text); }
  `],
})
export class FinalDocumentsPanelComponent {
  readonly applicationId = input.required<string>();
  /** ContextRole del viewer para saber si puede subir el doc de un actor específico. */
  readonly viewerRole = input.required<string>();

  readonly reviewed = output<void>();

  private readonly appService = inject(ApplicationService);
  private readonly snackBar = inject(MatSnackBar);

  readonly uploading = signal<string | null>(null);

  readonly resource = rxResource({
    params: () => this.applicationId(),
    stream: (p) => this.appService.getFinalDocuments(p.params).pipe(
      catchError(() => of({ requirements: [], documents: [] })),
    ),
  });

  readonly loading = computed(() => this.resource.isLoading());
  readonly requirements = computed(() => this.resource.value()?.requirements ?? []);
  readonly documents = computed(() => this.resource.value()?.documents ?? []);

  readonly groups = computed<Group[]>(() => {
    const reqs = this.requirements();
    const docs = this.documents();
    const actors: FinalDocActor[] = ['student', 'company', 'asesor'];
    return actors
      .map((actor) => ({
        actor,
        label: ACTOR_LABEL[actor].label,
        icon: ACTOR_LABEL[actor].icon,
        rows: reqs
          .filter((r) => r.actorType === actor)
          .map((r) => ({
            requirement: r,
            submission: docs.find((d) => d.requirementId === r.id) ?? null,
          })),
      }))
      .filter((g) => g.rows.length > 0);
  });

  canUpload(req: FinalDocumentRequirement): boolean {
    const role = this.viewerRole();
    return role === 'admin' || role === req.actorType;
  }

  canReview(): boolean {
    return this.viewerRole() === 'admin';
  }

  statusLabel(status?: string | null): string {
    const map: Record<string, string> = {
      pending: 'Pendiente',
      submitted: 'Entregado',
      approved: 'Aprobado',
      rejected: 'Rechazado',
    };
    return map[status ?? 'pending'] ?? status ?? '';
  }

  pickFile(requirementId: string, input: HTMLInputElement): void {
    input.click();
  }

  onFileSelected(event: Event, requirementId: string): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploading.set(requirementId);
    this.appService.uploadFinalDocument(this.applicationId(), requirementId, file).subscribe({
      next: () => {
        this.uploading.set(null);
        this.resource.reload();
        this.snackBar.open('Documento cargado', 'OK', { duration: 3000 });
        input.value = '';
      },
      error: (err) => {
        this.uploading.set(null);
        this.snackBar.open(err?.error?.message ?? 'Error al subir documento', 'Cerrar', { duration: 4000 });
      },
    });
  }

  review(documentId: string, action: 'approve' | 'reject', comment?: string): void {
    this.appService.reviewFinalDocument(this.applicationId(), documentId, action, comment).subscribe({
      next: () => {
        this.resource.reload();
        this.reviewed.emit();
        this.snackBar.open(action === 'approve' ? 'Aprobado' : 'Rechazado', 'OK', { duration: 3000 });
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message ?? 'Error al revisar', 'Cerrar', { duration: 4000 });
      },
    });
  }

  promptReject(documentId: string): void {
    const comment = window.prompt('Motivo del rechazo (opcional):') ?? '';
    this.review(documentId, 'reject', comment || undefined);
  }
}
