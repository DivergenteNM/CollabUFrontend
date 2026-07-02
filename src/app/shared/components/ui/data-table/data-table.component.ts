import {
  Component, ChangeDetectionStrategy, input, output, computed, TemplateRef, contentChildren, ViewChild,
} from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { PaginationParams } from '../../../../core/models';

export interface ColumnDef<T> {
  key: keyof T | string;
  header: string;
  type?: 'text' | 'date' | 'badge' | 'avatar' | 'actions';
  sortable?: boolean;
  width?: string;
  template?: TemplateRef<any>;
}

@Component({
  selector: 'app-data-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatTableModule, MatSortModule, MatPaginatorModule, MatProgressBarModule, MatIconModule, DatePipe, NgTemplateOutlet],
  host: { 'class': 'data-table' },
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss',
})
export class DataTableComponent<T = any> {
  readonly data = input.required<T[]>();
  readonly columns = input.required<ColumnDef<T>[]>();
  readonly totalItems = input<number>(0);
  readonly pageSize = input<number>(10);
  readonly loading = input<boolean>(false);
  readonly rowClicked = output<T>();
  readonly pageChanged = output<PaginationParams>();
  readonly sortChanged = output<{ column: string; direction: 'asc' | 'desc' }>();

  readonly displayedColumns = computed(() => this.columns().map((c) => c.key.toString()));

  onSort(sort: Sort): void {
    if (sort.direction) {
      this.sortChanged.emit({ column: sort.active, direction: sort.direction as 'asc' | 'desc' });
    }
  }

  onPage(event: PageEvent): void {
    this.pageChanged.emit({ page: event.pageIndex + 1, limit: event.pageSize });
  }
}
