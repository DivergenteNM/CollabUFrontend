import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-paginator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatPaginatorModule],
  host: { 'class': 'paginator' },
  template: `
    <mat-paginator
      [length]="totalItems()"
      [pageSize]="pageSize()"
      [pageSizeOptions]="pageSizeOptions()"
      (page)="onPage($event)"
      showFirstLastButtons />
  `,
  styles: `
    :host { display: block; }
  `,
})
export class PaginatorComponent {
  readonly totalItems = input.required<number>();
  readonly pageSize = input<number>(10);
  readonly pageSizeOptions = input<number[]>([5, 10, 25, 50]);
  readonly pageChanged = output<{ page: number; limit: number }>();

  onPage(event: PageEvent): void {
    this.pageChanged.emit({ page: event.pageIndex + 1, limit: event.pageSize });
  }
}
