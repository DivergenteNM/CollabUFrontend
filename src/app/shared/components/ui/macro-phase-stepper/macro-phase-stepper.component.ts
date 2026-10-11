import {
  Component,
  ChangeDetectionStrategy,
  input,
  signal,
  computed,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApplicationStatus } from '../../../../core/enums';
import {
  MACRO_PHASES_CONFIG,
  MacroPhaseConfig,
  MacroPhaseId,
  PhaseStepConfig,
} from '../../../../features/applications/config/application-phases.config';
import {
  resolveApplicationPhase,
  getStepStatus,
  PhaseResolutionResult,
} from '../../../../features/applications/utils/application-phases.utils';

@Component({
  selector: 'app-macro-phase-stepper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatTooltipModule],
  host: {
    class: 'macro-stepper-host',
    role: 'region',
    'aria-label': 'Progreso de la postulación por fases',
  },
  templateUrl: './macro-phase-stepper.component.html',
  styleUrl: './macro-phase-stepper.component.scss',
})
export class MacroPhaseStepperComponent {
  readonly status = input.required<ApplicationStatus>();
  readonly hasUpcomingInterview = input<boolean>(false);
  readonly interactive = input<boolean>(true);

  readonly selectedPhaseOverride = signal<MacroPhaseId | null>(null);

  readonly macroPhases = MACRO_PHASES_CONFIG;

  readonly resolution = computed<PhaseResolutionResult>(() =>
    resolveApplicationPhase(this.status(), this.hasUpcomingInterview()),
  );

  readonly isTerminal = computed(() => this.resolution().isTerminal);

  readonly activePhase = computed<MacroPhaseConfig>(() => {
    const override = this.selectedPhaseOverride();
    if (override) {
      const found = this.macroPhases.find((p) => p.id === override);
      if (found) return found;
    }
    return this.resolution().currentPhase;
  });

  readonly isViewingHistory = computed(() => {
    const override = this.selectedPhaseOverride();
    return (
      override !== null && override !== this.resolution().currentPhase.id
    );
  });

  readonly stepsToDisplay = computed<PhaseStepConfig[]>(() => {
    return this.activePhase().steps;
  });

  readonly currentActiveStep = computed<PhaseStepConfig | null>(() => {
    if (this.isTerminal()) return null;
    const steps = this.stepsToDisplay();
    const idx = this.isViewingHistory()
      ? steps.length - 1
      : this.resolution().activeStepIndex;
    return steps[idx] ?? steps[0] ?? null;
  });

  readonly currentActiveStepNumber = computed<number>(() => {
    if (this.isViewingHistory()) return this.stepsToDisplay().length;
    return this.resolution().activeStepIndex + 1;
  });

  readonly currentStepCaption = computed<string | null>(() => {
    if (this.isTerminal()) return null;
    if (this.isViewingHistory()) {
      return `Historial completado: ${this.activePhase().label}`;
    }
    const step = this.activePhase().steps[this.resolution().activeStepIndex];
    if (!step) return null;
    return `${step.label}: ${step.shortDescription}`;
  });

  onPhaseClick(phase: MacroPhaseConfig): void {
    if (!this.interactive() || this.isTerminal()) return;

    // Solo se permite inspeccionar fases completadas o la fase activa actual
    const currentOrder = this.resolution().currentPhaseIndex;
    if (phase.order > currentOrder) {
      return; // No se puede explorar una fase futura aún no alcanzada
    }

    if (this.selectedPhaseOverride() === phase.id) {
      // Si ya está seleccionada la inspección, volver al modo automático
      this.selectedPhaseOverride.set(null);
    } else if (phase.id === this.resolution().currentPhase.id) {
      this.selectedPhaseOverride.set(null);
    } else {
      this.selectedPhaseOverride.set(phase.id);
    }
  }

  resetToActive(): void {
    this.selectedPhaseOverride.set(null);
  }

  isPhaseCompleted(phase: MacroPhaseConfig): boolean {
    if (this.isTerminal()) return false;
    return phase.order < this.resolution().currentPhaseIndex;
  }

  isPhaseCurrent(phase: MacroPhaseConfig): boolean {
    if (this.isTerminal()) return false;
    return phase.order === this.resolution().currentPhaseIndex;
  }

  isPhaseSelected(phase: MacroPhaseConfig): boolean {
    return this.activePhase().id === phase.id;
  }

  getStepState(stepIndex: number): 'completed' | 'active' | 'future' {
    return getStepStatus(
      this.activePhase(),
      stepIndex,
      this.resolution(),
    );
  }
}
