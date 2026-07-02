import {
  Component, ChangeDetectionStrategy, inject, signal, computed,
} from '@angular/core';
import { Router } from '@angular/router';
import { httpResource } from '@angular/common/http';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { DatePipe, DecimalPipe, SlicePipe } from '@angular/common';

import { environment } from '../../../../../environments/environment';
import {
  PaginatedResponse,
  Evaluation,
  EvaluationType,
  EvaluationStatus,
  AggregateScores,
  ApiResponse,
  getEvaluationStatusLabel,
  getEvaluationTypeLabel,
} from '../../../../core/models';
import { AuthStore } from '../../../../state/auth.store';
import { EvaluationService } from '../../services/evaluation.service';
import { StatusBadgeComponent } from '../../../../shared/components/ui/status-badge/status-badge.component';
import { StarRatingComponent } from '../../../../shared/components/ui/star-rating/star-rating.component';
import { PaginatorComponent } from '../../../../shared/components/ui/paginator/paginator.component';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../../shared/components/ui/skeleton/skeleton.component';

@Component({
  selector: 'app-evaluation-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatTabsModule, MatButtonModule, MatIconModule, MatCardModule,
    MatFormFieldModule, MatSelectModule,
    DatePipe, DecimalPipe, SlicePipe,
    StatusBadgeComponent, StarRatingComponent, PaginatorComponent,
    EmptyStateComponent, SkeletonComponent,
  ],
  templateUrl: './evaluation-list.component.html',
  styleUrl: './evaluation-list.component.scss',
})
export class EvaluationListComponent {
  readonly router = inject(Router);
  private readonly evaluationService = inject(EvaluationService);
  private readonly authStore = inject(AuthStore);

  readonly EvaluationType = EvaluationType;
  readonly EvaluationStatus = EvaluationStatus;
  readonly statusLabels = getEvaluationStatusLabel;
  readonly typeLabels = getEvaluationTypeLabel;

  readonly activeTab = signal(0);
  readonly receivedPage = signal(1);
  readonly givenPage = signal(1);
  readonly filterType = signal<EvaluationType | ''>('');
  readonly filterStatus = signal<EvaluationStatus | ''>('');

  private makeQuery(): Record<string, string | number> {
    const params: Record<string, string | number> = {};
    const ft = this.filterType();
    const fs = this.filterStatus();
    if (ft) params['evaluationType'] = ft;
    if (fs) params['status'] = fs;
    return params;
  }

  readonly receivedResource = httpResource<PaginatedResponse<Evaluation>>(
    () => ({
      url: `${environment.apiUrl}/evaluations/my/as-evaluated`,
      params: { page: this.receivedPage(), limit: 10, ...this.makeQuery() },
    }),
  );

  readonly givenResource = httpResource<PaginatedResponse<Evaluation>>(
    () => ({
      url: `${environment.apiUrl}/evaluations/my/as-evaluator`,
      params: { page: this.givenPage(), limit: 10, ...this.makeQuery() },
    }),
  );

  readonly aggregateResource = httpResource<ApiResponse<AggregateScores>>(
    () => this.authStore.user()?.id
      ? { url: `${environment.apiUrl}/evaluations/aggregate/${this.authStore.user()!.id}` }
      : null as any,
  );

  readonly aggregate = computed(() => this.aggregateResource.value()?.data ?? null);

  readonly receivedEvals = computed(() => this.receivedResource.value()?.data ?? []);
  readonly receivedTotal = computed(() => this.receivedResource.value()?.meta?.total ?? 0);
  readonly givenEvals = computed(() => this.givenResource.value()?.data ?? []);
  readonly givenTotal = computed(() => this.givenResource.value()?.meta?.total ?? 0);

  onTabChange(index: number): void {
    this.activeTab.set(index);
  }

  onFilterChange(): void {
    this.receivedPage.set(1);
    this.givenPage.set(1);
  }
}