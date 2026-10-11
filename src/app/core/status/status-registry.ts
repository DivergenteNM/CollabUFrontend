import { ApplicationStatus, ProjectStatus } from '../enums';

export interface StatusConfig {
  label: string;
  icon: string;
  tone: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'interview';
  description?: string;
}

export type StatusDomain =
  | 'application'
  | 'project'
  | 'academicRecord'
  | 'submission'
  | 'document'
  | 'deliverable'
  | 'assignment'
  | 'evaluation';

const APPLICATION: Record<string, StatusConfig> = {
  [ApplicationStatus.PENDING]:            { label: 'Pendiente',            icon: 'schedule',       tone: 'warning',   description: 'Pendiente: La postulación fue enviada y está en espera de revisión por la empresa.' },
  [ApplicationStatus.UNDER_REVIEW]:       { label: 'En revisión',          icon: 'visibility',     tone: 'info',      description: 'En revisión: La empresa está evaluando el perfil y los antecedentes del postulante.' },
  [ApplicationStatus.SHORTLISTED]:        { label: 'Preseleccionada',      icon: 'star_outline',   tone: 'info',      description: 'Preseleccionada: El estudiante avanzó a la lista de candidatos preseleccionados.' },
  [ApplicationStatus.INTERVIEW]:          { label: 'Entrevista',           icon: 'event',          tone: 'interview', description: 'Entrevista: Se ha programado una entrevista o evaluación con el postulante.' },
  [ApplicationStatus.ACCEPTED]:           { label: 'Aceptada',             icon: 'check_circle',   tone: 'success',   description: 'Aceptada: El estudiante fue seleccionado e incorporado al proyecto.' },
  [ApplicationStatus.PENDING_SUPERVISOR]: { label: 'Esperando asesor',     icon: 'person_search',  tone: 'warning',   description: 'Esperando asesor: Pendiente de asignación de tutor o asesor académico.' },
  [ApplicationStatus.REJECTED]:           { label: 'Rechazada',            icon: 'cancel',         tone: 'error',     description: 'Rechazada: La postulación no fue seleccionada en esta convocatoria.' },
  [ApplicationStatus.IN_PROGRESS]:        { label: 'En progreso',          icon: 'play_circle',    tone: 'info',      description: 'En progreso: El estudiante se encuentra trabajando activamente en el proyecto.' },
  [ApplicationStatus.COMPLETED]:          { label: 'Completada',           icon: 'task_alt',       tone: 'success',   description: 'Completada: Las actividades del estudiante en el proyecto finalizaron con éxito.' },
  [ApplicationStatus.CANCELLED]:          { label: 'Cancelada',            icon: 'block',          tone: 'neutral',   description: 'Cancelada: La postulación fue cancelada.' },
  [ApplicationStatus.WITHDRAWN]:          { label: 'Retirada',             icon: 'undo',           tone: 'neutral',   description: 'Retirada: El estudiante retiró voluntariamente su postulación.' },
};

const PROJECT: Record<string, StatusConfig> = {
  [ProjectStatus.DRAFT]:            { label: 'Borrador',         icon: 'edit',         tone: 'neutral', description: 'Borrador: En edición preliminar. No es visible para estudiantes ni ha sido enviado a revisión.' },
  [ProjectStatus.NEEDS_CHANGES]:    { label: 'Necesita cambios', icon: 'rate_review',  tone: 'warning', description: 'Requiere cambios: La coordinación académica revisó el proyecto y solicitó ajustes antes de su aprobación.' },
  [ProjectStatus.PENDING_APPROVAL]: { label: 'En revisión',      icon: 'pending',      tone: 'warning', description: 'En revisión: Enviado a la facultad. Pendiente de evaluación y aprobación institucional.' },
  [ProjectStatus.PUBLISHED]:        { label: 'Publicado',        icon: 'public',       tone: 'success', description: 'Publicado: Convocatoria abierta y aprobada. Los estudiantes pueden consultar el proyecto y postularse.' },
  [ProjectStatus.IN_PROGRESS]:      { label: 'En progreso',      icon: 'play_circle',  tone: 'info',    description: 'En progreso: Cuenta con estudiantes asignados y se encuentra en ejecución activa.' },
  [ProjectStatus.COMPLETED]:        { label: 'Completado',       icon: 'task_alt',     tone: 'success', description: 'Completado: Ha finalizado todas las actividades, entregables y evaluaciones exitosamente.' },
  [ProjectStatus.CANCELLED]:        { label: 'Cancelado',        icon: 'block',        tone: 'neutral', description: 'Cancelado: Convocatoria o ejecución cancelada. No admite más postulaciones ni actividades.' },
};

const ACADEMIC_RECORD: Record<string, StatusConfig> = {
  waiting_anteproyecto:  { label: 'Esperando anteproyecto',     icon: 'menu_book',       tone: 'warning' },
  waiting_documents:     { label: 'Esperando documentos',       icon: 'description',     tone: 'warning' },
  waiting_agreement:     { label: 'Esperando acuerdo',          icon: 'handshake',       tone: 'warning' },
  active:                { label: 'Activo',                     icon: 'play_circle',     tone: 'success' },
  waiting_final_docs:    { label: 'Esperando docs. finales',    icon: 'upload_file',     tone: 'warning' },
  final_docs_review:     { label: 'Revisión docs. finales',     icon: 'fact_check',      tone: 'info' },
  finalizing:            { label: 'Finalizando',                icon: 'flag',            tone: 'info' },
  completed:             { label: 'Completado',                 icon: 'school',          tone: 'success' },
  cancelled:             { label: 'Cancelado',                  icon: 'block',           tone: 'neutral' },
};

