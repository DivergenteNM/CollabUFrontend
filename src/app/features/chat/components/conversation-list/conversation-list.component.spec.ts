import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ConversationListComponent } from './conversation-list.component';
import { Conversation } from '../../../../core/models';
import { UserRole } from '../../../../core/enums';

const CURRENT_USER = 'user-1';

const directWithProject: Conversation = {
  id: 'conv-1', type: 'direct', projectId: 'project-1',
  participants: [
    { userId: CURRENT_USER, displayName: 'Yo', role: UserRole.STUDENT, isOnline: true },
    { userId: 'user-2', displayName: 'Tech Corp', role: UserRole.COMPANY, isOnline: false },
  ],
  unreadCount: 0, createdAt: '', updatedAt: '',
};

const groupConv: Conversation = {
  id: 'conv-2', type: 'group', name: 'Comité de anteproyecto',
  participants: [
    { userId: CURRENT_USER, displayName: 'Yo', role: UserRole.STUDENT, isOnline: true },
    { userId: 'user-3', displayName: 'Asesor Pérez', role: UserRole.FACULTY, isOnline: false },
  ],
  unreadCount: 2, createdAt: '', updatedAt: '',
};

describe('ConversationListComponent — agrupación por secciones', () => {
  let component: ConversationListComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ConversationListComponent],
      providers: [provideAnimationsAsync()],
    });
    const fixture = TestBed.createComponent(ConversationListComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('conversations', [directWithProject, groupConv]);
    fixture.componentRef.setInput('currentUserId', CURRENT_USER);
    fixture.componentRef.setInput('projectTitles', new Map([['project-1', 'Motor de Recomendación con IA']]));
    fixture.detectChanges();
  });

  it('separa las conversaciones directas de las grupales en dos listas distintas', () => {
    expect(component.individualConversations()).toEqual([directWithProject]);
    expect(component.groupConversations()).toEqual([groupConv]);
  });

  it('muestra el título del proyecto para la conversación directa vinculada a él', () => {
    expect(component.title(directWithProject)).toBe('Motor de Recomendación con IA');
  });

  it('muestra el nombre del grupo para la conversación grupal', () => {
    expect(component.title(groupConv)).toBe('Comité de anteproyecto');
    expect(component.isGroup(groupConv)).toBe(true);
    expect(component.isGroup(directWithProject)).toBe(false);
  });
});
