import { Component, ChangeDetectionStrategy, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { environment } from '../../../../../environments/environment';
import { SkillTrend } from '../../../../core/models';
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

  readonly topSkills = httpResource<SkillTrend[]>(() => {
    if (!isPlatformBrowser(this.platformId)) return undefined;
    return { url: `${environment.apiUrl}/analytics/skills/top` };
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
