import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>Configuración (próxima fase)</p>`,
})
export class SettingsComponent {}
