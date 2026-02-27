import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-chat-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>Chat (próxima fase)</p>`,
})
export class ChatContainerComponent {}
