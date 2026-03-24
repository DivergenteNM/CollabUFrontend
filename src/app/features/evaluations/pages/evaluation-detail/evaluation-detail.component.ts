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
  templateUrl: './evaluation-detail.component.html',
  styleUrl: './evaluation-detail.component.scss',
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
