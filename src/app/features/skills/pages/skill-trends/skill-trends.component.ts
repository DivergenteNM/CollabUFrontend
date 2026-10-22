import { Component, ChangeDetectionStrategy, computed, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { SkillTrend } from '../../../../core/models';
import { SkillSupplyDemandPanelComponent } from '../../../../shared/components/charts/skill-supply-demand-panel/skill-supply-demand-panel.component';

@Component({
  selector: 'app-skill-trends',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatIconModule, MatTableModule, SkillSupplyDemandPanelComponent],
  templateUrl: './skill-trends.component.html',
  styleUrl: './skill-trends.component.scss',
})
export class SkillTrendsComponent {
  readonly displayedColumns = ['rank', 'skill', 'category', 'demand', 'supply', 'gap', 'trend'];

  /** Lo que muestra el panel (ya filtrado y ordenado): la tabla usa exactamente los mismos datos. */
  readonly visibleSkills = signal<SkillTrend[]>([]);

  readonly rankedSkills = computed(() => this.visibleSkills().map((s, i) => ({ ...s, rank: i + 1 })));

  readonly categoryLabels: Record<string, string> = {
    language: 'Lenguaje',
    framework: 'Framework',
    tool: 'Herramienta',
    concept: 'Concepto',
    soft_skill: 'Habilidad blanda',
  };

  categoryLabel(category: string | null | undefined): string {
    return category ? (this.categoryLabels[category] ?? category) : '—';
  }

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
