import { Conversation, ConversationParticipant } from '../../../core/models';

/**
 * Nombres y agrupación de conversaciones para la vista de chat.
 *
 * Hallazgo de usabilidad (pedido directo del usuario, no de la encuesta):
 * una conversación directa vinculada a un proyecto (el caso más frecuente —
 * estudiante escribiéndole a una empresa por una vacante puntual) mostraba
 * como nombre principal a la otra persona, nunca el proyecto. El estudiante
 * o la empresa terminan con varias conversaciones con el mismo interlocutor
 * (una por cada proyecto) e indistinguibles entre sí. Centralizar la lógica
 * aquí evita que la lista de conversaciones y la sala de chat calculen el
 * nombre de forma distinta.
 *
 * Nota importante: `ConversationParticipant.role` es el rol de membresía
 * dentro del chat (`member`/`admin`, ver `chat-service`), no el rol de la
 * plataforma (estudiante/empresa/docente). No se usa para etiquetar quién es
 * la otra persona — mostrarlo llevaría a algo como "Carlos Gómez · member",
 * incorrecto y confuso.
 */

export function isGroupConversation(conv: Pick<Conversation, 'type'>): boolean {
  const type = conv.type ?? 'direct';
  return type === 'group' || type === 'project';
}

export function getOtherParticipant(
  conv: Pick<Conversation, 'participants'>,
  currentUserId: string,
): ConversationParticipant | undefined {
  return conv.participants?.find((p) => p.userId !== currentUserId) ?? conv.participants?.[0];
}

/**
 * Título principal de la conversación.
 * - Grupal (`group`/`project` con varios participantes): el nombre del grupo,
 *   o si no tiene, el título del proyecto vinculado, o los nombres de los
 *   participantes como último recurso.
 * - Directa vinculada a un proyecto: el título del proyecto — es lo que
 *   realmente identifica de qué trata la conversación para quien la mira.
 * - Directa sin proyecto: el nombre de la otra persona (comportamiento previo).
 */
export function getConversationTitle(
  conv: Conversation,
  currentUserId: string,
  projectTitle?: string | null,
): string {
  if (isGroupConversation(conv)) {
    const name = conv.name?.trim();
    if (name) return name;
    if (projectTitle) return projectTitle;
    const others = (conv.participants ?? []).filter((p) => p.userId !== currentUserId);
    return others.map((p) => p.displayName).join(', ') || 'Grupo';
  }
  if (conv.projectId && projectTitle) return projectTitle;
  return getOtherParticipant(conv, currentUserId)?.displayName ?? 'Sin nombre';
}

/**
 * Línea secundaria: quién es la conversación, una vez que el título principal
 * ya no lo dice por sí solo (porque ahora puede ser el nombre de un proyecto).
 * - Directa con proyecto: nombre de la otra persona.
 * - Grupal: cantidad de participantes.
 * - Directa sin proyecto: sin línea secundaria (el título ya es la persona).
 */
export function getConversationSubtitle(conv: Conversation, currentUserId: string): string {
  if (isGroupConversation(conv)) {
    const count = conv.participants?.length ?? 0;
    return `${count} participante${count === 1 ? '' : 's'}`;
  }
  if (conv.projectId) {
    return getOtherParticipant(conv, currentUserId)?.displayName ?? '';
  }
  return '';
}
