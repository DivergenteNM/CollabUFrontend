import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-chat-empty',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  templateUrl: './chat-empty.component.html',
  styleUrl: './chat-empty.component.scss',
})
export class ChatEmptyComponent {}
