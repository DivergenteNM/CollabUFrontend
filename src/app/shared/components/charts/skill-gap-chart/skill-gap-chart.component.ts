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
  styles: [':host { display: block; position: relative; height: 320px; }'],
})
export class SkillGapChartComponent {
  readonly skills = input.required<SkillTrend[]>();

  readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly chartData = computed<ChartData<'bar'>>(() => ({
    labels: this.skills().map((s) => s.skillName),
    datasets: [
      {
        label: 'Demanda',
        data: this.skills().map((s) => s.demandCount),
        backgroundColor: 'rgba(59, 130, 246, 0.75)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Oferta',
        data: this.skills().map((s) => s.supplyCount),
        backgroundColor: 'rgba(34, 197, 94, 0.75)',
        borderColor: 'rgba(34, 197, 94, 1)',
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
      x: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.06)' } },
      y: { grid: { display: false } },
    },
  };
}
