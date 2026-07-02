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
  templateUrl: './search-filter-bar.component.html',
  styleUrl: './search-filter-bar.component.scss',
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
