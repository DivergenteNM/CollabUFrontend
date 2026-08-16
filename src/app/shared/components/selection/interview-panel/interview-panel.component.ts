import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FileLinkComponent } from '../../ui/file-link/file-link.component';
import { Interview } from '../../../../core/models/application.model';

const TYPE_LABELS: Record<string, string> = {
  phone: 'Telefónica', video: 'Videollamada', in_person: 'Presencial', technical: 'Prueba técnica',
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Programada', completed: 'Completada', cancelled: 'Cancelada',
  rescheduled: 'Reagendada', no_show: 'No se presentó',
};

/**
 * Entrevista(s) de la postulación. Empresa/admin gestionan (programar,
 * reagendar, cancelar, completar); estudiante solo consulta y ve el
 * resultado. Reutiliza los endpoints de entrevista ya existentes en backend
 * (Bloque previo) — este panel es la primera UI que los consume.
 */
@Component({
  selector: 'app-interview-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, FormsModule, MatCardModule, MatIconModule, MatButtonModule, MatChipsModule, MatFormFieldModule, MatInputModule, FileLinkComponent],
  template: `
    <mat-card class="ip">
      <mat-card-header>
        <mat-card-title>Entrevista</mat-card-title>
        @if (canManage()) {
          <button mat-stroked-button (click)="scheduleRequested.emit()">
            <mat-icon>add</mat-icon> {{ interviews().length ? 'Programar otra' : 'Programar' }}
          </button>
        }
      </mat-card-header>
      <mat-card-content>
        @if (interviews().length === 0) {
          <p class="ip__empty">
            @if (canManage()) {
              Aún no se ha programado una entrevista con el candidato.
            } @else {
              La empresa no ha programado una entrevista todavía.
            }
          </p>
        }
        @for (iv of interviews(); track iv.id) {
          <div class="ip__item">
            <div class="ip__item-header">
              <span class="ip__type">{{ typeLabel(iv.interviewType) }}</span>
              <span class="ip__status ip__status--{{ iv.status }}">{{ statusLabel(iv.status) }}</span>
            </div>
            <div class="ip__row">
              <mat-icon>event</mat-icon>
              <span>{{ iv.scheduledAt | date:'d MMM yyyy, h:mm a' }} · {{ iv.durationMinutes }} min</span>
            </div>
            @if (iv.location) {
              <div class="ip__row"><mat-icon>place</mat-icon><span>{{ iv.location }}</span></div>
            }
            @if (iv.meetingLink) {
              <div class="ip__row">
                <mat-icon>link</mat-icon>
                <a [href]="iv.meetingLink" target="_blank" rel="noopener">{{ iv.meetingLink }}</a>
              </div>
            }
            @if (iv.interviewerNotes) {
              <p class="ip__notes"><strong>Notas:</strong> {{ iv.interviewerNotes }}</p>
            }

            @if (iv.interviewType === 'technical' && (iv.technicalTaskDescription || canManage())) {
              <div class="ip__technical">
                <span class="ip__technical-title">Prueba técnica</span>
                @if (iv.technicalTaskDescription) { <p>{{ iv.technicalTaskDescription }}</p> }
                @if (iv.companyBriefFileId) { <app-file-link [fileId]="iv.companyBriefFileId" /> }
                @if (iv.studentSolutionFileId) {
                  <span class="ip__solution-label">Solución entregada:</span>
                  <app-file-link [fileId]="iv.studentSolutionFileId" />
                } @else if (isStudent() && iv.status === 'scheduled') {
                  <button mat-stroked-button (click)="uploadSolutionRequested.emit(iv.id)">
                    <mat-icon>upload</mat-icon> Subir solución
                  </button>
                }
              </div>
            }

            @if (iv.companyResolution) {
              <div class="ip__resolution ip__resolution--{{ iv.companyResolution }}">
                <mat-icon>{{ iv.companyResolution === 'passed' ? 'check_circle' : 'cancel' }}</mat-icon>
                <span>{{ iv.companyResolution === 'passed' ? 'Superada' : 'No superada' }}</span>
                @if (iv.resolutionComment) { <span class="ip__resolution-comment">— {{ iv.resolutionComment }}</span> }
              </div>
            }

            @if (iv.studentFeedback && editingId() !== iv.id) {
              <p class="ip__student-feedback">
                <strong>Comentario del estudiante:</strong> {{ iv.studentFeedback }}
              </p>
            }
            @if (isStudent()) {
              @if (editingId() === iv.id) {
                <div class="ip__feedback-form">
                  <mat-form-field appearance="outline" class="ip__feedback-field">
                    <mat-label>Tu comentario</mat-label>
                    <textarea matInput rows="2" [(ngModel)]="draftFeedback"></textarea>
                  </mat-form-field>
                  <div class="ip__feedback-actions">
                    <button mat-button (click)="cancelFeedback()">Cancelar</button>
                    <button mat-flat-button color="primary" [disabled]="!draftFeedback.trim()" (click)="saveFeedback(iv.id)">
                      Guardar
                    </button>
                  </div>
                </div>
              } @else {
                <button mat-button (click)="startFeedback(iv)">
                  <mat-icon>comment</mat-icon> {{ iv.studentFeedback ? 'Editar comentario' : 'Agregar comentario' }}
                </button>
              }
            }

            @if (canManage() && iv.status === 'scheduled') {
              <div class="ip__actions">
                <button mat-button (click)="rescheduleRequested.emit(iv.id)">
                  <mat-icon>event_repeat</mat-icon> Reagendar
                </button>
                <button mat-button (click)="completeRequested.emit(iv.id)">
                  <mat-icon>task_alt</mat-icon> Completar
                </button>
                <button mat-button color="warn" (click)="cancelRequested.emit(iv.id)">
                  <mat-icon>close</mat-icon> Cancelar
                </button>
              </div>
            }
          </div>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .ip mat-card-header { display: flex; align-items: center; justify-content: space-between; }
    .ip__empty { color: var(--text-secondary); font-size: .8125rem; font-style: italic; }
    .ip__item { border: 1px solid var(--border-color); border-radius: 8px; padding: 12px; margin-top: 10px; }
    .ip__item-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
    .ip__type { font-weight: 600; font-size: .8125rem; }
    .ip__status { font-size: .6875rem; padding: 2px 8px; border-radius: 10px; background: var(--bg-tertiary); }
    .ip__status--scheduled { color: var(--color-info); }
    .ip__status--completed { color: var(--color-success); }
    .ip__status--cancelled, .ip__status--no_show { color: var(--color-error); }
    .ip__row { display: flex; align-items: center; gap: 6px; font-size: .8125rem; margin-bottom: 4px; }
    .ip__row mat-icon { font-size: 16px; width: 16px; height: 16px; color: var(--text-secondary); }
    .ip__notes { font-size: .8125rem; color: var(--text-secondary); margin: 6px 0; }
    .ip__technical { background: var(--bg-tertiary); border-radius: 6px; padding: 10px; margin: 8px 0; }
    .ip__technical-title { font-size: .6875rem; font-weight: 600; text-transform: uppercase; }
    .ip__solution-label { display: block; font-size: .75rem; margin-top: 6px; }
    .ip__resolution { display: flex; align-items: center; gap: 6px; margin-top: 8px; font-size: .8125rem; }
    .ip__resolution--passed { color: var(--color-success); }
    .ip__resolution--failed { color: var(--color-error); }
    .ip__resolution-comment { color: var(--text-secondary); }
    .ip__actions { display: flex; gap: 4px; margin-top: 8px; }
    .ip__student-feedback {
      font-size: .8125rem; color: var(--text-primary); background: var(--bg-tertiary);
      padding: 8px 10px; border-radius: 6px; margin: 8px 0;
    }
    .ip__feedback-form { margin-top: 8px; display: flex; flex-direction: column; gap: 4px; }
    .ip__feedback-field { width: 100%; }
    .ip__feedback-actions { display: flex; gap: 4px; justify-content: flex-end; }
  `],
})
export class InterviewPanelComponent {
  readonly interviews = input.required<Interview[]>();
  readonly canManage = input(false);
  readonly isStudent = input(false);

  readonly scheduleRequested = output<void>();
  readonly rescheduleRequested = output<string>();
  readonly cancelRequested = output<string>();
  readonly completeRequested = output<string>();
  readonly uploadSolutionRequested = output<string>();
  readonly feedbackSubmitted = output<{ interviewId: string; feedback: string }>();

  readonly editingId = signal<string | null>(null);
  draftFeedback = '';

  typeLabel(t: string): string { return TYPE_LABELS[t] ?? t; }
  statusLabel(s: string): string { return STATUS_LABELS[s] ?? s; }

  startFeedback(iv: Interview): void {
    this.draftFeedback = iv.studentFeedback ?? '';
    this.editingId.set(iv.id);
  }

  cancelFeedback(): void {
    this.editingId.set(null);
    this.draftFeedback = '';
  }

  saveFeedback(interviewId: string): void {
    const feedback = this.draftFeedback.trim();
    if (!feedback) return;
    this.feedbackSubmitted.emit({ interviewId, feedback });
    this.editingId.set(null);
    this.draftFeedback = '';
  }
}
