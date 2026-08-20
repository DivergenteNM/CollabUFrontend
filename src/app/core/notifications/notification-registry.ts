import { NotificationType } from '../enums';

export type NotificationTone = 'info' | 'success' | 'warning' | 'danger' | 'neutral';

export type NotificationCategory =
  | 'applications'
  | 'academic'
  | 'chat'
  | 'evaluations'
  | 'system'
  | 'projects';

export interface NotificationConfig {
  icon: string;
  tone: NotificationTone;
  category: NotificationCategory;
  defaultTitle: string;
  buildActionUrl: (data: Record<string, any> | undefined) => string | null;
}

/**
 * Construye la URL del workspace con tab y ancla opcional.
 * Cuando el registro apunta a un proyecto específico, el deep link
 * abre el workspace ya posicionado en la pestaña relevante.
 */
function workspaceUrl(
  data: Record<string, any> | undefined,
  opts: { tab?: string; anchor?: string } = {},
): string | null {
  const id = data?.['applicationId'] ?? data?.['application_id'];
  if (!id) return null;
  const params: string[] = [];
  if (opts.tab) params.push(`tab=${encodeURIComponent(opts.tab)}`);
  if (opts.anchor) params.push(`anchor=${encodeURIComponent(opts.anchor)}`);
  const qs = params.length ? `?${params.join('&')}` : '';
  return `/workspace/${id}${qs}`;
}

function projectUrl(data: Record<string, any> | undefined): string | null {
  const id = data?.['projectId'] ?? data?.['project_id'];
  return id ? `/projects/${id}` : null;
}

function chatUrl(data: Record<string, any> | undefined): string | null {
  const id = data?.['conversationId'] ?? data?.['conversation_id'];
  return id ? `/chat/${id}` : null;
}

