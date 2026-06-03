import {
  Component, ChangeDetectionStrategy, inject, input, computed, signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { httpResource } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';

import { environment } from '../../../../../environments/environment';
import { ApiResponse, Evaluation } from '../../../../core/models';
import { EvaluationService } from '../../services/evaluation.service';
import { StarRatingComponent } from '../../../../shared/components/ui/star-rating/star-rating.component';
import { MatchScoreBarComponent } from '../../../../shared/components/ui/match-score-bar/match-score-bar.component';
import { SkeletonComponent } from '../../../../shared/components/ui/skeleton/skeleton.component';

@Component({
  selector: 'app-evaluation-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    MatButtonModule, MatIconModule, MatCardModule, MatDividerModule,
    StarRatingComponent, MatchScoreBarComponent, SkeletonComponent,
  ],
  templateUrl: './evaluation-detail.component.html',
  styleUrl: './evaluation-detail.component.scss',
})
export class EvaluationDetailComponent {
  readonly router = inject(Router);
  private readonly evaluationService = inject(EvaluationService);

  readonly id = input.required<string>();

  readonly evalResource = httpResource<ApiResponse<Evaluation>>(
    () => ({
      url: `${environment.apiUrl}/evaluations/${this.id()}`,
    }),
  );

  readonly evaluation = computed(() =>
    this.evalResource.value()?.data ?? null,
  );
}