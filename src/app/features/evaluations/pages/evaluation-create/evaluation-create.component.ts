import {
  Component, ChangeDetectionStrategy, inject, signal, computed, OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { switchMap, of, catchError, map } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import {
  Application,
  Evaluation,
  EvaluationType,
  PaginatedResponse,
  EvaluationCriteria,
  ApiResponse,
} from '../../../../core/models';
import { ApplicationStatus } from '../../../../core/enums';
import { AuthStore } from '../../../../state/auth.store';
import { EvaluationService } from '../../services/evaluation.service';
import { StarRatingComponent } from '../../../../shared/components/ui/star-rating/star-rating.component';
import { SkeletonComponent } from '../../../../shared/components/ui/skeleton/skeleton.component';
import { StatusBadgeComponent } from '../../../../shared/components/ui/status-badge/status-badge.component';

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
    DatePipe,
    MatButtonModule, MatIconModule, MatCardModule,
    MatFormFieldModule, MatInputModule,
    MatSlideToggleModule, MatSnackBarModule,
    StarRatingComponent, SkeletonComponent, StatusBadgeComponent,
  ],
  templateUrl: './evaluation-create.component.html',
  styleUrl: './evaluation-create.component.scss',
})
export class EvaluationCreateComponent implements OnInit {
  readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly evaluationService = inject(EvaluationService);
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
  readonly isLoading = signal(true);
  readonly eligibleApps = signal<Application[]>([]);
  readonly criteria = signal<EvaluationCriteria[]>([]);
  readonly isLoadingCriteria = signal(false);
  readonly ratings = signal<RatingItem[]>([]);
  readonly existingEvalIds = signal<Set<string>>(new Set());

  ngOnInit(): void {
    this.fetchExistingEvaluations();
  }

  private fetchExistingEvaluations(): void {
    this.evaluationService.getMyEvaluations('given', { limit: 100 }).subscribe({
      next: (res) => {
        const evalIds = new Set(res.data.map((e: Evaluation) => e.applicationId));
        this.existingEvalIds.set(evalIds);
        this.fetchApplications();
      },
      error: () => {
        this.fetchApplications();
      },
    });
  }

  private fetchApplications(): void {
    this.isLoading.set(true);
    const isStudent = this.authStore.isStudent();
    const endpoint = isStudent
      ? `${environment.apiUrl}/applications/my`
      : `${environment.apiUrl}/applications/received`;

    this.http.get<PaginatedResponse<Application>>(
      `${endpoint}?status=completed&limit=100`
    ).pipe(
      switchMap((res: PaginatedResponse<Application>) => {
        if (res.data && res.data.length > 0) {
          return of(res.data);
        }
        return this.http.get<PaginatedResponse<Application>>(
          `${endpoint}?status=in_progress&limit=100`
        ).pipe(map((r: PaginatedResponse<Application>) => r.data ?? []));
      }),
      catchError(() => {
        return this.http.get<PaginatedResponse<Application>>(
          `${endpoint}?limit=100`
        ).pipe(map((r: PaginatedResponse<Application>) => r.data ?? []));
      }),
    ).subscribe({
      next: (apps: Application[]) => {
        const existing = this.existingEvalIds();
        const filtered = existing.size > 0
          ? apps.filter((app: Application) => !existing.has(app.id))
          : apps;
        this.eligibleApps.set(filtered);
        this.isLoading.set(false);
      },
      error: () => {
        this.eligibleApps.set([]);
        this.isLoading.set(false);
      },
    });
  }

  readonly evaluationTypeForSelectedApp = computed<EvaluationType | null>(() => {
    if (!this.selectedApp()) return null;
    return this.authStore.isStudent()
      ? EvaluationType.STUDENT_EVALUATES_COMPANY
      : EvaluationType.COMPANY_EVALUATES_STUDENT;
  });

  readonly canProceedToStep2 = computed(() => this.selectedApp() !== null);

  readonly canSubmit = computed(() =>
    this.overallScore() > 0
    && this.overallComment().trim().length >= 10
    && (
      this.criteria().length === 0
      || (this.ratings().length > 0 && this.ratings().every((r: RatingItem) => r.score > 0))
    ),
  );

  onSelectApplication(app: Application): void {
    this.selectedApp.set(app);
    this.step.set(2);
    this.ratings.set([]);
    this.overallScore.set(0);
    this.overallComment.set('');
    this.strengths.set('');
    this.areasForImprovement.set('');
    this.loadCriteria();
  }

