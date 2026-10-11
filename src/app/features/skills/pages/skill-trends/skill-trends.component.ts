import { Component, ChangeDetectionStrategy, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { AnalyticsService } from '../../../analytics/services/analytics.service';
import { SkillGapChartComponent } from '../../../../shared/components/charts/skill-gap-chart/skill-gap-chart.component';

@Component({
  selector: 'app-skill-trends',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule, MatButtonModule,
    MatIconModule, MatProgressBarModule, MatTableModule, MatChipsModule,
    SkillGapChartComponent,
  ],
  templateUrl: './skill-trends.component.html',
  styleUrl: './skill-trends.component.scss',
})
export class SkillTrendsComponent {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly analyticsService = inject(AnalyticsService);

  readonly topSkills = rxResource({
    params: () => (isPlatformBrowser(this.platformId) ? {} : undefined),
    stream: () => this.analyticsService.getTopSkills(),
  });

  readonly displayedColumns = ['rank', 'skill', 'demand', 'supply', 'gap', 'trend'];

  readonly rankedSkills = computed(() =>
    (this.topSkills.value() ?? []).map((s, i) => ({ ...s, rank: i + 1 }))
  );

  trendIcon(direction: string | null): string {
    if (direction === 'rising') return 'trending_up';
    if (direction === 'declining') return 'trending_down';
    return 'trending_flat';
  }

  trendColor(direction: string | null): string {
    if (direction === 'rising') return 'positive';
    if (direction === 'declining') return 'negative';
    return 'neutral';
  }

  gapLabel(gap: number | string | null): string {
    if (gap === null || gap === undefined) return '—';
    const n = Number(gap);
    if (isNaN(n)) return '—';
    if (n > 0) return `+${n.toFixed(1)} (déficit)`;
    if (n < 0) return `${n.toFixed(1)} (superávit)`;
    return 'Equilibrado';
  }
}
