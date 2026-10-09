import { ApplicationStatus } from '../../../core/enums';

export type MacroPhaseId = 'RECRUITMENT' | 'ACADEMIC' | 'WORKSPACE';

export interface PhaseStepConfig {
  status: ApplicationStatus;
  label: string;
  icon: string;
  shortDescription: string;
}

export interface MacroPhaseConfig {
  id: MacroPhaseId;
  order: number;
  label: string;
  shortLabel: string;
  icon: string;
  description: string;
  steps: PhaseStepConfig[];
}

export const MACRO_PHASES_CONFIG: MacroPhaseConfig[] = [
  {
    id: 'RECRUITMENT',
    order: 1,
    label: 'Convocatoria & Selección',
    shortLabel: 'Selección',
    icon: 'how_to_reg',
    description: 'Postulación y rondas de evaluación con la empresa',
    steps: [
      {
        status: ApplicationStatus.PENDING,
        label: 'Pendiente',
        icon: 'schedule',
        shortDescription: 'Postulación recibida, en espera de revisión',
      },
      {
        status: ApplicationStatus.UNDER_REVIEW,
        label: 'En revisión',
        icon: 'visibility',
        shortDescription: 'Empresa evaluando antecedentes y perfil',
      },
      {
        status: ApplicationStatus.SHORTLISTED,
        label: 'Preselección',
        icon: 'star_outline',
        shortDescription: 'Candidato en lista de preseleccionados',
      },
      {
        status: ApplicationStatus.INTERVIEW,
        label: 'Entrevista',
        icon: 'event',
        shortDescription: 'Entrevista o prueba técnica agendada',
      },
      {
        status: ApplicationStatus.ACCEPTED,
        label: 'Aceptada',
        icon: 'check_circle',
        shortDescription: 'Aprobado y seleccionado por la empresa',
      },
    ],
  },
  {
    id: 'ACADEMIC',
    order: 2,
    label: 'Proceso Académico',
    shortLabel: 'Académico',
    icon: 'school',
    description: 'Asignación de asesor y visto bueno curricular institucional',
    steps: [
      {
        status: ApplicationStatus.ACCEPTED,
        label: 'Visto Bueno',
        icon: 'verified',
        shortDescription: 'Seleccionado; en espera de asignación de asesor',
      },
      {
        status: ApplicationStatus.PENDING_SUPERVISOR,
        label: 'Asesor Docente',
        icon: 'person_search',
        shortDescription: 'Tutor institucional propuesto en espera de aceptación',
      },
      {
        status: ApplicationStatus.IN_PROGRESS,
        label: 'Vinculación Lista',
        icon: 'assignment_turned_in',
        shortDescription: 'Asesor confirmado, habilitado para anteproyecto',
      },
    ],
  },
  {
    id: 'WORKSPACE',
    order: 3,
    label: 'Workspace & Ejecución',
    shortLabel: 'Workspace',
    icon: 'rocket_launch',
    description: 'Ejecución del proyecto, seguimiento, entregables y cierre',
    steps: [
      {
        status: ApplicationStatus.IN_PROGRESS,
        label: 'En Ejecución',
        icon: 'play_circle',
        shortDescription: 'Trabajo colaborativo y entregables en marcha',
      },
      {
        status: ApplicationStatus.COMPLETED,
        label: 'Finalizado',
        icon: 'task_alt',
        shortDescription: 'Proyecto completado y calificado con éxito',
      },
    ],
  },
];
