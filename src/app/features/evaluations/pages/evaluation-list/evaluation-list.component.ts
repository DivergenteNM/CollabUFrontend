import {
  Component, ChangeDetectionStrategy, inject, signal, computed,
} from '@angular/core';
import { Router } from '@angular/router';
import { httpResource } from '@angular/common/http';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { DatePipe, SlicePipe } from '@angular/common';

import { environment } from '../../../../../environments/environment';
import { PaginatedResponse, Evaluation } from '../../../../core/models';
import { StarRatingComponent } from '../../../../shared/components/ui/star-rating/star-rating.component';
import { PaginatorComponent } from '../../../../shared/components/ui/paginator/paginator.component';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../../shared/components/ui/skeleton/skeleton.component';

@Component({
  selector: 'app-evaluation-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatTabsModule, MatButtonModule, MatIconModule, MatCardModule, DatePipe, SlicePipe,
    StarRatingComponent, PaginatorComponent, EmptyStateComponent, SkeletonComponent,
  ],
  template: `
    <div class="evals">
      <header class="evals__header">
        <h1>Mis Evaluaciones</h1>
        <button mat-flat-button (click)="router.navigate(['/my-evaluations/create'])">
          <mat-icon>rate_review</mat-icon> Crear Evaluación
        </button>
      </header>

      <mat-tab-group (selectedIndexChange)="onTabChange($event)" animationDuration="200ms">
        <!-- Recibidas -->
        <mat-tab label="Recibidas">
          <div class="evals__list">
            @if (receivedResource.isLoading()) {
              @for (_ of [1,2,3]; track $index) {
                <app-skeleton width="100%" height="120px" />
              }
            } @else if (receivedEvals().length === 0) {
              <app-empty-state
                icon="star_border"
                title="Sin evaluaciones recibidas"
                message="Aún no has recibido ninguna evaluación." />
            } @else {
              @for (ev of receivedEvals(); track ev.id) {
                <mat-card class="evals__card" (click)="router.navigate(['/my-evaluations', ev.id])">
                  <mat-card-content>
                    <div class="evals__card-row">
                      <div class="evals__card-info">
                        <div class="evals__card-top">
                          <app-star-rating [value]="ev.overallRating" [readonly]="true" size="sm" />
                          <span class="evals__date">{{ ev.createdAt | date:'d MMM yyyy' }}</span>
                        </div>
                        <h3 class="evals__project">{{ ev.projectTitle }}</h3>
                        <span class="evals__evaluator">
                          {{ ev.isAnonymous ? 'Evaluador anónimo' : ('Evaluador: ' + ev.evaluatorType) }}
                        </span>
                        <p class="evals__excerpt">{{ ev.comment | slice:0:120 }}{{ ev.comment.length > 120 ? '...' : '' }}</p>
                      </div>
                      <mat-icon class="evals__arrow">chevron_right</mat-icon>
                    </div>
                  </mat-card-content>
                </mat-card>
              }

              @if (receivedTotal() > 0) {
                <app-paginator
                  [totalItems]="receivedTotal()"
                  [pageSize]="10"
                  (pageChanged)="receivedPage.set($event.page)" />
              }
            }
          </div>
        </mat-tab>

        <!-- Dadas -->
        <mat-tab label="Dadas">
          <div class="evals__list">
            @if (givenResource.isLoading()) {
              @for (_ of [1,2,3]; track $index) {
                <app-skeleton width="100%" height="120px" />
              }
            } @else if (givenEvals().length === 0) {
              <app-empty-state
                icon="rate_review"
                title="Sin evaluaciones dadas"
                message="Aún no has evaluado a nadie."
                actionLabel="Crear Evaluación"
                (actionClicked)="router.navigate(['/my-evaluations/create'])" />
            } @else {
              @for (ev of givenEvals(); track ev.id) {
                <mat-card class="evals__card" (click)="router.navigate(['/my-evaluations', ev.id])">
                  <mat-card-content>
                    <div class="evals__card-row">
                      <div class="evals__card-info">
                        <div class="evals__card-top">
                          <app-star-rating [value]="ev.overallRating" [readonly]="true" size="sm" />
                          <span class="evals__date">{{ ev.createdAt | date:'d MMM yyyy' }}</span>
                        </div>
                        <h3 class="evals__project">{{ ev.projectTitle }}</h3>
                        <p class="evals__excerpt">{{ ev.comment | slice:0:120 }}{{ ev.comment.length > 120 ? '...' : '' }}</p>
                      </div>
                      <mat-icon class="evals__arrow">chevron_right</mat-icon>
                    </div>
                  </mat-card-content>
                </mat-card>
              }

              @if (givenTotal() > 0) {
                <app-paginator
                  [totalItems]="givenTotal()"
                  [pageSize]="10"
                  (pageChanged)="givenPage.set($event.page)" />
              }
            }
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: `
    :host { display: block; padding: 24px; max-width: 1000px; margin: 0 auto; }

    .evals__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      h1 { font-size: 1.75rem; font-weight: 700; margin: 0; color: var(--mat-sys-on-surface); }
    }

    .evals__list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding-top: 16px;
    }

    .evals__card {
      cursor: pointer;
      transition: box-shadow 200ms;
      &:hover { box-shadow: var(--mat-sys-level2); }
    }

    .evals__card-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .evals__card-info { flex: 1; min-width: 0; }

    .evals__card-top {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 4px;
    }

    .evals__date {
      font-size: 0.75rem;
      color: var(--mat-sys-on-surface-variant);
    }

    .evals__project {
      font-size: 1rem;
      font-weight: 600;
      margin: 0 0 4px;
      color: var(--mat-sys-on-surface);
    }

    .evals__evaluator {
      font-size: 0.8125rem;
      color: var(--mat-sys-on-surface-variant);
    }

    .evals__excerpt {
      font-size: 0.8125rem;
      color: var(--mat-sys-on-surface-variant);
      margin: 6px 0 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .evals__arrow {
      flex-shrink: 0;
      color: var(--mat-sys-on-surface-variant);
    }

    @media (max-width: 600px) {
      :host { padding: 16px; }
      .evals__header { flex-direction: column; align-items: flex-start; gap: 12px; }
    }
  `,
})
export class EvaluationListComponent {
  readonly router = inject(Router);

  readonly activeTab = signal(0);
  readonly receivedPage = signal(1);
  readonly givenPage = signal(1);

  readonly receivedResource = httpResource<PaginatedResponse<Evaluation>>(
    () => ({
      url: `${environment.apiUrl}/evaluations/my-evaluations`,
      params: { type: 'received', page: this.receivedPage(), limit: 10 },
    }),
  );

  readonly givenResource = httpResource<PaginatedResponse<Evaluation>>(
    () => ({
      url: `${environment.apiUrl}/evaluations/my-evaluations`,
      params: { type: 'given', page: this.givenPage(), limit: 10 },
    }),
  );

  readonly receivedEvals = computed(() => this.receivedResource.value()?.data ?? []);
  readonly receivedTotal = computed(() => this.receivedResource.value()?.meta?.total ?? 0);
  readonly givenEvals = computed(() => this.givenResource.value()?.data ?? []);
  readonly givenTotal = computed(() => this.givenResource.value()?.meta?.total ?? 0);

  onTabChange(index: number): void {
    this.activeTab.set(index);
  }
}
