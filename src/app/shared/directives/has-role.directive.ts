import { Directive, inject, input, effect, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthStore } from '../../state/auth.store';
import { UserRole } from '../../core/enums';

@Directive({ selector: '[appHasRole]' })
export class HasRoleDirective {
  private readonly authStore = inject(AuthStore);
  private readonly templateRef = inject(TemplateRef<any>);
  private readonly viewContainer = inject(ViewContainerRef);

  readonly appHasRole = input.required<UserRole | UserRole[]>();

  private hasView = false;

  constructor() {
    effect(() => {
      const allowedRoles = this.appHasRole();
      const userRole = this.authStore.role() as UserRole | null;
      const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
      const shouldShow = !!userRole && roles.includes(userRole);

      if (shouldShow && !this.hasView) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.hasView = true;
      } else if (!shouldShow && this.hasView) {
        this.viewContainer.clear();
        this.hasView = false;
      }
    });
  }
}
