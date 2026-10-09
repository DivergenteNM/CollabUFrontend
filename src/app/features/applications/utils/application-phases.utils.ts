import { ApplicationStatus } from '../../../core/enums';
import {
  MACRO_PHASES_CONFIG,
  MacroPhaseConfig,
  MacroPhaseId,
  PhaseStepConfig,
} from '../config/application-phases.config';

export interface PhaseResolutionResult {
  currentPhase: MacroPhaseConfig;
  currentPhaseIndex: number;
  activeStepIndex: number;
  isPhaseCompleted: (phaseOrder: number) => boolean;
  isTerminal: boolean;
  terminalLabel?: string;
  terminalIcon?: string;
  terminalDescription?: string;
  ctaConfig: {
    label: string;
    icon: string;
    cssClass: string;
  };
}

export const TERMINAL_STATUS_CONFIG: Record<
  string,
  { label: string; icon: string; description: string }
> = {
  [ApplicationStatus.REJECTED]: {
    label: 'Postulación no seleccionada',
    icon: 'cancel',
    description: 'La organización concluyó la selección con otros candidatos.',
  },
  [ApplicationStatus.WITHDRAWN]: {
    label: 'Postulación retirada',
    icon: 'undo',
    description: 'Retiraste voluntariamente tu postulación a esta vacante.',
  },
  [ApplicationStatus.CANCELLED]: {
    label: 'Convocatoria cancelada',
    icon: 'block',
    description: 'El proyecto o la convocatoria fue cancelada por la entidad.',
  },
};

export function resolveApplicationPhase(
  status: ApplicationStatus,
  hasUpcomingInterview = false,
): PhaseResolutionResult {
  const isTerminal =
    status === ApplicationStatus.REJECTED ||
    status === ApplicationStatus.WITHDRAWN ||
    status === ApplicationStatus.CANCELLED;

  if (isTerminal) {
    const term = TERMINAL_STATUS_CONFIG[status] ?? {
      label: 'Postulación cerrada',
      icon: 'close',
      description: 'El proceso para esta postulación ha finalizado.',
    };

    return {
      currentPhase: MACRO_PHASES_CONFIG[0],
      currentPhaseIndex: 1,
      activeStepIndex: -1,
      isPhaseCompleted: () => false,
      isTerminal: true,
      terminalLabel: term.label,
      terminalIcon: term.icon,
      terminalDescription: term.description,
      ctaConfig: {
        label: 'Ver Detalle',
        icon: 'folder_open',
        cssClass: 'app-btn--detail',
      },
    };
  }

  let targetPhaseId: MacroPhaseId = 'RECRUITMENT';
  let activeStepIndex = 0;

  switch (status) {
    case ApplicationStatus.COMPLETED:
      targetPhaseId = 'WORKSPACE';
      activeStepIndex = 1;
      break;
    case ApplicationStatus.IN_PROGRESS:
      targetPhaseId = 'WORKSPACE';
      activeStepIndex = 0;
      break;
    case ApplicationStatus.PENDING_SUPERVISOR:
      targetPhaseId = 'ACADEMIC';
      activeStepIndex = 1;
      break;
    case ApplicationStatus.ACCEPTED:
      // Una vez aceptado por la empresa, la etapa activa para el estudiante
      // pasa a ser la Vinculación Académica (espera de tutor institucional).
      targetPhaseId = 'ACADEMIC';
      activeStepIndex = 0;
      break;
    case ApplicationStatus.INTERVIEW:
      targetPhaseId = 'RECRUITMENT';
      activeStepIndex = 3;
      break;
    case ApplicationStatus.SHORTLISTED:
      targetPhaseId = 'RECRUITMENT';
      activeStepIndex = 2;
      break;
    case ApplicationStatus.UNDER_REVIEW:
      targetPhaseId = 'RECRUITMENT';
      activeStepIndex = 1;
      break;
    case ApplicationStatus.PENDING:
    default:
      targetPhaseId = 'RECRUITMENT';
      activeStepIndex = 0;
      break;
  }

  const currentPhase =
    MACRO_PHASES_CONFIG.find((p) => p.id === targetPhaseId) ??
    MACRO_PHASES_CONFIG[0];
  const currentPhaseIndex = currentPhase.order;

  let ctaConfig = {
    label: 'Ver Seguimiento',
    icon: 'visibility',
    cssClass: 'app-btn--detail',
  };

  if (status === ApplicationStatus.INTERVIEW || hasUpcomingInterview) {
    ctaConfig = {
      label: 'Ver Entrevista',
      icon: 'event',
      cssClass: 'app-btn--interview',
    };
  } else if (targetPhaseId === 'ACADEMIC') {
    ctaConfig = {
      label: 'Gestión Académica',
      icon: 'school',
      cssClass: 'app-btn--academic',
    };
  } else if (targetPhaseId === 'WORKSPACE') {
    ctaConfig = {
      label: 'Ir al Workspace',
      icon: 'rocket_launch',
      cssClass: 'app-btn--workspace',
    };
  }

  return {
    currentPhase,
    currentPhaseIndex,
    activeStepIndex,
    isPhaseCompleted: (phaseOrder: number) => phaseOrder < currentPhaseIndex,
    isTerminal: false,
    ctaConfig,
  };
}

/**
 * Determina el estado de un paso individual para cualquier fase visualizada
 * (permite mostrar el estado real o histórico si el estudiante inspecciona
 * una fase pasada).
 */
export function getStepStatus(
  viewedPhase: MacroPhaseConfig,
  stepIndex: number,
  resolution: PhaseResolutionResult,
): 'completed' | 'active' | 'future' {
  if (resolution.isTerminal) {
    return 'future';
  }

  // Si la fase visualizada es anterior a la fase activa actual, todos sus pasos están completados
  if (viewedPhase.order < resolution.currentPhaseIndex) {
    return 'completed';
  }

  // Si la fase visualizada es posterior a la fase activa, todos están futuros
  if (viewedPhase.order > resolution.currentPhaseIndex) {
    return 'future';
  }

  // Estamos dentro de la fase activa actual
  if (stepIndex < resolution.activeStepIndex) {
    return 'completed';
  }
  if (stepIndex === resolution.activeStepIndex) {
    return 'active';
  }
  return 'future';
}

/**
 * Retorna los pasos a mostrar para una fase dada.
 */
export function getPhaseSteps(phaseId: MacroPhaseId): PhaseStepConfig[] {
  const phase = MACRO_PHASES_CONFIG.find((p) => p.id === phaseId);
  return phase ? phase.steps : [];
}
