import {
  Component, ChangeDetectionStrategy, inject, signal, computed,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { httpResource } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { environment } from '../../../../../environments/environment';
import {
  Application,
  EvaluationType,
  PaginatedResponse,
  EvaluationCriteria,
  ApiResponse,
} from '../../../../core/models';
import { AuthStore } from '../../../../state/auth.store';
import { EvaluationService } from '../../services/evaluation.service';
import { ApplicationService } from '../../../applications/services/application.service';
import { StarRatingComponent } from '../../../../shared/components/ui/star-rating/star-rating.component';
import { SkeletonComponent } from '../../../../shared/components/ui/skeleton/skeleton.component';

interface RatingItem {
  criterionId: string;
  criterionName: string;
  score: number;
  comment?: string;
}

@Component({
  selector: 'app-evaluation-create',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatButtonModule, MatIconModule, MatCardModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatSlideToggleModule, MatSnackBarModule,
    StarRatingComponent, SkeletonComponent,
  ],
  templateUrl: './evaluation-create.component.html',
  styleUrl: './evaluation-create.component.scss',
})
export class EvaluationCreateComponent {
  readonly router = inject(Router);
  private readonly evaluationService = inject(EvaluationService);
  private readonly applicationService = inject(ApplicationService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly authStore = inject(AuthStore);

  readonly step = signal<1 | 2>(1);
  readonly selectedApp = signal<Application | null>(null);
  readonly createdEvalId = signal<string | null>(null);
  readonly overallScore = signal(0);
  readonly overallComment = signal('');
  readonly strengths = signal('');
  readonly areasForImprovement = signal('');
  readonly isAnonymous = signal(false);
  readonly submitting = signal(false);

  readonly eligibleResource = httpResource<PaginatedResponse<Application>>(
    () => ({
      url: `${environment.apiUrl}/applications/my`,
      params: { status: 'completed,in_progress', limit: 100 },
    }),
  );

  readonly eligibleApps = computed(() =>
    this.eligibleResource.value()?.data ?? [],
  );

  readonly criteriaResource = httpResource<ApiResponse<EvaluationCriteria[]>>(
    () => this.selectedApp()
      ? { url: `${environment.apiUrl}/evaluations/criteria`, params: { evaluationType: this.evaluationTypeForSelectedApp() } }
      : null as any,
  );

  readonly criteria = computed<EvaluationCriteria[]>(() =>
    this.criteriaResource.value()?.data ?? [],
  );

  readonly ratings = signal<RatingItem[]>([]);

  readonly evaluationTypeForSelectedApp = computed<EvaluationType | null>(() => {
    if (!this.selectedApp()) return null;
    return this.authStore.isStudent()
      ? EvaluationType.COMPANY_EVALUATES_STUDENT
      : EvaluationType.STUDENT_EVALUATES_COMPANY;
  });

  readonly canProceedToStep2 = computed(() =>
    this.selectedApp() !== null,
  );

  readonly canSubmit = computed(() =>
    this.overallScore() > 0
    && this.overallComment().trim().length >= 10
    && this.ratings().length > 0
    && this.ratings().every(r => r.score > 0),
  );

  onSelectApplication(app: Application): void {
    this.selectedApp.set(app);
    this.step.set(2);
    this.ratings.set([]);
    this.overallScore.set(0);
    this.overallComment.set('');
    this.strengths.set('');
    this.areasForImprovement.set('');
  }

  onBackToStep1(): void {
    this.selectedApp.set(null);
    this.step.set(1);
    this.ratings.set([]);
  }

  onOverallScoreChange(score: number): void {
    this.overallScore.set(score);
  }

  onCriterionScoreChange(criterionId: string, score: number): void {
    this.ratings.update(prev => {
      const existing = prev.find(r => r.criterionId === criterionId);
      if (existing) {
        return prev.map(r => r.criterionId === criterionId ? { ...r, score } : r);
      }
      const criterion = this.criteria().find(c => c.id === criterionId);
      return [...prev, {
        criterionId,
        criterionName: criterion?.name ?? criterionId,
        score,
      }];
    });
  }

  submit(): void {
    if (!this.canSubmit()) return;
    const evalId = this.createdEvalId();
    if (!evalId) return;
    this.submitting.set(true);

    const dto = {
      ratings: this.ratings().map(r => ({
        criterionId: r.criterionId,
        score: r.score,
        comment: r.comment,
      })),
      overallComment: this.overallComment(),
      strengths: this.strengths(),
      areasForImprovement: this.areasForImprovement(),
    };

    this.evaluationService.submitEvaluation(evalId, dto).subscribe({
      next: () => {
        this.snackBar.open('Evaluación enviada exitosamente', 'OK', { duration: 3000 });
        this.router.navigate(['/my-evaluations']);
      },
      error: () => {
        this.snackBar.open('Error al enviar la evaluación', 'Cerrar', { duration: 4000 });
        this.submitting.set(false);
      },
    });
  }

  createAndSubmit(): void {
    const app = this.selectedApp();
    const evalType = this.evaluationTypeForSelectedApp();
    if (!app || !evalType) return;
    this.submitting.set(true);

    const createData = {
      applicationId: app.id,
      projectId: app.projectId,
      evaluatedId: app.studentId,
      evaluationType: evalType,
      isAnonymous: this.isAnonymous(),
    };

    this.evaluationService.createEvaluation(createData).subscribe({
      next: (response) => {
        const evalId = response.data?.id;
        if (!evalId) {
          this.snackBar.open('Error: ID de evaluación no recibido', 'Cerrar', { duration: 4000 });
          this.submitting.set(false);
          return;
        }
        this.createdEvalId.set(evalId);
        this.submit();
      },
      error: () => {
        this.snackBar.open('Error al crear la evaluación', 'Cerrar', { duration: 4000 });
        this.submitting.set(false);
      },
    });
  }
}