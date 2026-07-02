import {
  Component, ChangeDetectionStrategy, inject, PLATFORM_ID, computed,
} from '@angular/core';
import { isPlatformBrowser, DecimalPipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { environment } from '../../../../../environments/environment';
import { StudentMetrics } from '../../../../core/models';
import { AuthStore } from '../../../../state/auth.store';
import { StatCardComponent } from '../../../../shared/components/ui/stat-card/stat-card.component';

@Component({
  selector: 'app-my-analytics',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatProgressBarModule, DecimalPipe, StatCardComponent],
  templateUrl: './my-analytics.component.html',
  styleUrl: './my-analytics.component.scss',
})
export class MyAnalyticsComponent {
  private readonly authStore = inject(AuthStore);
  private readonly platformId = inject(PLATFORM_ID);

  readonly metrics = httpResource<StudentMetrics>(() => {
    if (!isPlatformBrowser(this.platformId)) return undefined;
    const userId = this.authStore.user()?.id;
    if (!userId) return undefined;
    return { url: `${environment.apiUrl}/analytics/students/${userId}/summary` };
  });

  readonly acceptanceRate = computed(() => {
    const m = this.metrics.value();
    if (!m || m.totalApplications === 0) return 0;
    return Math.round((m.acceptedCount / m.totalApplications) * 100);
  });

  readonly completenessPercent = computed(() =>
    Math.round(this.metrics.value()?.profileCompleteness ?? 0)
  );
}
