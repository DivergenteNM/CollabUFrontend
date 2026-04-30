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
  templateUrl: './evaluation-list.component.html',
  styleUrl: './evaluation-list.component.scss',
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
