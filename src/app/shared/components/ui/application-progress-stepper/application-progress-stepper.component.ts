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
  templateUrl: './application-progress-stepper.component.html',
  styleUrl: './application-progress-stepper.component.scss',
})
export class ApplicationProgressStepperComponent {
  readonly currentStatus = input.required<ApplicationStatus>();
  protected readonly steps = STEPS;

  readonly currentIndex = computed(() => {
    const idx = STEPS.findIndex((s) => s.status === this.currentStatus());
    return idx >= 0 ? idx : 0;
  });
}
