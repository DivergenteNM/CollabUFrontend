import {
  Component, ChangeDetectionStrategy, inject, input, computed, signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { httpResource } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { environment } from '../../../../../environments/environment';
import { ApiResponse, Evaluation } from '../../../../core/models';
import { AuthStore } from '../../../../state/auth.store';
import { EvaluationService } from '../../services/evaluation.service';
import { StarRatingComponent } from '../../../../shared/components/ui/star-rating/star-rating.component';
import { MatchScoreBarComponent } from '../../../../shared/components/ui/match-score-bar/match-score-bar.component';
import { SkeletonComponent } from '../../../../shared/components/ui/skeleton/skeleton.component';

@Component({
  selector: 'app-evaluation-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule, DatePipe,
    MatButtonModule, MatIconModule, MatCardModule, MatDividerModule,
    MatFormFieldModule, MatInputModule, MatSnackBarModule,
    StarRatingComponent, MatchScoreBarComponent, SkeletonComponent,
  ],
  template: `
    <div class="detail">
      <button mat-button class="detail__back" (click)="router.navigate(['/my-evaluations'])">
        <mat-icon>arrow_back</mat-icon> Volver a evaluaciones
      </button>

      @if (evalResource.isLoading()) {
        <app-skeleton width="100%" height="200px" />
        <app-skeleton width="100%" height="300px" />
      } @else if (evaluation(); as ev) {
        <!-- Rating Header -->
        <mat-card class="detail__rating-card">
          <mat-card-content>
            <div class="detail__rating-header">
              <app-star-rating [value]="ev.overallRating" [readonly]="true" size="lg" />
              <div class="detail__rating-meta">
                <h2>{{ ev.projectTitle }}</h2>
                <p>
                  {{ ev.isAnonymous ? 'Evaluador anónimo' : ev.evaluatorType }}
                  · {{ ev.createdAt | date:'d MMMM yyyy' }}
                </p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Criteria Breakdown -->
        @if (ev.criteria.length > 0) {
          <mat-card class="detail__criteria">
            <mat-card-content>
              <h3><mat-icon>assessment</mat-icon> Desglose de criterios</h3>
              <div class="detail__criteria-bars">
                @for (c of ev.criteria; track c.criteriaId) {
                  <app-match-score-bar
                    [score]="c.rating * 20"
                    [label]="c.criteriaName"
                    size="md" />
                }
              </div>
            </mat-card-content>
          </mat-card>
        }

        <!-- Comment -->
        <mat-card class="detail__comment">
          <mat-card-content>
            <h3><mat-icon>comment</mat-icon> Comentario</h3>
            <p class="detail__comment-text">{{ ev.comment }}</p>
          </mat-card-content>
        </mat-card>

        <mat-divider />

        <!-- Response -->
        @if (ev.response) {
          <mat-card class="detail__response">
            <mat-card-content>
              <h3><mat-icon>reply</mat-icon> Respuesta</h3>
              <p class="detail__response-text">{{ ev.response.content }}</p>
              <span class="detail__response-date">{{ ev.response.respondedAt | date:'d MMM yyyy, HH:mm' }}</span>
            </mat-card-content>
          </mat-card>
        } @else if (isReceivedEvaluation()) {
          <!-- Reply form for received evaluations -->
          <mat-card class="detail__reply">
            <mat-card-content>
              @if (!showReplyForm()) {
                <button mat-stroked-button (click)="showReplyForm.set(true)">
                  <mat-icon>reply</mat-icon> Responder a esta evaluación
                </button>
              } @else {
                <h3>Tu respuesta</h3>
                <mat-form-field appearance="outline" class="detail__reply-field">
                  <mat-label>Escribe tu respuesta</mat-label>
                  <textarea matInput rows="3" [ngModel]="replyText()" (ngModelChange)="replyText.set($event)"></textarea>
                </mat-form-field>
                <div class="detail__reply-actions">
                  <button mat-button (click)="showReplyForm.set(false)">Cancelar</button>
                  <button mat-flat-button
                    [disabled]="!replyText().trim() || replying()"
                    (click)="submitReply()">
                    Enviar respuesta
                  </button>
                </div>
              }
            </mat-card-content>
          </mat-card>
        }
      }
    </div>
  `,
  styles: `
    :host { display: block; padding: 24px; max-width: 800px; margin: 0 auto; }

    .detail__back { margin-bottom: 16px; }

    mat-card { margin-bottom: 16px; }

    .detail__rating-header {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .detail__rating-meta {
      h2 { font-size: 1.25rem; font-weight: 700; margin: 0 0 4px; color: var(--mat-sys-on-surface); }
      p { font-size: 0.875rem; color: var(--mat-sys-on-surface-variant); margin: 0; }
    }

    .detail__criteria {
      h3 {
        display: flex; align-items: center; gap: 8px;
        font-size: 1rem; font-weight: 600; margin: 0 0 16px;
        mat-icon { color: var(--mat-sys-primary); }
      }
    }

    .detail__criteria-bars {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .detail__comment {
      h3 {
        display: flex; align-items: center; gap: 8px;
        font-size: 1rem; font-weight: 600; margin: 0 0 12px;
        mat-icon { color: var(--mat-sys-primary); }
      }
    }

    .detail__comment-text {
      font-size: 0.9375rem;
      line-height: 1.6;
      color: var(--mat-sys-on-surface);
      margin: 0;
      white-space: pre-wrap;
    }

    mat-divider { margin: 24px 0; }

    .detail__response {
      background: var(--mat-sys-surface-container-low);
      h3 {
        display: flex; align-items: center; gap: 8px;
        font-size: 1rem; font-weight: 600; margin: 0 0 8px;
        mat-icon { color: var(--mat-sys-tertiary); }
      }
    }

    .detail__response-text {
      font-size: 0.9375rem;
      line-height: 1.5;
      margin: 0 0 8px;
      white-space: pre-wrap;
    }

    .detail__response-date {
      font-size: 0.75rem;
      color: var(--mat-sys-on-surface-variant);
    }

    .detail__reply-field { width: 100%; }

    .detail__reply-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }

    @media (max-width: 600px) {
      :host { padding: 16px; }
      .detail__rating-header { flex-direction: column; align-items: flex-start; }
    }
  `,
})
export class EvaluationDetailComponent {
  readonly router = inject(Router);
  private readonly evaluationService = inject(EvaluationService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly authStore = inject(AuthStore);

  readonly id = input.required<string>();

  readonly showReplyForm = signal(false);
  readonly replyText = signal('');
  readonly replying = signal(false);

  readonly evalResource = httpResource<ApiResponse<Evaluation>>(
    () => ({
      url: `${environment.apiUrl}/evaluations/${this.id()}`,
    }),
  );

  readonly evaluation = computed(() =>
    this.evalResource.value()?.data ?? null,
  );

  readonly isReceivedEvaluation = computed(() => {
    const ev = this.evaluation();
    if (!ev) return false;
    return ev.evaluatedId === this.authStore.user()?.id;
  });

  submitReply(): void {
    const text = this.replyText().trim();
    if (!text) return;
    this.replying.set(true);

    this.evaluationService.respondToEvaluation(this.id(), text).subscribe({
      next: () => {
        this.snackBar.open('Respuesta enviada', 'OK', { duration: 3000 });
        this.evalResource.reload();
        this.showReplyForm.set(false);
        this.replying.set(false);
      },
      error: () => {
        this.snackBar.open('Error al enviar la respuesta', 'Cerrar', { duration: 4000 });
        this.replying.set(false);
      },
    });
  }
}
