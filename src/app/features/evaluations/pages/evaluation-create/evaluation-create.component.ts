import {
  Component, ChangeDetectionStrategy, inject, signal, computed,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { httpResource } from '@angular/common/http';

import { environment } from '../../../../../environments/environment';
import { ApiResponse, Application, PaginatedResponse } from '../../../../core/models';
import { AuthStore } from '../../../../state/auth.store';
import { EvaluationService } from '../../services/evaluation.service';
import { StarRatingComponent } from '../../../../shared/components/ui/star-rating/star-rating.component';

interface CriteriaItem {
  id: string;
  name: string;
  rating: number;
}

@Component({
  selector: 'app-evaluation-create',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule, ReactiveFormsModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatSlideToggleModule, MatSliderModule, MatCardModule, MatSnackBarModule,
    StarRatingComponent,
  ],
  templateUrl: './evaluation-create.component.html',
  styleUrl: './evaluation-create.component.scss',
})
export class EvaluationCreateComponent {
  readonly router = inject(Router);
  private readonly evaluationService = inject(EvaluationService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly authStore = inject(AuthStore);

  readonly selectedApplicationId = signal('');
  readonly overallRating = signal(0);
  readonly comment = signal('');
  readonly isAnonymous = signal(false);
  readonly submitting = signal(false);

  // Eligible applications (completed / in_progress)
  readonly eligibleResource = httpResource<PaginatedResponse<Application>>(
    () => ({
      url: `${environment.apiUrl}/applications/my`,
      params: { status: 'completed,in_progress', limit: 100 },
    }),
  );

  readonly eligibleApps = computed(() =>
    this.eligibleResource.value()?.data ?? [],
  );

  // Criteria based on user role
  readonly criteria = signal<CriteriaItem[]>([]);

  readonly canSubmit = computed(() =>
    this.selectedApplicationId() !== ''
    && this.overallRating() > 0
    && this.comment().length >= 50,
  );

  onSelectApplication(appId: string): void {
    this.selectedApplicationId.set(appId);

    // Set criteria based on role
    const isStudent = this.authStore.isStudent();
    const criteriaList = isStudent
      ? [
          { id: 'workplace', name: 'Ambiente laboral', rating: 3 },
          { id: 'mentoring', name: 'Mentoría', rating: 3 },
          { id: 'relevance', name: 'Relevancia', rating: 3 },
          { id: 'communication', name: 'Comunicación', rating: 3 },
        ]
      : [
          { id: 'punctuality', name: 'Puntualidad', rating: 3 },
          { id: 'technical', name: 'Calidad técnica', rating: 3 },
          { id: 'communication', name: 'Comunicación', rating: 3 },
          { id: 'teamwork', name: 'Trabajo en equipo', rating: 3 },
        ];
    this.criteria.set(criteriaList);
  }

  onCriterionChange(index: number, value: number): void {
    this.criteria.update(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], rating: value };
      return updated;
    });
  }

  submit(): void {
    if (!this.canSubmit()) return;
    this.submitting.set(true);

    const data = {
      applicationId: this.selectedApplicationId(),
      overallRating: this.overallRating(),
      comment: this.comment(),
      isAnonymous: this.isAnonymous(),
      criteria: this.criteria().map(c => ({
        criteriaId: c.id,
        criteriaName: c.name,
        rating: c.rating,
      })),
    };

    this.evaluationService.create(data).subscribe({
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
}
