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
  template: `
    <div class="eval-create">
      <header class="eval-create__header">
        <button mat-icon-button aria-label="Volver" (click)="router.navigate(['/my-evaluations'])">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>Crear Evaluación</h1>
      </header>

      <mat-card>
        <mat-card-content>
          <!-- Step 1: Select application -->
          <div class="eval-create__section">
            <h3>Selecciona el proyecto a evaluar</h3>
            <mat-form-field appearance="outline" class="eval-create__full-width">
              <mat-label>Proyecto / Aplicación</mat-label>
              <mat-select [value]="selectedApplicationId()" (selectionChange)="onSelectApplication($event.value)">
                @for (app of eligibleApps(); track app.id) {
                  <mat-option [value]="app.id">{{ app.project?.title ?? 'Proyecto' }} — {{ app.status }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>

          @if (selectedApplicationId()) {
            <!-- Step 2: Overall rating -->
            <div class="eval-create__section">
              <h3>Calificación general</h3>
              <div class="eval-create__rating">
                <app-star-rating [(value)]="overallRating" size="lg" />
                <span class="eval-create__rating-text">{{ overallRating() }} / 5</span>
              </div>
            </div>

            <!-- Step 3: Criteria -->
            <div class="eval-create__section">
              <h3>Criterios específicos</h3>
              <div class="eval-create__criteria">
                @for (criterion of criteria(); track criterion.id; let i = $index) {
                  <div class="eval-create__criterion">
                    <label>{{ criterion.name }}</label>
                    <div class="eval-create__slider-row">
                      <mat-slider min="1" max="5" step="1" discrete>
                        <input matSliderThumb [value]="criterion.rating" (valueChange)="onCriterionChange(i, $event)" />
                      </mat-slider>
                      <span class="eval-create__slider-val">{{ criterion.rating }}</span>
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Step 4: Comment -->
            <div class="eval-create__section">
              <h3>Comentario</h3>
              <mat-form-field appearance="outline" class="eval-create__full-width">
                <mat-label>Escribe tu evaluación (mínimo 50 caracteres)</mat-label>
                <textarea
                  matInput
                  rows="4"
                  [ngModel]="comment()"
                  (ngModelChange)="comment.set($event)">
                </textarea>
                <mat-hint>{{ comment().length }} / 50 mínimo</mat-hint>
              </mat-form-field>
            </div>

            <!-- Step 5: Anonymous toggle -->
            <div class="eval-create__section">
              <mat-slide-toggle [checked]="isAnonymous()" (change)="isAnonymous.set($event.checked)">
                Evaluación anónima
              </mat-slide-toggle>
              <p class="eval-create__anon-hint">Si activas esta opción, tu nombre no será visible para el evaluado.</p>
            </div>

            <!-- Submit -->
            <div class="eval-create__actions">
              <button mat-flat-button
                [disabled]="!canSubmit() || submitting()"
                (click)="submit()">
                <mat-icon>send</mat-icon> Enviar Evaluación
              </button>
            </div>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: `
    :host { display: block; padding: 24px; max-width: 800px; margin: 0 auto; }

    .eval-create__header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 24px;
      h1 { font-size: 1.5rem; font-weight: 700; margin: 0; }
    }

    .eval-create__section {
      margin-bottom: 28px;
      h3 {
        font-size: 1rem;
        font-weight: 600;
        margin: 0 0 12px;
        color: var(--mat-sys-on-surface);
      }
    }

    .eval-create__full-width { width: 100%; }

    .eval-create__rating {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .eval-create__rating-text {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--mat-sys-on-surface);
    }

    .eval-create__criteria {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .eval-create__criterion {
      label {
        display: block;
        font-size: 0.875rem;
        font-weight: 500;
        margin-bottom: 4px;
        color: var(--mat-sys-on-surface);
      }
    }

    .eval-create__slider-row {
      display: flex;
      align-items: center;
      gap: 12px;
      mat-slider { flex: 1; }
    }

    .eval-create__slider-val {
      font-weight: 600;
      font-size: 1rem;
      min-width: 20px;
      text-align: center;
    }

    .eval-create__anon-hint {
      font-size: 0.8125rem;
      color: var(--mat-sys-on-surface-variant);
      margin: 6px 0 0;
    }

    .eval-create__actions {
      display: flex;
      justify-content: flex-end;
      padding-top: 16px;
      border-top: 1px solid var(--mat-sys-outline-variant);
    }
  `,
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
      url: `${environment.apiUrl}/applications/my-applications`,
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
