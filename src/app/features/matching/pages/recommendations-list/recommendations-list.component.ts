import {
  Component, ChangeDetectionStrategy, inject, signal, computed,
} from '@angular/core';
import { Router } from '@angular/router';
import { httpResource } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { environment } from '../../../../../environments/environment';
import { PaginatedResponse, Recommendation } from '../../../../core/models';
import { MatchScoreBarComponent } from '../../../../shared/components/ui/match-score-bar/match-score-bar.component';
import { PaginatorComponent } from '../../../../shared/components/ui/paginator/paginator.component';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../../shared/components/ui/skeleton/skeleton.component';
import {
  ApplyDialogComponent,
  ApplyDialogData,
} from '../../../projects/components/apply-dialog/apply-dialog.component';

@Component({
  selector: 'app-recommendations-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule, MatIconModule, MatCardModule, MatChipsModule, MatDialogModule,
    MatchScoreBarComponent, PaginatorComponent, EmptyStateComponent, SkeletonComponent,
  ],
  templateUrl: './recommendations-list.component.html',
  styleUrl: './recommendations-list.component.scss',
})
export class RecommendationsListComponent {
  readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  readonly page = signal(1);

  readonly recommendationsResource = httpResource<PaginatedResponse<Recommendation>>(
    () => ({
      url: `${environment.apiUrl}/matching/recommendations`,
      params: { page: this.page(), limit: 10 },
    }),
  );

  readonly recommendations = computed(() =>
    this.recommendationsResource.value()?.data ?? [],
  );

  readonly totalItems = computed(() =>
    this.recommendationsResource.value()?.meta?.total ?? 0,
  );

  onPageChanged(event: { page: number; limit: number }): void {
    this.page.set(event.page);
  }

  openApplyDialog(projectId: string, projectTitle: string): void {
    this.dialog.open(ApplyDialogComponent, {
      width: '560px',
      data: { projectId, projectTitle } satisfies ApplyDialogData,
    });
  }
}
