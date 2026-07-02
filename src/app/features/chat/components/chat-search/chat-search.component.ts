import { Component, ChangeDetectionStrategy, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-chat-search',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatIconModule],
  host: { 'class': 'chat-search' },
  templateUrl: './chat-search.component.html',
  styleUrl: './chat-search.component.scss',
})
export class ChatSearchComponent {
  readonly searchChange = output<string>();
  readonly query = signal('');

  onSearch(value: string): void {
    this.query.set(value);
    this.searchChange.emit(value);
  }
}
