import {
  Component, ChangeDetectionStrategy, input, output, signal, computed, inject, ElementRef, viewChild,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatSliderModule } from '@angular/material/slider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { Deliverable } from '../../../../core/models';
import { statusOf, statusColors, StatusConfig } from '../../../../core/status/status-registry';
import { FileLinkComponent } from '../../ui/file-link/file-link.component';
import { DeadlineChipComponent } from '../../ui/deadline-chip/deadline-chip.component';

export interface DeliverableReviewEvent {
  deliverableId: string;
  action: 'approved' | 'rejected' | 'needs_revision';
  grade?: number;
  feedback?: string;
}

export interface DeliverableSubmitEvent {
  deliverableId: string;
  files: File[];
}

@Component({
  selector: 'app-deliverable-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe, FormsModule,
    MatCardModule, MatIconModule, MatButtonModule, MatChipsModule,
    MatSliderModule, MatFormFieldModule, MatInputModule, MatSnackBarModule,
    FileLinkComponent, DeadlineChipComponent,
  ],
  template: `
    <mat-card class="dc" [class.dc--overdue]="isVisuallyOverdue()">
      <mat-card-content>
        <div class="dc__header">
          <div class="dc__title-row">
            <mat-icon class="dc__status-icon" [style.color]="colors().color">
              {{ config().icon }}
            </mat-icon>
            <h4 class="dc__title">{{ deliverable().title }}</h4>
            <span class="dc__badge" [style.color]="colors().color" [style.background]="colors().bg">
              {{ config().label }}
            </span>
          </div>
          @if (deliverable().description) {
            <p class="dc__desc">{{ deliverable().description }}</p>
          }
          <div class="dc__meta">
            <!-- Deadline chip solo mientras el entregable esté abierto. Cuando
                 ya fue entregado (submitted/approved/rejected) se sustituye
                 por la fecha de entrega — evita el falso "vencido" tras cumplir. -->
            @if (deliverable().dueDate && isAwaitingDelivery()) {
              <app-deadline-chip [date]="deliverable().dueDate!">Fecha límite:</app-deadline-chip>
            } @else if (deliverable().dueDate && !isAwaitingDelivery()) {
              <span class="dc__due-info">
                <mat-icon>event</mat-icon> Fecha límite: {{ deliverable().dueDate | date:'d MMM yyyy' }}
              </span>
            }
            @if (deliverable().submittedAt) {
              <span class="dc__submitted"
                [class.dc__submitted--on-time]="wasDeliveredOnTime()"
                [class.dc__submitted--late]="!wasDeliveredOnTime()">
                <mat-icon>{{ wasDeliveredOnTime() ? 'check_circle' : 'schedule' }}</mat-icon>
                Entregado: {{ deliverable().submittedAt | date:'d MMM yyyy' }}
                @if (!wasDeliveredOnTime()) { <span>(fuera de plazo)</span> }
              </span>
            }
            @if (reviewStatusActionLabel()) {
              <span class="dc__review-badge"
                [class.dc__review-badge--approved]="deliverable().status === 'approved'"
                [class.dc__review-badge--rejected]="deliverable().status === 'rejected'"
                [class.dc__review-badge--needs-revision]="deliverable().status === 'needs_revision'">
                <mat-icon>{{ deliverable().status === 'approved' ? 'check_circle' : (deliverable().status === 'rejected' ? 'cancel' : 'edit_note') }}</mat-icon>
                <span>{{ reviewStatusActionLabel() }}@if (reviewerDisplay()) { por <strong>{{ reviewerDisplay() }}</strong> }</span>
                @if (deliverable().reviewedAt) {
                  <span class="dc__review-date">({{ deliverable().reviewedAt | date:'d MMM yyyy, h:mm a' }})</span>
                }
              </span>
            }
            @if (deliverable().grade != null) {
              <span class="dc__grade">Nota: {{ deliverable().grade }}/5</span>
            }
          </div>
        </div>

        <!-- File link for submitted deliverables.
             fileUrl puede ser un fileId de Storage (upload real) o una URL
             completa (datos legacy/seed). Se distingue por el prefijo. -->
        @if (deliverable().fileUrl; as url) {
          @if (isExternalUrl(url)) {
            <a class="dc__external-file" [href]="url" target="_blank" rel="noopener">
              <mat-icon>attach_file</mat-icon>
              <span>{{ extractFileName(url) }}</span>
              <mat-icon class="dc__external-icon">open_in_new</mat-icon>
            </a>
          } @else {
            <app-file-link [fileId]="url" />
          }
        }

        @if (deliverable().attachments && deliverable().attachments!.length > 0) {
          <div class="dc__attachments">
            @for (att of deliverable().attachments!; track att.id || att.fileUrl) {
              @if (att.fileUrl) {
                <app-file-link [fileId]="att.fileUrl" [downloadName]="att.fileName" />
              }
            }
          </div>
        }

        <!-- Student: upload when pending or needs_revision -->
        @if (canSubmit() && isSubmittable()) {
          <div class="dc__upload">
            <label class="dc__upload-label" (click)="fileInput.click()">
              <mat-icon>upload_file</mat-icon>
              {{ deliverable().status === 'needs_revision' ? 'Subir corrección' : 'Subir entregable' }}
            </label>
            <input #fileInput type="file" hidden
              accept=".pdf,.doc,.docx,.zip,.rar,.pptx,.xlsx"
              (change)="onFileSelected($event)" />
          </div>
        }

        <!-- Feedback from reviewer -->
        @if (deliverable().feedback) {
          <div class="dc__feedback">
            <div class="dc__feedback-header">
              <div class="dc__feedback-title">
                <mat-icon>comment</mat-icon>
                <strong>Retroalimentación</strong>
              </div>
              @if (reviewerDisplay()) {
                <span class="dc__feedback-author">
                  <mat-icon>person</mat-icon>
                  <span>Por: <strong>{{ reviewerDisplay() }}</strong></span>
                </span>
              }
            </div>
            <p class="dc__feedback-text">{{ deliverable().feedback }}</p>
          </div>
        }

        <!-- Reviewer: review form when submitted -->
        @if (canReview() && deliverable().status === 'submitted' && !showReviewForm()) {
          <div class="dc__review-actions">
            <button mat-stroked-button (click)="openReviewForm()">
              <mat-icon>rate_review</mat-icon> Revisar
            </button>
          </div>
        }

        @if (canReview() && showReviewForm()) {
          <div class="dc__review-form">
            <mat-form-field appearance="outline" class="dc__feedback-field" [class.dc__feedback-field--error]="rejectCommentError()">
              <mat-label>Retroalimentación</mat-label>
              <textarea
                #feedbackTextarea
                matInput
                [(ngModel)]="reviewFeedback"
                (ngModelChange)="onFeedbackChange()"
                rows="3"
                placeholder="Escribe tus comentarios (obligatorio al rechazar)..."></textarea>
              <mat-hint>Obligatorio para rechazar el entregable.</mat-hint>
            </mat-form-field>

            @if (rejectCommentError()) {
              <div class="dc__error-banner" role="alert">
                <mat-icon>error_outline</mat-icon>
                <span>Debes ingresar un comentario de retroalimentación para poder rechazar este entregable.</span>
              </div>
            }

            <div class="dc__grade-row">
              <span class="dc__grade-label">Nota:</span>
              <mat-slider min="1" max="5" step="1" discrete>
                <input matSliderThumb [(ngModel)]="reviewGrade" />
              </mat-slider>
              <span class="dc__grade-value">{{ reviewGrade }}/5</span>
            </div>
            <div class="dc__review-buttons">
              <button mat-flat-button color="primary" type="button" (click)="emitReview('approved')">
                <mat-icon>check</mat-icon> Aprobar
              </button>
              <button mat-stroked-button color="warn" type="button" (click)="emitReview('needs_revision')">
                <mat-icon>edit</mat-icon> Pedir corrección
              </button>
              <button mat-stroked-button color="warn" type="button" (click)="emitReview('rejected')">
                <mat-icon>close</mat-icon> Rechazar
              </button>
              <button mat-button type="button" (click)="cancelReview()">Cancelar</button>
            </div>
          </div>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .dc { margin-bottom: 0; }
    .dc--overdue { border-left: 3px solid var(--color-error, #c62828); }

    .dc__header { display: flex; flex-direction: column; gap: 4px; }
    .dc__title-row { display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap; }
    .dc__status-icon { font-size: 20px; width: 20px; height: 20px; flex-shrink: 0; }
    .dc__title { margin: 0; font-size: .875rem; font-weight: 600; flex: 1; min-width: 0; }
    .dc__badge {
      font-size: .75rem; font-weight: 500; padding: 2px 8px;
      border-radius: 12px; white-space: nowrap;
    }
    .dc__desc { margin: 0; font-size: .8125rem; color: var(--text-secondary); }
    .dc__meta {
      display: flex; gap: var(--space-3); align-items: center;
      flex-wrap: wrap; font-size: .75rem; color: var(--text-secondary);
    }
    .dc__grade { font-weight: 600; color: var(--mat-sys-primary); }
    .dc__submitted { display: flex; align-items: center; gap: 4px; }
    .dc__submitted mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .dc__submitted--on-time { color: #2e7d32; }
    .dc__submitted--late { color: var(--color-warning, #ed6c02); }
    .dc__due-info { display: flex; align-items: center; gap: 4px; color: var(--text-secondary); font-size: .8125rem; }
    .dc__due-info mat-icon { font-size: 16px; width: 16px; height: 16px; }

    .dc__review-badge {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 2px 8px; border-radius: 12px; font-size: .75rem; font-weight: 500;
    }
    .dc__review-badge mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .dc__review-badge--approved { background: rgba(46, 125, 50, 0.12); color: #2e7d32; }
    .dc__review-badge--rejected { background: rgba(198, 40, 40, 0.12); color: #c62828; }
    .dc__review-badge--needs-revision { background: rgba(237, 108, 2, 0.12); color: #ed6c02; }
    .dc__review-date { font-weight: normal; opacity: 0.85; margin-left: 2px; }

    .dc__attachments {
      display: flex; flex-direction: column; gap: var(--space-2); margin-top: var(--space-2);
    }

    .dc__upload {
      margin-top: var(--space-2);
    }
    .dc__upload-label {
      display: inline-flex; align-items: center; gap: var(--space-2);
      padding: var(--space-2) var(--space-3);
      border: 1px dashed var(--border-color);
      border-radius: var(--border-radius-md);
      cursor: pointer; font-size: .8125rem;
      color: var(--mat-sys-primary);
      transition: background .15s;
    }
    .dc__upload-label:hover { background: var(--bg-hover); }

    .dc__feedback {
      margin-top: var(--space-2); padding: var(--space-2) var(--space-3);
      background: var(--bg-hover, #f5f5f5); border-radius: var(--border-radius-md);
      font-size: .8125rem;
    }
    .dc__feedback-header {
      display: flex; align-items: center; justify-content: space-between;
      flex-wrap: wrap; gap: var(--space-2); margin-bottom: 4px;
    }
    .dc__feedback-title {
      display: inline-flex; align-items: center; gap: 4px;
    }
    .dc__feedback-title mat-icon { font-size: 16px; width: 16px; height: 16px; color: var(--text-secondary); }
    .dc__feedback-author {
      display: inline-flex; align-items: center; gap: 4px;
      font-size: 0.75rem; color: var(--text-secondary);
      background: rgba(0, 0, 0, 0.04); padding: 2px 8px; border-radius: 10px;
    }
    .dc__feedback-author mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .dc__feedback-text { margin: 0; white-space: pre-wrap; }

    .dc__review-actions { margin-top: var(--space-2); }
    .dc__review-form {
      margin-top: var(--space-3); display: flex; flex-direction: column; gap: var(--space-2);
    }
    .dc__feedback-field { width: 100%; }
    .dc__error-banner {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: 8px 12px;
      background: rgba(198, 40, 40, 0.12);
      border: 1px solid var(--color-error, #c62828);
      border-radius: var(--border-radius-md);
      color: #f44336;
      font-size: 0.8125rem;
      font-weight: 500;
    }
    .dc__error-banner mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #f44336;
      flex-shrink: 0;
    }
    .dc__grade-row { display: flex; align-items: center; gap: var(--space-2); }
    .dc__grade-label { font-size: .8125rem; color: var(--text-secondary); }
    .dc__grade-value { font-weight: 600; min-width: 32px; }
    .dc__review-buttons { display: flex; gap: var(--space-2); flex-wrap: wrap; }

    .dc__external-file {
      display: inline-flex; align-items: center; gap: var(--space-2);
      margin-top: var(--space-2);
      padding: var(--space-2) var(--space-3);
      background: var(--bg-hover, #f5f5f5);
      border-radius: var(--border-radius-md);
      text-decoration: none; color: inherit; font-size: .8125rem;
      max-width: 100%;
    }
    .dc__external-file:hover { background: rgba(0,0,0,0.08); }
    .dc__external-file mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .dc__external-file span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .dc__external-icon { margin-left: auto; color: var(--text-secondary); }
  `],
})
export class DeliverableCardComponent {
  readonly deliverable = input.required<Deliverable>();
  readonly canSubmit = input(false);
  readonly canReview = input(false);

