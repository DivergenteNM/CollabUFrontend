import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-chat-empty',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="chat-empty">
      <mat-icon>chat_bubble_outline</mat-icon>
      <h2>Selecciona una conversación</h2>
      <p>Elige una conversación de la lista para empezar a chatear</p>
    </div>
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      background: var(--mat-sys-surface-container-lowest);
    }

    .chat-empty {
      text-align: center;
      color: var(--mat-sys-on-surface-variant);

      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        opacity: 0.4;
        margin-bottom: 16px;
      }

      h2 {
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0 0 8px;
      }

      p {
        font-size: 0.875rem;
        margin: 0;
      }
    }
  `,
})
export class ChatEmptyComponent {}
