import { ApplicationStatus, ProjectStatus } from '../enums';

export interface StatusConfig {
  label: string;
  icon: string;
  tone: 'success' | 'warning' | 'error' | 'info' | 'neutral';
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
  [ApplicationStatus.PENDING]:            { label: 'Pendiente',            icon: 'schedule',       tone: 'warning' },
  [ApplicationStatus.UNDER_REVIEW]:       { label: 'En revisión',          icon: 'visibility',     tone: 'info' },
  [ApplicationStatus.SHORTLISTED]:        { label: 'Preseleccionada',      icon: 'star_outline',   tone: 'info' },
  [ApplicationStatus.INTERVIEW]:          { label: 'Entrevista',           icon: 'event',          tone: 'info' },
  [ApplicationStatus.ACCEPTED]:           { label: 'Aceptada',             icon: 'check_circle',   tone: 'success' },
  [ApplicationStatus.PENDING_SUPERVISOR]: { label: 'Esperando asesor',     icon: 'person_search',  tone: 'warning' },
  [ApplicationStatus.REJECTED]:           { label: 'Rechazada',            icon: 'cancel',         tone: 'error' },
  [ApplicationStatus.IN_PROGRESS]:        { label: 'En progreso',          icon: 'play_circle',    tone: 'info' },
  [ApplicationStatus.COMPLETED]:          { label: 'Completada',           icon: 'task_alt',       tone: 'success' },
  [ApplicationStatus.CANCELLED]:          { label: 'Cancelada',            icon: 'block',          tone: 'neutral' },
  [ApplicationStatus.WITHDRAWN]:          { label: 'Retirada',             icon: 'undo',           tone: 'neutral' },
};

const PROJECT: Record<string, StatusConfig> = {
  [ProjectStatus.DRAFT]:            { label: 'Borrador',         icon: 'edit',         tone: 'neutral' },
  [ProjectStatus.NEEDS_CHANGES]:    { label: 'Necesita cambios', icon: 'rate_review',  tone: 'warning' },
  [ProjectStatus.PENDING_APPROVAL]: { label: 'En revisión',      icon: 'pending',      tone: 'warning' },
  [ProjectStatus.PUBLISHED]:        { label: 'Publicado',        icon: 'public',       tone: 'success' },
  [ProjectStatus.IN_PROGRESS]:      { label: 'En progreso',      icon: 'play_circle',  tone: 'info' },
  [ProjectStatus.COMPLETED]:        { label: 'Completado',       icon: 'task_alt',     tone: 'success' },
  [ProjectStatus.CANCELLED]:        { label: 'Cancelado',        icon: 'block',        tone: 'neutral' },
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

const FALLBACK: StatusConfig = { label: '', icon: 'help', tone: 'neutral' };

export function statusOf(domain: StatusDomain, value: string): StatusConfig {
  return REGISTRIES[domain][value] ?? { ...FALLBACK, label: value };
}

export function statusLabel(domain: StatusDomain, value: string): string {
  return statusOf(domain, value).label;
}

const TONE_COLORS: Record<StatusConfig['tone'], { color: string; bg: string }> = {
  success: { color: '#2e7d32', bg: '#e8f5e9' },
  warning: { color: '#f57c00', bg: '#fff3e0' },
  error:   { color: '#c62828', bg: '#ffebee' },
  info:    { color: '#1565c0', bg: '#e3f2fd' },
  neutral: { color: '#616161', bg: '#f5f5f5' },
};

export function statusColors(tone: StatusConfig['tone']): { color: string; bg: string } {
  return TONE_COLORS[tone];
}