const SUBMISSION: Record<string, StatusConfig> = {
  pending_submission: { label: 'Pendiente de entrega', icon: 'edit_note',    tone: 'warning' },
  submitted:          { label: 'Entregado',            icon: 'send',         tone: 'info' },
  under_review:       { label: 'En revisión',          icon: 'rate_review',  tone: 'info' },
  needs_revision:     { label: 'Necesita corrección',  icon: 'edit',         tone: 'warning' },
  revised:            { label: 'Corregido',            icon: 'published_with_changes', tone: 'info' },
  approved:           { label: 'Aprobado',             icon: 'check_circle', tone: 'success' },
  rejected:           { label: 'Rechazado',            icon: 'cancel',       tone: 'error' },
  expired:            { label: 'Plazo vencido',        icon: 'timer_off',    tone: 'error' },
};

const DOCUMENT: Record<string, StatusConfig> = {
  pending:   { label: 'Pendiente',    icon: 'hourglass_empty', tone: 'warning' },
  submitted: { label: 'En revisión',  icon: 'rate_review',     tone: 'info' },
  approved:  { label: 'Aprobado',     icon: 'check_circle',    tone: 'success' },
  rejected:  { label: 'Rechazado',    icon: 'cancel',          tone: 'error' },
};

const DELIVERABLE: Record<string, StatusConfig> = {
  pending:         { label: 'Pendiente',           icon: 'hourglass_empty', tone: 'warning' },
  submitted:       { label: 'Entregado',           icon: 'send',            tone: 'info' },
  approved:        { label: 'Aprobado',            icon: 'check_circle',    tone: 'success' },
  rejected:        { label: 'Rechazado',           icon: 'cancel',          tone: 'error' },
  needs_revision:  { label: 'Necesita corrección', icon: 'edit',            tone: 'warning' },
};

const ASSIGNMENT: Record<string, StatusConfig> = {
  pending_acceptance: { label: 'Pendiente de aceptación', icon: 'hourglass_top', tone: 'warning' },
  accepted:           { label: 'Aceptada',                icon: 'thumb_up',      tone: 'success' },
  active:             { label: 'Activa',                  icon: 'check_circle',  tone: 'success' },
  declined:           { label: 'Declinada',               icon: 'thumb_down',    tone: 'error' },
  disconnected:       { label: 'Desconectada',            icon: 'link_off',      tone: 'neutral' },
  replaced:           { label: 'Reemplazada',             icon: 'swap_horiz',    tone: 'neutral' },
  completed:          { label: 'Completada',              icon: 'task_alt',      tone: 'success' },
};

const EVALUATION: Record<string, StatusConfig> = {
  pending:     { label: 'Pendiente',    icon: 'hourglass_empty', tone: 'warning' },
  in_progress: { label: 'En progreso',  icon: 'edit',            tone: 'info' },
  completed:   { label: 'Completada',   icon: 'check_circle',    tone: 'success' },
  expired:     { label: 'Expirada',     icon: 'timer_off',       tone: 'error' },
};

const REGISTRIES: Record<StatusDomain, Record<string, StatusConfig>> = {
  application: APPLICATION,
  project: PROJECT,
  academicRecord: ACADEMIC_RECORD,
  submission: SUBMISSION,
  document: DOCUMENT,
  deliverable: DELIVERABLE,
  assignment: ASSIGNMENT,
  evaluation: EVALUATION,
};

const FALLBACK: StatusConfig = { label: '', icon: 'help', tone: 'neutral', description: 'Estado no catalogado' };

export function statusOf(domain: StatusDomain, value: string): StatusConfig {
  return REGISTRIES[domain][value] ?? { ...FALLBACK, label: value };
}

export function statusLabel(domain: StatusDomain, value: string): string {
  return statusOf(domain, value).label;
}

export function statusDescription(domain: StatusDomain, value: string): string {
  return statusOf(domain, value).description ?? statusOf(domain, value).label;
}

const TONE_COLORS: Record<StatusConfig['tone'], { color: string; bg: string; border: string }> = {
  success:   { color: 'var(--color-success-text)', bg: 'var(--color-success-bg)', border: 'var(--color-success-border)' },
  warning:   { color: 'var(--color-warning-text)', bg: 'var(--color-warning-bg)', border: 'var(--color-warning-border)' },
  error:     { color: 'var(--color-error-text)',   bg: 'var(--color-error-bg)',   border: 'var(--color-error-border)' },
  info:      { color: 'var(--color-info-text)',    bg: 'var(--color-info-bg)',    border: 'var(--color-info-border)' },
  neutral:   { color: 'var(--text-secondary)',     bg: 'var(--bg-secondary)',     border: 'var(--border-color)' },
  interview: { color: 'var(--color-success-text)', bg: 'var(--color-success-bg)', border: 'var(--color-success-border)' },
};

export function statusColors(tone: StatusConfig['tone']): { color: string; bg: string; border: string } {
  return TONE_COLORS[tone] ?? TONE_COLORS.neutral;
}
