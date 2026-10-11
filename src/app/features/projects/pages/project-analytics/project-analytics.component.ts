import {
  Component, ChangeDetectionStrategy, inject, PLATFORM_ID, computed, input,
} from '@angular/core';
import { isPlatformBrowser, DecimalPipe } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AnalyticsService } from '../../../analytics/services/analytics.service';
import { StatCardComponent } from '../../../../shared/components/ui/stat-card/stat-card.component';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state.component';

@Component({
  selector: 'app-project-analytics',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatIconModule, MatProgressBarModule, DecimalPipe, StatCardComponent, EmptyStateComponent],
  templateUrl: './project-analytics.component.html',
  styleUrl: './project-analytics.component.scss',
})
export class ProjectAnalyticsComponent {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly analyticsService = inject(AnalyticsService);

  readonly id = input.required<string>();

  readonly metrics = rxResource({
    params: () => (isPlatformBrowser(this.platformId) ? { projectId: this.id() } : undefined),
    stream: ({ params }) => this.analyticsService.getProjectSummary(params.projectId),
  });

  readonly isNotFound = computed(() => {
    const err = this.metrics.error() as { status?: number } | undefined;
    return err?.status === 404;
  });

  readonly completionRateDisplay = computed(() => {
    const rate = this.metrics.value()?.completionRate;
    return rate != null ? Math.round(rate) : 0;
  });

  readonly conversionRateDisplay = computed(() => {
    const rate = this.metrics.value()?.conversionRate;
    return rate != null ? Math.round(rate) : 0;
  });
}
