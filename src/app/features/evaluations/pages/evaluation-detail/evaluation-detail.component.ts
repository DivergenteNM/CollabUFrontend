import {
  Component, ChangeDetectionStrategy, inject, signal, computed, OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DecimalPipe, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { environment } from '../../../../../environments/environment';
import {
  Evaluation,
  ApiResponse,
  EvaluationType,
  EvaluationStatus,
} from '../../../../core/models';
import { EvaluationService } from '../../services/evaluation.service';
import { StarRatingComponent } from '../../../../shared/components/ui/star-rating/star-rating.component';
import { SkeletonComponent } from '../../../../shared/components/ui/skeleton/skeleton.component';
import { StatusBadgeComponent } from '../../../../shared/components/ui/status-badge/status-badge.component';

@Component({
  selector: 'app-evaluation-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe, DatePipe,
    MatButtonModule, MatIconModule, MatCardModule, MatDividerModule,
    MatSnackBarModule,
    StarRatingComponent, SkeletonComponent, StatusBadgeComponent,
  ],
  templateUrl: './evaluation-detail.component.html',
  styleUrl: './evaluation-detail.component.scss',
})
export class EvaluationDetailComponent implements OnInit {
  readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly evaluationService = inject(EvaluationService);
  private readonly snackBar = inject(MatSnackBar);

  readonly isLoading = signal(true);
  readonly evaluation = signal<Evaluation | null>(null);
  readonly projectName = signal('');
  readonly companyName = signal('');
  readonly studentName = signal('');
  readonly evaluatorRole = signal('');

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadEvaluation(id);
    } else {
      this.router.navigate(['/my-evaluations']);
    }
  }

  private loadEvaluation(id: string): void {
    this.isLoading.set(true);
    this.evaluationService.getById(id).subscribe({
      next: (response) => {
        console.log('Evaluation response:', response);
        // Backend returns raw Evaluation object, not wrapped in {data:}
        const evalData = response?.data ?? response;
        if (!evalData || typeof evalData !== 'object') {
          this.snackBar.open('Evaluación no encontrada', 'OK', { duration: 3000 });
          this.router.navigate(['/my-evaluations']);
          return;
        }
        this.evaluation.set(evalData as Evaluation);
        this.loadRelatedData(evalData as Evaluation);
      },
      error: (err) => {
        console.error('Error loading evaluation:', err);
        const message = err?.error?.message || 'Error al cargar la evaluación';
        this.snackBar.open(message, 'OK', { duration: 3000 });
        this.router.navigate(['/my-evaluations']);
      },
    });
  }

  private loadRelatedData(evaluation: Evaluation): void {
    this.projectName.set('Proyecto #' + evaluation.projectId.substring(0, 8));
    this.companyName.set('Empresa #' + evaluation.evaluatedId.substring(0, 8));
    this.studentName.set('Estudiante #' + evaluation.evaluatorId.substring(0, 8));

    if (evaluation.evaluationType === EvaluationType.STUDENT_EVALUATES_COMPANY) {
      this.evaluatorRole.set('Estudiante');
    } else if (evaluation.evaluationType === EvaluationType.COMPANY_EVALUATES_STUDENT) {
      this.evaluatorRole.set('Empresa');
    } else {
      this.evaluatorRole.set('Supervisor');
    }

    this.isLoading.set(false);
  }

  readonly statusLabel = computed(() => {
    const status = this.evaluation()?.status;
    if (!status) return '';
    const labels: Record<EvaluationStatus, string> = {
      [EvaluationStatus.PENDING]: 'Pendiente',
      [EvaluationStatus.IN_PROGRESS]: 'En progreso',
      [EvaluationStatus.COMPLETED]: 'Completada',
      [EvaluationStatus.EXPIRED]: 'Expirada',
    };
    return labels[status] ?? status;
  });

  readonly typeLabel = computed(() => {
    const type = this.evaluation()?.evaluationType;
    if (!type) return '';
    const labels: Record<EvaluationType, string> = {
      [EvaluationType.COMPANY_EVALUATES_STUDENT]: 'Empresa evalúa estudiante',
      [EvaluationType.STUDENT_EVALUATES_COMPANY]: 'Estudiante evalúa empresa',
      [EvaluationType.SUPERVISOR_EVALUATES_STUDENT]: 'Supervisor evalúa estudiante',
      [EvaluationType.SELF_EVALUATION]: 'Auto-evaluación',
    };
    return labels[type] ?? type;
  });

  readonly overallScoreDisplay = computed(() => {
    const score = this.evaluation()?.overallScore;
    return score != null ? score : 0;
  });

  readonly hasRatings = computed(() => {
    const ratings = this.evaluation()?.ratings;
    return ratings && ratings.length > 0;
  });

  readonly formattedDate = computed(() => {
    const date = this.evaluation()?.createdAt;
    if (!date) return '';
    return new Date(date).toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  });

  onBack(): void {
    this.router.navigate(['/my-evaluations']);
  }
}