  readonly reviewed = output<DeliverableReviewEvent>();
  readonly submitted = output<DeliverableSubmitEvent>();

  private readonly snackBar = inject(MatSnackBar);
  readonly feedbackTextarea = viewChild<ElementRef<HTMLTextAreaElement>>('feedbackTextarea');

  readonly showReviewForm = signal(false);
  readonly rejectCommentError = signal(false);
  reviewFeedback = '';
  reviewGrade = 3;

  readonly config = computed<StatusConfig>(() =>
    statusOf('deliverable', this.deliverable().status),
  );

  readonly colors = computed(() => statusColors(this.config().tone));

  readonly reviewerDisplay = computed(() => {
    const d = this.deliverable();
    const role = (d.reviewerRole || d.reviewedByRole || '').toLowerCase();
    const name = d.reviewerName;

    let roleLabel = '';
    if (role === 'company') {
      roleLabel = 'Empresa';
    } else if (
      role === 'faculty' ||
      role === 'faculty_supervisor' ||
      role === 'asesor' ||
      role === 'academic' ||
      role === 'jury'
    ) {
      roleLabel = 'Asesor';
    } else if (role === 'admin') {
      roleLabel = 'Administrador';
    } else if (role) {
      roleLabel = role;
    }

    if (name && roleLabel) {
      return `${name} (${roleLabel})`;
    } else if (name) {
      return name;
    } else if (roleLabel) {
      return roleLabel;
    }
    return null;
  });

