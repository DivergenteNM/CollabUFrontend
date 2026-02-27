import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ApplicationStatus } from '../../../../core/enums';

interface StepperStep {
  label: string;
  icon: string;
  status: ApplicationStatus;
}

const STEPS: StepperStep[] = [
  { label: 'Pendiente',    icon: 'schedule',      status: ApplicationStatus.PENDING },
  { label: 'Revisión',     icon: 'visibility',    status: ApplicationStatus.UNDER_REVIEW },
  { label: 'Entrevista',   icon: 'event',         status: ApplicationStatus.INTERVIEW },
  { label: 'Aceptada',     icon: 'check_circle',  status: ApplicationStatus.ACCEPTED },
  { label: 'En progreso',  icon: 'play_circle',   status: ApplicationStatus.IN_PROGRESS },
  { label: 'Completada',   icon: 'task_alt',       status: ApplicationStatus.COMPLETED },
];

@Component({
  selector: 'app-application-progress-stepper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  host: { 'class': 'progress-stepper', 'role': 'progressbar' },
  template: `
    <div class="stepper">
      @for (step of steps; track step.status; let i = $index; let last = $last) {
        <div class="stepper__step"
             [class.completed]="i < currentIndex()"
             [class.active]="i === currentIndex()"
             [class.inactive]="i > currentIndex()">
          <div class="stepper__circle">
            <mat-icon>
              @if (i < currentIndex()) { check }
              @else { {{ step.icon }} }
            </mat-icon>
          </div>
          <span class="stepper__label">{{ step.label }}</span>
        </div>
        @if (!last) {
          <div class="stepper__line"
               [class.filled]="i < currentIndex()">
          </div>
        }
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      overflow-x: auto;
    }

    .stepper {
      display: flex;
      align-items: flex-start;
      gap: 0;
      min-width: 500px;
    }

    .stepper__step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }

    .stepper__circle {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid var(--mat-sys-outline-variant);
      background: var(--mat-sys-surface);
      transition: all 300ms ease;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: var(--mat-sys-outline);
      }
    }

    .stepper__step.completed .stepper__circle {
      background: var(--mat-sys-primary);
      border-color: var(--mat-sys-primary);

      mat-icon { color: var(--mat-sys-on-primary); }
    }

    .stepper__step.active .stepper__circle {
      border-color: var(--mat-sys-primary);
      background: color-mix(in srgb, var(--mat-sys-primary) 12%, transparent);

      mat-icon { color: var(--mat-sys-primary); }
    }

    .stepper__label {
      font-size: 0.6875rem;
      color: var(--mat-sys-on-surface-variant);
      text-align: center;
      max-width: 72px;
    }

    .stepper__step.active .stepper__label {
      color: var(--mat-sys-primary);
      font-weight: 600;
    }

    .stepper__line {
      flex: 1;
      height: 2px;
      background-color: var(--mat-sys-outline-variant);
      margin-top: 18px;
      min-width: 32px;
      transition: background-color 300ms ease;

      &.filled {
        background-color: var(--mat-sys-primary);
      }
    }
  `,
})
export class ApplicationProgressStepperComponent {
  readonly currentStatus = input.required<ApplicationStatus>();
  protected readonly steps = STEPS;

  readonly currentIndex = computed(() => {
    const idx = STEPS.findIndex((s) => s.status === this.currentStatus());
    return idx >= 0 ? idx : 0;
  });
}
