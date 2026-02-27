import {
  Component, ChangeDetectionStrategy, input, output, signal, effect, DestroyRef, inject,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export interface FilterConfig {
  key: string;
  label: string;
  type: 'text' | 'select' | 'chips' | 'date-range';
  options?: { value: string; label: string }[];
  placeholder?: string;
}

@Component({
  selector: 'app-search-filter-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatDatepickerModule,
  ],
  host: { 'class': 'search-filter-bar' },
  template: `
    <div class="filter-bar">
      @for (filter of filters(); track filter.key) {
        @switch (filter.type) {
          @case ('text') {
            <mat-form-field appearance="outline" class="filter-bar__field">
              <mat-label>{{ filter.label }}</mat-label>
              <input matInput
                     [placeholder]="filter.placeholder || ''"
                     (input)="onFilterChange(filter.key, $any($event.target).value)" />
              <mat-icon matPrefix>search</mat-icon>
            </mat-form-field>
          }
          @case ('select') {
            <mat-form-field appearance="outline" class="filter-bar__field">
              <mat-label>{{ filter.label }}</mat-label>
              <mat-select (selectionChange)="onFilterChange(filter.key, $event.value)">
                <mat-option value="">Todos</mat-option>
                @for (opt of filter.options; track opt.value) {
                  <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          }
          @case ('chips') {
            <div class="filter-bar__chips">
              <span class="filter-bar__chips-label">{{ filter.label }}:</span>
              <mat-chip-listbox (change)="onFilterChange(filter.key, $event.value)">
                @for (opt of filter.options; track opt.value) {
                  <mat-chip-option [value]="opt.value">{{ opt.label }}</mat-chip-option>
                }
              </mat-chip-listbox>
            </div>
          }
          @case ('date-range') {
            <mat-form-field appearance="outline" class="filter-bar__field">
              <mat-label>{{ filter.label }}</mat-label>
              <mat-date-range-input [rangePicker]="picker">
                <input matStartDate placeholder="Inicio"
                       (dateChange)="onFilterChange(filter.key + '_start', $event.value)" />
                <input matEndDate placeholder="Fin"
                       (dateChange)="onFilterChange(filter.key + '_end', $event.value)" />
              </mat-date-range-input>
              <mat-datepicker-toggle matIconSuffix [for]="picker" />
              <mat-date-range-picker #picker />
            </mat-form-field>
          }
        }
      }

      @if (hasActiveFilters()) {
        <button mat-button class="filter-bar__clear" (click)="clearFilters()">
          <mat-icon>filter_list_off</mat-icon>
          Limpiar
        </button>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .filter-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px;
    }

    .filter-bar__field {
      min-width: 180px;
      max-width: 280px;
    }

    .filter-bar__chips {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .filter-bar__chips-label {
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--mat-sys-on-surface-variant);
      white-space: nowrap;
    }

    .filter-bar__clear {
      color: var(--mat-sys-error);
    }
  `,
})
export class SearchFilterBarComponent {
  readonly filters = input.required<FilterConfig[]>();
  readonly filtersChanged = output<Record<string, any>>();
  readonly debounceMs = input<number>(300);

  private readonly destroyRef = inject(DestroyRef);
  private filterValues = signal<Record<string, any>>({});
  protected readonly hasActiveFilters = signal(false);

  private debounceSubject = new FormControl<Record<string, any>>({});

  constructor() {
    this.debounceSubject.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((val) => {
        if (val) this.filtersChanged.emit(val);
      });
  }

  onFilterChange(key: string, value: any): void {
    this.filterValues.update((prev) => ({ ...prev, [key]: value }));
    this.hasActiveFilters.set(
      Object.values(this.filterValues()).some((v) => v !== '' && v != null)
    );
    this.debounceSubject.setValue(this.filterValues());
  }

  clearFilters(): void {
    this.filterValues.set({});
    this.hasActiveFilters.set(false);
    this.filtersChanged.emit({});
  }
}
