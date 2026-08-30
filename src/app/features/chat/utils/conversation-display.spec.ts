import { describe, it, expect } from 'vitest';
import { Conversation } from '../../../core/models';
import { UserRole } from '../../../core/enums';
import {
  getConversationTitle, getConversationSubtitle, isGroupConversation,
} from './conversation-display';

const CURRENT_USER = 'user-1';

function directConversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: 'conv-1',
    type: 'direct',
    participants: [
      { userId: CURRENT_USER, displayName: 'Yo', role: UserRole.STUDENT, isOnline: true },
      { userId: 'user-2', displayName: 'Tech Corp', role: UserRole.COMPANY, isOnline: false },
    ],
    unreadCount: 0,
    createdAt: '', updatedAt: '',
    ...overrides,
  };
}

function groupConversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: 'conv-2',
    type: 'group',
    participants: [
      { userId: CURRENT_USER, displayName: 'Yo', role: UserRole.STUDENT, isOnline: true },
      { userId: 'user-2', displayName: 'Asesor Pérez', role: UserRole.FACULTY, isOnline: false },
      { userId: 'user-3', displayName: 'Jurado López', role: UserRole.FACULTY, isOnline: false },
    ],
    unreadCount: 0,
    createdAt: '', updatedAt: '',
    ...overrides,
  };
}

describe('conversation-display', () => {
  describe('isGroupConversation', () => {
    it('considera "direct" como no grupal', () => {
      expect(isGroupConversation({ type: 'direct' })).toBe(false);
    });
    it('considera "group" como grupal', () => {
      expect(isGroupConversation({ type: 'group' })).toBe(true);
    });
    it('considera "project" como grupal', () => {
      expect(isGroupConversation({ type: 'project' })).toBe(true);
    });
    it('sin type definido, asume "direct" (no grupal) por compatibilidad con datos antiguos', () => {
      expect(isGroupConversation({ type: undefined })).toBe(false);
    });
  });

  describe('getConversationTitle', () => {
    it('usa el título del proyecto como nombre principal en una conversación directa vinculada a un proyecto', () => {
      const conv = directConversation({ projectId: 'project-1' });
      expect(getConversationTitle(conv, CURRENT_USER, 'Motor de Recomendación con IA'))
        .toBe('Motor de Recomendación con IA');
    });

    it('cae al nombre de la otra persona si la conversación directa no tiene proyecto vinculado', () => {
      const conv = directConversation();
      expect(getConversationTitle(conv, CURRENT_USER)).toBe('Tech Corp');
    });

    it('cae al nombre de la otra persona si tiene proyecto pero el título aún no se resolvió', () => {
      const conv = directConversation({ projectId: 'project-1' });
      expect(getConversationTitle(conv, CURRENT_USER)).toBe('Tech Corp');
    });

    it('en un grupo usa el nombre del grupo si existe', () => {
      const conv = groupConversation({ name: 'Comité de anteproyecto' });
      expect(getConversationTitle(conv, CURRENT_USER)).toBe('Comité de anteproyecto');
    });

    it('en un grupo sin nombre, cae a unir los nombres de los demás participantes', () => {
      const conv = groupConversation({ name: undefined });
      expect(getConversationTitle(conv, CURRENT_USER)).toBe('Asesor Pérez, Jurado López');
    });
  });

  describe('getConversationSubtitle', () => {
    it('en una conversación directa con proyecto, muestra el nombre de la otra persona (no su rol de membresía del chat, que no es el rol de la plataforma)', () => {
      const conv = directConversation({ projectId: 'project-1' });
      expect(getConversationSubtitle(conv, CURRENT_USER)).toBe('Tech Corp');
    });

    it('en una conversación directa sin proyecto, no hay línea secundaria (el título ya es la persona)', () => {
      const conv = directConversation();
      expect(getConversationSubtitle(conv, CURRENT_USER)).toBe('');
    });

    it('en un grupo, muestra la cantidad de participantes', () => {
      const conv = groupConversation();
      expect(getConversationSubtitle(conv, CURRENT_USER)).toBe('3 participantes');
    });
  });
});
