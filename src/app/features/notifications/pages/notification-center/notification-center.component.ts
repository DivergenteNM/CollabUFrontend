import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-notification-center',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>Centro de Notificaciones (próxima fase)</p>`,
})
export class NotificationCenterComponent {}