export const NOTIFICATION_REGISTRY: Record<NotificationType, NotificationConfig> = {
  // ─── Aplicaciones ─────────────────────────────────────────────────────────
  [NotificationType.APPLICATION_RECEIVED]: {
    icon: 'assignment_ind', tone: 'info', category: 'applications',
    defaultTitle: 'Nueva postulación recibida',
    buildActionUrl: (d) => workspaceUrl(d),
  },
  [NotificationType.APPLICATION_STATUS_CHANGED]: {
    icon: 'sync', tone: 'info', category: 'applications',
    defaultTitle: 'Estado de postulación actualizado',
    buildActionUrl: (d) => workspaceUrl(d),
  },
  [NotificationType.APPLICATION_ACCEPTED]: {
    icon: 'check_circle', tone: 'success', category: 'applications',
    defaultTitle: 'Postulación aceptada',
    buildActionUrl: (d) => workspaceUrl(d),
  },
  [NotificationType.APPLICATION_REJECTED]: {
    icon: 'cancel', tone: 'danger', category: 'applications',
    defaultTitle: 'Postulación rechazada',
    buildActionUrl: (d) => workspaceUrl(d),
  },

  // ─── Entrevistas ──────────────────────────────────────────────────────────
  [NotificationType.INTERVIEW_SCHEDULED]: {
    icon: 'event', tone: 'info', category: 'applications',
    defaultTitle: 'Entrevista programada',
    buildActionUrl: (d) => workspaceUrl(d, { tab: 'interviews' }),
  },
  [NotificationType.INTERVIEW_REMINDER]: {
    icon: 'alarm', tone: 'warning', category: 'applications',
    defaultTitle: 'Recordatorio de entrevista',
    buildActionUrl: (d) => workspaceUrl(d, { tab: 'interviews' }),
  },

  // ─── Evaluaciones ─────────────────────────────────────────────────────────
  [NotificationType.EVALUATION_PENDING]: {
    icon: 'rate_review', tone: 'warning', category: 'evaluations',
    defaultTitle: 'Evaluación pendiente',
    buildActionUrl: (d) => {
      const id = d?.['evaluationId'] ?? d?.['evaluation_id'];
      return id ? `/my-evaluations/${id}` : '/my-evaluations';
    },
  },
  [NotificationType.EVALUATION_COMPLETED]: {
    icon: 'grading', tone: 'success', category: 'evaluations',
    defaultTitle: 'Evaluación completada',
    buildActionUrl: (d) => {
      const id = d?.['evaluationId'] ?? d?.['evaluation_id'];
      return id ? `/my-evaluations/${id}` : '/my-evaluations';
    },
  },

  // ─── Proyectos (marketplace) ──────────────────────────────────────────────
  [NotificationType.PROJECT_NEW]: {
    icon: 'work', tone: 'info', category: 'projects',
    defaultTitle: 'Nuevo proyecto disponible',
    buildActionUrl: (d) => projectUrl(d),
  },
  [NotificationType.PROJECT_DEADLINE_REMINDER]: {
    icon: 'schedule', tone: 'warning', category: 'projects',
    defaultTitle: 'Recordatorio de fecha límite',
    buildActionUrl: (d) => workspaceUrl(d) ?? projectUrl(d),
  },
  [NotificationType.PROJECT_STATUS_CHANGED]: {
    icon: 'change_circle', tone: 'info', category: 'projects',
    defaultTitle: 'Proyecto actualizado',
    buildActionUrl: (d) => projectUrl(d),
  },
  [NotificationType.MATCH_RECOMMENDATION]: {
    icon: 'auto_awesome', tone: 'info', category: 'projects',
    defaultTitle: 'Nueva recomendación',
    buildActionUrl: (d) => projectUrl(d) ?? '/marketplace',
  },

  // ─── Chat ─────────────────────────────────────────────────────────────────
  [NotificationType.MESSAGE_RECEIVED]: {
    icon: 'chat', tone: 'info', category: 'chat',
    defaultTitle: 'Nuevo mensaje',
    buildActionUrl: (d) => chatUrl(d),
  },

  // ─── Entregables ──────────────────────────────────────────────────────────
  [NotificationType.DELIVERABLE_ASSIGNED]: {
    icon: 'assignment_add', tone: 'info', category: 'academic',
    defaultTitle: 'Nuevo entregable asignado',
    buildActionUrl: (d) => workspaceUrl(d, { tab: 'deliverables' }),
  },
  [NotificationType.DELIVERABLE_SUBMITTED]: {
    icon: 'assignment_turned_in', tone: 'info', category: 'academic',
    defaultTitle: 'Entregable recibido',
    buildActionUrl: (d) => workspaceUrl(d, { tab: 'deliverables' }),
  },
  [NotificationType.DELIVERABLE_FEEDBACK]: {
    icon: 'feedback', tone: 'info', category: 'academic',
    defaultTitle: 'Retroalimentación en entregable',
    buildActionUrl: (d) => workspaceUrl(d, { tab: 'deliverables' }),
  },

  // ─── Sistema ──────────────────────────────────────────────────────────────
  [NotificationType.COMPANY_VERIFIED]: {
    icon: 'verified', tone: 'success', category: 'system',
    defaultTitle: 'Empresa verificada',
    buildActionUrl: () => '/my-company',
  },
  [NotificationType.SYSTEM_ANNOUNCEMENT]: {
    icon: 'campaign', tone: 'neutral', category: 'system',
    defaultTitle: 'Anuncio del sistema',
    buildActionUrl: (d) => (d?.['actionUrl'] as string) ?? null,
  },

  // ─── Revisión institucional de proyectos ──────────────────────────────────
  [NotificationType.PROJECT_SUBMITTED_FOR_REVIEW]: {
    icon: 'fact_check', tone: 'info', category: 'projects',
    defaultTitle: 'Proyecto enviado a revisión',
    buildActionUrl: (d) => projectUrl(d),
  },
  [NotificationType.PROJECT_APPROVED]: {
    icon: 'verified', tone: 'success', category: 'projects',
    defaultTitle: 'Proyecto aprobado',
    buildActionUrl: (d) => projectUrl(d),
  },
  [NotificationType.PROJECT_REJECTED]: {
    icon: 'block', tone: 'danger', category: 'projects',
    defaultTitle: 'Proyecto rechazado',
    buildActionUrl: (d) => projectUrl(d),
  },
  [NotificationType.PROJECT_NEEDS_CHANGES]: {
    icon: 'edit_note', tone: 'warning', category: 'projects',
    defaultTitle: 'Proyecto requiere cambios',
    buildActionUrl: (d) => projectUrl(d),
  },

  // ─── Asignación de supervisores ───────────────────────────────────────────
  [NotificationType.SUPERVISOR_ASSIGNED]: {
    icon: 'person_add', tone: 'info', category: 'academic',
    defaultTitle: 'Nueva asignación',
    buildActionUrl: (d) => workspaceUrl(d) ?? '/my-students',
  },
  [NotificationType.SUPERVISOR_ACCEPTED]: {
    icon: 'how_to_reg', tone: 'success', category: 'academic',
    defaultTitle: 'Asignación aceptada',
    buildActionUrl: (d) => workspaceUrl(d),
  },
  [NotificationType.SUPERVISOR_DECLINED]: {
    icon: 'person_off', tone: 'warning', category: 'academic',
    defaultTitle: 'Asignación declinada',
    buildActionUrl: (d) => workspaceUrl(d),
  },
  [NotificationType.SUPERVISOR_REPLACED]: {
    icon: 'swap_horiz', tone: 'info', category: 'academic',
    defaultTitle: 'Asignación reemplazada',
    buildActionUrl: (d) => workspaceUrl(d),
  },

  // ─── Anteproyecto ─────────────────────────────────────────────────────────
  [NotificationType.ANTEPROYECTO_SUBMITTED]: {
    icon: 'menu_book', tone: 'info', category: 'academic',
    defaultTitle: 'Anteproyecto entregado',
    buildActionUrl: (d) => workspaceUrl(d, { tab: 'academic', anchor: 'anteproyecto' }),
  },
  [NotificationType.ANTEPROYECTO_CORRECTION_REQUESTED]: {
    icon: 'edit_document', tone: 'warning', category: 'academic',
    defaultTitle: 'Corrección solicitada',
    buildActionUrl: (d) => workspaceUrl(d, { tab: 'academic', anchor: 'anteproyecto' }),
  },
  [NotificationType.ANTEPROYECTO_APPROVED]: {
    icon: 'task_alt', tone: 'success', category: 'academic',
    defaultTitle: 'Anteproyecto aprobado',
    buildActionUrl: (d) => workspaceUrl(d, { tab: 'academic', anchor: 'anteproyecto' }),
  },
  [NotificationType.ANTEPROYECTO_REJECTED]: {
    icon: 'do_not_disturb', tone: 'danger', category: 'academic',
    defaultTitle: 'Anteproyecto rechazado',
    buildActionUrl: (d) => workspaceUrl(d, { tab: 'academic', anchor: 'anteproyecto' }),
  },

  // ─── Ciclo académico ──────────────────────────────────────────────────────
  [NotificationType.AGREEMENT_UPLOADED]: {
    icon: 'gavel', tone: 'success', category: 'academic',
    defaultTitle: 'Acuerdo de iniciación cargado',
    buildActionUrl: (d) => workspaceUrl(d, { tab: 'academic', anchor: 'agreement' }),
  },
  [NotificationType.FINALIZATION_STARTED]: {
    icon: 'flag', tone: 'info', category: 'academic',
    defaultTitle: 'Finalización iniciada',
    buildActionUrl: (d) => workspaceUrl(d, { tab: 'academic', anchor: 'finalization' }),
  },
  [NotificationType.PROGRESS_NEAR_COMPLETION]: {
    icon: 'hourglass_bottom', tone: 'warning', category: 'academic',
    defaultTitle: 'Proyecto cerca de completarse',
    buildActionUrl: (d) => workspaceUrl(d),
  },
  [NotificationType.ACADEMIC_COMPLETED]: {
    icon: 'workspace_premium', tone: 'success', category: 'academic',
    defaultTitle: 'Proceso académico completado',
    buildActionUrl: (d) => workspaceUrl(d),
  },
  [NotificationType.DEADLINE_EXTENDED]: {
    icon: 'update', tone: 'info', category: 'academic',
    defaultTitle: 'Plazo extendido',
    buildActionUrl: (d) => workspaceUrl(d),
  },

  // ─── Cuenta ────────────────────────────────────────────────────────────────
  [NotificationType.EMAIL_VERIFICATION_REQUESTED]: {
    icon: 'mark_email_read', tone: 'info', category: 'system',
    defaultTitle: 'Verifica tu correo electrónico',
    buildActionUrl: () => null,
  },
  [NotificationType.PASSWORD_RESET_REQUESTED]: {
    icon: 'lock_reset', tone: 'warning', category: 'system',
    defaultTitle: 'Restablece tu contraseña',
    buildActionUrl: () => null,
  },
};

