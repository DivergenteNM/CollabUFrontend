import {
  Component, ChangeDetectionStrategy, inject, input, computed, signal, effect,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import {
  Evaluation, EvaluationCriteria, EvaluationRating,
} from '../../../../core/models';
import { AuthStore } from '../../../../state/auth.store';
import { EvaluationService } from '../../services/evaluation.service';
import { StarRatingComponent } from '../../../../shared/components/ui/star-rating/star-rating.component';
import { MatchScoreBarComponent } from '../../../../shared/components/ui/match-score-bar/match-score-bar.component';
import { SkeletonComponent } from '../../../../shared/components/ui/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state.component';

interface CriterionDraft {
  criterionId: string;
  name: string;
  description: string | null;
  category: string;
  score: number;
  comment: string;
}

/**
 * Detalle de evaluación con dos modos:
 *   - COMPLETED: muestra criterios evaluados con scores, overall, strengths.
 *   - PENDING (soy evaluador): formulario con sliders 0-100 por criterio,
 *     campos overall/strengths/areasForImprovement, submit.
 * Cualquier otro caso muestra "solo lectura, aún no completada".
 */
@Component({
  selector: 'app-evaluation-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule, DatePipe,
    MatButtonModule, MatIconModule, MatCardModule, MatDividerModule,
    MatFormFieldModule, MatInputModule, MatSliderModule, MatSnackBarModule,
    MatProgressSpinnerModule,
    StarRatingComponent, MatchScoreBarComponent, SkeletonComponent, EmptyStateComponent,
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

  readonly submitting = signal(false);
  readonly drafts = signal<CriterionDraft[]>([]);
  overallScore = 80;
  overallComment = '';
  strengths = '';
  areasForImprovement = '';

  readonly resource = rxResource({
    params: () => this.id(),
    stream: ({ params: id }) =>
      this.evaluationService.getById(id).pipe(
        catchError(() => of(null as Evaluation | null)),
      ),
  });

  readonly evaluation = computed<Evaluation | null>(() => this.resource.value() ?? null);

  readonly criteriaResource = rxResource({
    params: () => this.evaluation()?.evaluationType,
    stream: ({ params: type }) =>
      type
        ? this.evaluationService.getCriteria(type).pipe(catchError(() => of([] as EvaluationCriteria[])))
        : of([] as EvaluationCriteria[]),
  });

  readonly criteria = computed<EvaluationCriteria[]>(() => this.criteriaResource.value() ?? []);

  readonly currentUserId = computed(() => this.authStore.user()?.id ?? null);

  readonly isEvaluator = computed(() =>
    !!this.evaluation() && this.evaluation()!.evaluatorId === this.currentUserId(),
  );

  readonly isEvaluated = computed(() =>
    !!this.evaluation() && this.evaluation()!.evaluatedId === this.currentUserId(),
  );

  readonly isPending = computed(() => {
    const s = this.evaluation()?.status;
    return s === 'pending' || s === 'in_progress';
  });

  readonly isCompleted = computed(() => this.evaluation()?.status === 'completed');

  readonly canSubmit = computed(() => this.isEvaluator() && this.isPending());

  readonly ratingsByCriterionId = computed<Record<string, EvaluationRating>>(() => {
    const map: Record<string, EvaluationRating> = {};
    for (const r of this.evaluation()?.ratings ?? []) {
      map[r.criterionId] = r;
    }
    return map;
  });

  readonly typeLabel: Record<string, string> = {
    company_evaluates_student: 'Empresa evalúa al estudiante',
    student_evaluates_company: 'Estudiante evalúa a la empresa',
    supervisor_evaluates_student: 'Asesor evalúa al estudiante',
    student_evaluates_supervisor: 'Estudiante evalúa al asesor',
    self_evaluation: 'Autoevaluación',
  };

  constructor() {
    // Al cargar criterios + evaluación pendiente, inicializamos drafts.
    effect(() => {
      const ev = this.evaluation();
      const crits = this.criteria();
      if (!ev || crits.length === 0) return;
      if (this.drafts().length > 0) return;   // No sobrescribir si el usuario ya escribió

      const existingRatings = this.ratingsByCriterionId();
      this.drafts.set(
        crits
          .filter((c) => c.isActive)
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((c) => ({
            criterionId: c.id,
            name: c.name,
            description: c.description,
            category: c.category,
            score: Number(existingRatings[c.id]?.score ?? 80),
            comment: existingRatings[c.id]?.comment ?? '',
          })),
      );

      if (this.isCompleted() && ev.overallScore != null) {
        this.overallScore = Number(ev.overallScore);
        this.overallComment = ev.overallComment ?? '';
        this.strengths = ev.strengths ?? '';
        this.areasForImprovement = ev.areasForImprovement ?? '';
      }
    });
  }

  updateDraftScore(criterionId: string, score: number): void {
    this.drafts.update((all) => all.map((d) =>
      d.criterionId === criterionId ? { ...d, score } : d,
    ));
    // Overall score deriva del promedio ponderado simple de los criterios,
    // pero permitimos que el evaluador lo ajuste manualmente después.
    const avg = this.drafts().reduce((s, d) => s + d.score, 0) / (this.drafts().length || 1);
    this.overallScore = Math.round(avg);
  }

  updateDraftComment(criterionId: string, comment: string): void {
    this.drafts.update((all) => all.map((d) =>
      d.criterionId === criterionId ? { ...d, comment } : d,
    ));
  }

  submit(): void {
    if (!this.canSubmit() || this.submitting()) return;
    if (this.drafts().length === 0) {
      this.snackBar.open('No hay criterios cargados para esta evaluación.', 'Cerrar', { duration: 4000 });
      return;
    }

    this.submitting.set(true);
    this.evaluationService.submit(this.id(), {
      ratings: this.drafts().map((d) => ({
        criterionId: d.criterionId,
        score: d.score,
        comment: d.comment?.trim() || undefined,
      })),
      overallScore: this.overallScore,
      overallComment: this.overallComment.trim() || undefined,
      strengths: this.strengths.trim() || undefined,
      areasForImprovement: this.areasForImprovement.trim() || undefined,
    }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.snackBar.open('Evaluación enviada. Gracias por tu retroalimentación.', 'OK', { duration: 4000 });
        this.resource.reload();
      },
      error: (err) => {
        this.submitting.set(false);
        const raw = err?.error?.message;
        const msg = Array.isArray(raw) ? raw.join('; ') : raw ?? 'Error al enviar la evaluación';
        this.snackBar.open(msg, 'Cerrar', { duration: 6000 });
      },
    });
  }

  /** Backend usa escala 0-100; frontend muestra en 0-5 para UX consistente. */
  displayScore(score: number | null | undefined): string {
    if (score == null) return '—';
    return (Number(score) / 20).toFixed(1);
  }
}
