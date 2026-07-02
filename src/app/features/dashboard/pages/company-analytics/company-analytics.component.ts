import {
  Component, ChangeDetectionStrategy, inject, PLATFORM_ID, computed,
} from '@angular/core';
import { isPlatformBrowser, DecimalPipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { environment } from '../../../../../environments/environment';
import { CompanyMetrics } from '../../../../core/models';
import { AuthStore } from '../../../../state/auth.store';
import { StatCardComponent } from '../../../../shared/components/ui/stat-card/stat-card.component';

@Component({
  selector: 'app-company-analytics',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatProgressBarModule, DecimalPipe, StatCardComponent],
  templateUrl: './company-analytics.component.html',
  styleUrl: './company-analytics.component.scss',
})
export class CompanyAnalyticsComponent {
  private readonly authStore = inject(AuthStore);
  private readonly platformId = inject(PLATFORM_ID);

  readonly metrics = httpResource<CompanyMetrics>(() => {
    if (!isPlatformBrowser(this.platformId)) return undefined;
    const userId = this.authStore.user()?.id;
    if (!userId) return undefined;
    return { url: `${environment.apiUrl}/analytics/companies/${userId}/summary` };
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
