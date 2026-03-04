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
  template: `
    <mat-form-field appearance="outline" class="chat-search__field">
      <mat-label>Buscar conversación</mat-label>
      <mat-icon matPrefix>search</mat-icon>
      <input
        matInput
        placeholder="Buscar conversación..."
        [ngModel]="query()"
        (ngModelChange)="onSearch($event)" />
      @if (query()) {
        <button matSuffix mat-icon-button aria-label="Limpiar búsqueda" (click)="onSearch('')">
          <mat-icon>close</mat-icon>
        </button>
      }
    </mat-form-field>
  `,
  styles: `
    :host { display: block; padding: 12px 16px; }

    .chat-search__field {
      width: 100%;
      --mat-form-field-container-height: 40px;
    }
  `,
})
export class ChatSearchComponent {
  readonly searchChange = output<string>();
  readonly query = signal('');

  onSearch(value: string): void {
    this.query.set(value);
    this.searchChange.emit(value);
  }
}