export function notificationConfig(type: NotificationType): NotificationConfig {
  return NOTIFICATION_REGISTRY[type] ?? {
    icon: 'notifications',
    tone: 'neutral',
    category: 'system',
    defaultTitle: 'Notificación',
    buildActionUrl: () => null,
  };
}

/** Devuelve el color CSS para un tono, basado en tokens Material. */
export function toneColor(tone: NotificationTone): { bg: string; color: string } {
  switch (tone) {
    case 'success': return { bg: '#d1fae5', color: '#065f46' };
    case 'warning': return { bg: '#fef3c7', color: '#92400e' };
    case 'danger': return { bg: '#fee2e2', color: '#991b1b' };
    case 'info': return { bg: '#dbeafe', color: '#1e40af' };
    case 'neutral':
    default: return { bg: '#f3f4f6', color: '#6b7280' };
  }
}

export const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  applications: 'Postulaciones',
  academic: 'Académico',
  chat: 'Mensajes',
  evaluations: 'Evaluaciones',
  system: 'Sistema',
  projects: 'Proyectos',
};

export const CATEGORY_ICONS: Record<NotificationCategory, string> = {
  applications: 'assignment',
  academic: 'school',
  chat: 'chat',
  evaluations: 'rate_review',
  system: 'campaign',
  projects: 'work',
};
