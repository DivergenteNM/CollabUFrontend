import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe } from '@angular/common';

export interface TimelineEvent {
  date: Date | string;
  title: string;
  description?: string;
  icon?: string;
}

@Component({
  selector: 'app-timeline',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, DatePipe],
  host: { 'class': 'timeline' },
  template: `
    <div class="timeline__container">
      @for (event of events(); track $index; let last = $last; let first = $first) {
        <div class="timeline__item" [class.timeline__item--first]="first" [class.timeline__item--last]="last">
          <div class="timeline__connector">
            <div class="timeline__dot" [class.timeline__dot--first]="first">
              <mat-icon>{{ event.icon || (first ? 'radio_button_checked' : 'circle') }}</mat-icon>
            </div>
            @if (!last) {
              <div class="timeline__line"></div>
            }
          </div>
          <div class="timeline__content">
            <span class="timeline__date">{{ event.date | date:'d MMM yyyy' }}</span>
            <p class="timeline__title">{{ event.title }}</p>
            @if (event.description) {
              <p class="timeline__description">{{ event.description }}</p>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .timeline__container {
      display: flex;
      flex-direction: column;
    }

    .timeline__item {
      display: flex;
      gap: 16px;
      position: relative;
    }

    .timeline__connector {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex-shrink: 0;
      width: 24px;
    }

    .timeline__dot {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1;

      mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
        color: var(--mat-sys-outline);
      }
    }

    .timeline__dot--first mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: var(--mat-sys-primary);
    }

    .timeline__line {
      flex: 1;
      width: 2px;
      background-color: var(--mat-sys-outline-variant);
      min-height: 24px;
    }

    .timeline__content {
      padding-bottom: 24px;
      flex: 1;
    }

    .timeline__item--last .timeline__content {
      padding-bottom: 0;
    }

    .timeline__date {
      font-size: 0.75rem;
      color: var(--mat-sys-on-surface-variant);
      font-weight: 500;
    }

    .timeline__title {
      font-size: 0.875rem;
      color: var(--mat-sys-on-surface);
      margin: 2px 0 0;
      font-weight: 500;
    }

    .timeline__description {
      font-size: 0.8125rem;
      color: var(--mat-sys-on-surface-variant);
      margin: 4px 0 0;
      line-height: 1.4;
    }
  `,
})
export class TimelineComponent {
  readonly events = input.required<TimelineEvent[]>();
}
