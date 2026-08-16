import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ApplicationStatus } from '../../../../core/enums';

interface StepperStep {
  label: string;
  icon: string;
  status: ApplicationStatus;
}

const HAPPY_PATH: StepperStep[] = [
  { label: 'Pendiente',          icon: 'schedule',       status: ApplicationStatus.PENDING },
  { label: 'Revisión',           icon: 'visibility',     status: ApplicationStatus.UNDER_REVIEW },
  { label: 'Preselección',       icon: 'star_outline',   status: ApplicationStatus.SHORTLISTED },
  { label: 'Entrevista',         icon: 'event',          status: ApplicationStatus.INTERVIEW },
  { label: 'Aceptada',           icon: 'check_circle',   status: ApplicationStatus.ACCEPTED },
  { label: 'Esperando asesor',   icon: 'person_search',  status: ApplicationStatus.PENDING_SUPERVISOR },
  { label: 'En progreso',        icon: 'play_circle',    status: ApplicationStatus.IN_PROGRESS },
  { label: 'Completada',         icon: 'task_alt',       status: ApplicationStatus.COMPLETED },
];

const TERMINAL_STATUSES = new Set([
  ApplicationStatus.REJECTED,
  ApplicationStatus.WITHDRAWN,
  ApplicationStatus.CANCELLED,
]);

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

  readonly isTerminal = computed(() => TERMINAL_STATUSES.has(this.currentStatus()));

  readonly steps = computed<StepperStep[]>(() => {
    const status = this.currentStatus();
    if (!TERMINAL_STATUSES.has(status)) return HAPPY_PATH;

    const idx = HAPPY_PATH.findIndex((s) => s.status === status);
    if (idx >= 0) return HAPPY_PATH;

    const lastReached = this.lastReachedIndex();
    const steps = HAPPY_PATH.slice(0, lastReached + 1);
    const terminalLabels: Record<string, { label: string; icon: string }> = {
      [ApplicationStatus.REJECTED]:  { label: 'Rechazada', icon: 'cancel' },
      [ApplicationStatus.WITHDRAWN]: { label: 'Retirada',  icon: 'undo' },
      [ApplicationStatus.CANCELLED]: { label: 'Cancelada', icon: 'block' },
    };
    const term = terminalLabels[status] ?? { label: status, icon: 'help' };
    steps.push({ ...term, status });
    return steps;
  });

  readonly currentIndex = computed(() => {
    const s = this.steps();
    const idx = s.findIndex((step) => step.status === this.currentStatus());
    return idx >= 0 ? idx : s.length - 1;
  });

  private lastReachedIndex(): number {
    return 0;
  }
}
