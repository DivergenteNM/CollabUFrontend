import { Component, input, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions, Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-bar-chart',
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
  styles: [':host { display: block; position: relative; height: 250px; }'],
})
export class BarChartComponent {
  readonly chartData = input.required<ChartData<'bar'>>();

  readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { boxWidth: 12, font: { size: 12 } } },
    },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.06)' } },
      x: { grid: { display: false } },
    },
  };
}
