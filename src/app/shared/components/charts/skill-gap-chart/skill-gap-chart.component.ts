import { Component, input, computed, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions, Chart, registerables } from 'chart.js';
import { SkillTrend } from '../../../../core/models';

Chart.register(...registerables);

@Component({
  selector: 'app-skill-gap-chart',
  standalone: true,
  imports: [BaseChartDirective],
  template: `
    @if (isBrowser) {
      <canvas baseChart
        [data]="chartData()"
        [options]="options"
        type="bar"
      ></canvas>
    }
  `,
  styles: [':host { display: block; position: relative; }'],
  host: { '[style.height.px]': 'height() ?? 320' },
})
export class SkillGapChartComponent {
  readonly skills = input.required<SkillTrend[]>();
  /** 'grouped' = barras de demanda y oferta; 'gap' = una barra por skill con la brecha (déficit / superávit). */
  readonly mode = input<'grouped' | 'gap'>('grouped');
  /** Alto del gráfico en px (crece con la cantidad de skills). */
  readonly height = input<number | null>(null);

  readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly chartData = computed<ChartData<'bar'>>(() => {
    if (this.mode() === 'gap') {
      const gaps = this.skills().map((s) => Number(s.gapIndex ?? s.demandCount - s.supplyCount));
      return {
        labels: this.skills().map((s) => s.skillName),
        datasets: [
          {
            label: 'Brecha (demanda − oferta)',
            data: gaps,
            backgroundColor: gaps.map((g) => (g >= 0 ? 'rgba(198, 40, 40, 0.75)' : 'rgba(56, 142, 83, 0.78)')),
            borderWidth: 0,
            borderRadius: 4,
          },
        ],
      };
    }
    return this.groupedData();
  });

  private readonly groupedData = computed<ChartData<'bar'>>(() => ({
    labels: this.skills().map((s) => s.skillName),
    datasets: [
      {
        label: 'Demanda',
        data: this.skills().map((s) => s.demandCount),
        backgroundColor: 'rgba(50, 130, 178, 0.78)',
        borderColor: '#3282B2',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Oferta',
        data: this.skills().map((s) => s.supplyCount),
        backgroundColor: 'rgba(56, 142, 83, 0.78)',
        borderColor: '#388E53',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  }));

  readonly options: ChartOptions<'bar'> = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { boxWidth: 12, font: { size: 12 } } },
    },
    scales: {
      x: { beginAtZero: true, grid: { color: 'rgba(74, 88, 76, 0.12)' } },
      y: { grid: { display: false } },
    },
  };
}