  readonly reviewStatusActionLabel = computed(() => {
    const s = this.deliverable().status;
    if (s === 'approved') return 'Aprobado';
    if (s === 'rejected') return 'Rechazado';
    if (s === 'needs_revision') return 'Corrección solicitada';
    return null;
  });

  readonly isSubmittable = computed(() => {
    const s = this.deliverable().status;
    return s === 'pending' || s === 'needs_revision';
  });

  /**
   * "Vencido" tiene sentido solo cuando la entrega aún se espera; una vez
   * entregado (aunque haya sido tarde), el estado ya no es "overdue" — lo
   * que corresponde es marcarlo como "entregado fuera de plazo".
   */
  readonly isAwaitingDelivery = computed(() => {
    const s = this.deliverable().status;
    return s === 'pending' || s === 'needs_revision';
  });

  readonly isVisuallyOverdue = computed(() => {
    if (!this.isAwaitingDelivery()) return false;
    return !!this.deliverable().isOverdue;
  });

  readonly wasDeliveredOnTime = computed(() => {
    const d = this.deliverable();
    if (!d.submittedAt || !d.dueDate) return true;
    return new Date(d.submittedAt).getTime() <= new Date(d.dueDate).getTime();
  });

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.submitted.emit({
        deliverableId: this.deliverable().id,
        files: Array.from(input.files),
      });
      input.value = '';
    }
  }

  isExternalUrl(value: string): boolean {
    return /^https?:\/\//i.test(value);
  }

  extractFileName(url: string): string {
    try {
      const path = new URL(url).pathname;
      return decodeURIComponent(path.split('/').filter(Boolean).pop() ?? 'archivo');
    } catch {
      return 'archivo';
    }
  }

  openReviewForm(): void {
    this.rejectCommentError.set(false);
    this.showReviewForm.set(true);
  }

  onFeedbackChange(): void {
    if (this.rejectCommentError() && this.reviewFeedback.trim().length > 0) {
      this.rejectCommentError.set(false);
    }
  }

  cancelReview(): void {
    this.showReviewForm.set(false);
    this.rejectCommentError.set(false);
    this.reviewFeedback = '';
    this.reviewGrade = 3;
  }

  emitReview(action: 'approved' | 'rejected' | 'needs_revision'): void {
    if (action === 'rejected') {
      if (!this.reviewFeedback || !this.reviewFeedback.trim()) {
        this.rejectCommentError.set(true);
        this.snackBar.open(
          'Debes ingresar un comentario de retroalimentación para rechazar el entregable.',
          'Cerrar',
          { duration: 4000 },
        );
        this.feedbackTextarea()?.nativeElement?.focus();
        return;
      }
    }

    this.rejectCommentError.set(false);
    this.reviewed.emit({
      deliverableId: this.deliverable().id,
      action,
      grade: this.reviewGrade,
      feedback: this.reviewFeedback.trim() || undefined,
    });
    this.showReviewForm.set(false);
    this.reviewFeedback = '';
    this.reviewGrade = 3;
  }
}
