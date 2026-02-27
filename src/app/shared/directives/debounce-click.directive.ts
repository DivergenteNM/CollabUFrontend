import { Directive, input, output, DestroyRef, inject } from '@angular/core';
import { Subject, debounceTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Directive({
  selector: '[appDebounceClick]',
  host: {
    '(click)': 'onClick($event)',
  },
})
export class DebounceClickDirective {
  readonly debounceMs = input<number>(500);
  readonly appDebounceClick = output<MouseEvent>();

  private readonly destroyRef = inject(DestroyRef);
  private readonly clicks$ = new Subject<MouseEvent>();

  constructor() {
    this.clicks$
      .pipe(debounceTime(this.debounceMs()), takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => this.appDebounceClick.emit(event));
  }

  onClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.clicks$.next(event);
  }
}
