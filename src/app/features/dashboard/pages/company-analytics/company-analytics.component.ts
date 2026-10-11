import {
  Component, ChangeDetectionStrategy, inject, PLATFORM_ID, computed,
} from '@angular/core';
import { isPlatformBrowser, DecimalPipe } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AnalyticsService } from '../../../analytics/services/analytics.service';
import { AuthStore } from '../../../../state/auth.store';
import { StatCardComponent } from '../../../../shared/components/ui/stat-card/stat-card.component';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state.component';

@Component({
  selector: 'app-company-analytics',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatProgressBarModule, DecimalPipe, StatCardComponent, EmptyStateComponent],
  templateUrl: './company-analytics.component.html',
  styleUrl: './company-analytics.component.scss',
})
export class CompanyAnalyticsComponent {
  private readonly authStore = inject(AuthStore);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly analyticsService = inject(AnalyticsService);

  readonly metrics = rxResource({
    params: () => {
      if (!isPlatformBrowser(this.platformId)) return undefined;
      const userId = this.authStore.user()?.id;
      return userId ? { userId } : undefined;
    },
    stream: ({ params }) => this.analyticsService.getCompanySummary(params.userId),
  });

  readonly isNotFound = computed(() => {
    const err = this.metrics.error() as { status?: number } | undefined;
    return err?.status === 404;
  });

  readonly completionRateDisplay = computed(() => {
    const rate = this.metrics.value()?.completionRate;
    return rate != null ? Math.round(rate) : 0;
  });

  readonly avgResponseLabel = computed(() => {
    const h = this.metrics.value()?.avgTimeToRespondHours;
    if (h == null) return '—';
    if (h < 24) return `${Math.round(h)}h`;
    return `${Math.round(h / 24)}d`;
  });
}