  private loadCriteria(): void {
    const evalType = this.evaluationTypeForSelectedApp();
    if (!evalType) return;
    this.isLoadingCriteria.set(true);
    this.evaluationService.getCriteria(evalType).subscribe({
      next: (response: ApiResponse<EvaluationCriteria[]>) => {
        this.criteria.set(response.data ?? []);
        this.isLoadingCriteria.set(false);
      },
      error: () => {
        this.criteria.set([]);
        this.isLoadingCriteria.set(false);
      },
    });
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
    this.ratings.update((prev: RatingItem[]) => {
      const existing = prev.find((r: RatingItem) => r.criterionId === criterionId);
      if (existing) {
        return prev.map((r: RatingItem) => r.criterionId === criterionId ? { ...r, score } : r);
      }
      const criterion = this.criteria().find((c: EvaluationCriteria) => c.id === criterionId);
      return [...prev, { criterionId, criterionName: criterion?.name ?? criterionId, score }];
    });
  }

  findRating(criterionId: string): number {
    const found = this.ratings().find((r: RatingItem) => r.criterionId === criterionId);
    return found ? found.score : 0;
  }

  submit(): void {
    if (!this.canSubmit()) return;
    const evalId = this.createdEvalId();
    if (!evalId) return;
    this.submitting.set(true);

    const dto = {
      ratings: this.ratings().map((r: RatingItem) => ({
        criterionId: r.criterionId,
        score: r.score,
        comment: r.comment,
      })),
      overallScore: this.overallScore(),
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
      next: (response: any) => {
        console.log('Create evaluation response:', response);
        const evalId = response?.data?.id ?? response?.id;
        if (!evalId) {
          this.snackBar.open('Error: ID de evaluación no recibido', 'Cerrar', { duration: 4000 });
          this.submitting.set(false);
          return;
        }
        this.createdEvalId.set(evalId);
        this.submit();
      },
      error: (err) => {
        if (err.status === 409) {
          this.evaluationService.getByApplication(app.id).subscribe({
            next: (evals: any) => {
              const existingEval = evals?.data?.[0];
              if (existingEval?.id) {
                this.createdEvalId.set(existingEval.id);
                this.submit();
              } else {
                this.snackBar.open('No se pudo encontrar la evaluación existente', 'Cerrar', { duration: 4000 });
                this.submitting.set(false);
              }
            },
            error: () => {
              this.snackBar.open('Error al buscar evaluación existente', 'Cerrar', { duration: 4000 });
              this.submitting.set(false);
            },
          });
        } else {
          this.snackBar.open('Error al crear la evaluación', 'Cerrar', { duration: 4000 });
          this.submitting.set(false);
        }
      },
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      [ApplicationStatus.COMPLETED]: 'Completada',
      [ApplicationStatus.IN_PROGRESS]: 'En progreso',
    };
    return labels[status] ?? status;
  }

  getEvaluationRoleLabel(): string {
    return this.authStore.isStudent() ? 'Evaluar empresa' : 'Evaluar estudiante';
  }

  getProjectTypeLabel(type: string | undefined): string {
    if (!type) return '';
    const map: Record<string, string> = {
      professional_practice: 'Práctica profesional',
      social_service: 'Servicio social',
      research: 'Investigación',
      internship: 'Pasantía',
    };
    return map[type] ?? type;
  }

  getSelectedAppTitle(): string {
    return this.selectedApp()?.project?.title ?? 'Proyecto seleccionado';
  }

  getSelectedAppCompany(): string {
    return this.selectedApp()?.project?.companyName ?? '';
  }

  getSelectedAppLocation(): string {
    const project = this.selectedApp()?.project;
    if (!project) return '';
    return project.isRemote ? 'Remoto' : (project.location ?? 'Presencial');
  }

  getAppliedDate(): string {
    const app = this.selectedApp();
    if (!app) return '';
    const date = new Date(app.appliedAt);
    return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  getEvaluationTypeLabel(): string {
    return this.authStore.isStudent()
      ? 'Evaluar a la empresa'
      : 'Evaluar al estudiante';
  }

  getEvaluationRole(): string {
    return this.authStore.isStudent() ? 'student' : 'company';
  }
}