import { Directive, inject, ElementRef, afterNextRender, input } from '@angular/core';

@Directive({ selector: '[appAutoFocus]' })
export class AutoFocusDirective {
  private readonly el = inject(ElementRef);
  readonly appAutoFocus = input<boolean>(true);

  constructor() {
    afterNextRender(() => {
      if (this.appAutoFocus()) {
        this.el.nativeElement.focus();
      }
    });
  }
}
