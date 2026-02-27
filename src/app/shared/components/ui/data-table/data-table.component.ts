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
  template: `
    @if (loading()) {
      <mat-progress-bar mode="indeterminate" />
    }

    <div class="data-table__wrapper">
      <table mat-table [dataSource]="data()" matSort (matSortChange)="onSort($event)">
        @for (col of columns(); track col.key) {
          <ng-container [matColumnDef]="col.key.toString()">
            <th mat-header-cell *matHeaderCellDef
                [mat-sort-header]="col.sortable ? col.key.toString() : ''"
                [disabled]="!col.sortable"
                [style.width]="col.width || 'auto'">
              {{ col.header }}
            </th>
            <td mat-cell *matCellDef="let row">
              @if (col.template) {
                <ng-container
                  [ngTemplateOutlet]="col.template"
                  [ngTemplateOutletContext]="{ $implicit: row, column: col }">
                </ng-container>
              } @else {
                @switch (col.type) {
                  @case ('date') {
                    {{ row[col.key] | date:'d MMM yyyy' }}
                  }
                  @default {
                    {{ row[col.key] }}
                  }
                }
              }
            </td>
          </ng-container>
        }

        <tr mat-header-row *matHeaderRowDef="displayedColumns()"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns()"
            class="data-table__row"
            class="data-table__row"
            (click)="rowClicked.emit(row)">
        </tr>
      </table>
    </div>

    @if (data().length === 0 && !loading()) {
      <div class="data-table__empty">
        <mat-icon>search_off</mat-icon>
        <p>No se encontraron resultados</p>
      </div>
    }

    @if (totalItems() > 0) {
      <mat-paginator
        [length]="totalItems()"
        [pageSize]="pageSize()"
        [pageSizeOptions]="[5, 10, 25, 50]"
        (page)="onPage($event)"
        showFirstLastButtons />
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .data-table__wrapper {
      overflow-x: auto;
    }

    table {
      width: 100%;
    }

    .data-table__row.clickable {
      cursor: pointer;

      &:hover {
        background-color: color-mix(in srgb, var(--mat-sys-primary) 5%, transparent);
      }
    }

    .data-table__empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px 24px;
      color: var(--mat-sys-on-surface-variant);

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        margin-bottom: 8px;
      }

      p {
        font-size: 0.875rem;
      }
    }
  `,
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
