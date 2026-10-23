import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { Subject, of } from 'rxjs';

import { ProjectChatPanelComponent } from './project-chat-panel.component';
import { ChatService } from '../../../../features/chat/services/chat.service';
import { ChatRealtimeService } from '../../../../core/services/chat-realtime.service';
import { StorageService } from '../../../../core/services/storage.service';
import { ChatUnreadStore } from '../../../../state/chat-unread.store';
import { AuthStore } from '../../../../state/auth.store';
import { Conversation, ChatMessage } from '../../../../core/models';

describe('ProjectChatPanelComponent', () => {
  let fixture: ComponentFixture<ProjectChatPanelComponent>;
  let component: ProjectChatPanelComponent;
  let router: Router;
  let messageSubject: Subject<ChatMessage>;

  const mockUser = {
    id: 'user-me',
    email: 'estudiante@collabu.com',
    role: 'student' as any,
  };

  const mockConversation: Conversation = {
    id: 'conv-proj-1',
    type: 'project',
    name: 'Equipo de Desarrollo IA',
    projectId: 'proj-101',
    applicationId: 'app-501',
    participants: [
      {
        userId: 'user-me',
        displayName: 'Estudiante Dev',
        role: 'student' as any,
        isOnline: true,
      },
      {
        userId: 'user-company',
        displayName: 'Tutor Tech Corp',
        role: 'company' as any,
        isOnline: false,
      },
      {
        userId: 'user-faculty',
        displayName: 'Prof. Asesor',
        role: 'faculty' as any,
        isOnline: true,
      },
    ],
    unreadCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockChatService = {
    createConversation: vi.fn().mockReturnValue(of({ data: mockConversation })),
    getMessages: vi.fn().mockReturnValue(of({ data: [] })),
    markAsRead: vi.fn().mockReturnValue(of({ success: true })),
    sendMessage: vi.fn().mockImplementation((convId: string, content: string) =>
      of({
        data: {
          id: 'msg-real-1',
          conversationId: convId,
          senderId: 'user-me',
          senderName: 'Tú',
          content,
          createdAt: new Date().toISOString(),
        },
      }),
    ),
    sendMessageWithFiles: vi.fn().mockReturnValue(of({ data: null })),
  };

  const mockRealtimeService = {
    connectionStatus: signal<'connected' | 'connecting' | 'disconnected'>('connected'),
    joinConversation: vi.fn(),
    leaveConversation: vi.fn(),
    onMessage: () => messageSubject.asObservable(),
  };

  const mockUnreadStore = {
    clearConversation: vi.fn(),
  };

  const mockAuthStore = {
    user: signal(mockUser),
  };

  beforeEach(async () => {
    messageSubject = new Subject();

    await TestBed.configureTestingModule({
      imports: [ProjectChatPanelComponent],
      providers: [
        provideRouter([]),
        { provide: ChatService, useValue: mockChatService },
        { provide: ChatRealtimeService, useValue: mockRealtimeService },
        { provide: StorageService, useValue: { getPresignedUrl: vi.fn() } },
        { provide: ChatUnreadStore, useValue: mockUnreadStore },
        { provide: AuthStore, useValue: mockAuthStore },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(ProjectChatPanelComponent);
    fixture.componentRef.setInput('applicationId', 'app-501');
    fixture.componentRef.setInput('projectId', 'proj-101');
    fixture.componentRef.setInput('participantIds', ['user-me', 'user-company', 'user-faculty']);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse e inicializar la conversación del proyecto', () => {
    expect(component).toBeTruthy();
    expect(mockChatService.createConversation).toHaveBeenCalledWith(
      ['user-me', 'user-company', 'user-faculty'],
      'project',
      'proj-101',
      undefined,
      'app-501',
    );
    expect(component.conversationId()).toBe('conv-proj-1');
    expect(component.groupTitle()).toBe('Equipo de Desarrollo IA');
  });

  it('muestra la cantidad de participantes y estado de conexión en subtitleText', () => {
    expect(component.subtitleText()).toContain('3 participantes');
    expect(component.subtitleText()).toContain('En línea');
  });

  it('permite alternar el panel deslizable de información del grupo', () => {
    expect(component.showGroupInfo()).toBe(false);
    component.toggleGroupInfo();
    expect(component.showGroupInfo()).toBe(true);
    component.toggleGroupInfo();
    expect(component.showGroupInfo()).toBe(false);
  });

  it('permite alternar el selector de emojis y agregar emojis al borrador', () => {
    expect(component.showEmojiPicker()).toBe(false);
    component.toggleEmojiPicker();
    expect(component.showEmojiPicker()).toBe(true);

    component.draft = 'Hola ';
    component.onEmojiSelected('👋');
    expect(component.draft).toBe('Hola 👋');
  });

  it('permite adjuntar archivos y removerlos de la lista preparada', () => {
    const file1 = new File(['content'], 'avance1.pdf', { type: 'application/pdf' });
    const file2 = new File(['content'], 'foto.png', { type: 'image/png' });

    component.selectedFiles.set([file1, file2]);
    expect(component.selectedFiles().length).toBe(2);

    component.removeStagedFile(file1);
    expect(component.selectedFiles().length).toBe(1);
    expect(component.selectedFiles()[0].name).toBe('foto.png');
  });

  it('envía un mensaje optimista y llama a chatService.sendMessage', () => {
    component.draft = 'Reunión acordada a las 4pm';
    component.send();

    expect(mockChatService.sendMessage).toHaveBeenCalledWith(
      'conv-proj-1',
      'Reunión acordada a las 4pm',
    );
    expect(component.draft).toBe('');
  });

  it('navega a la vista de chat completo cuando se solicita openInFullChat', () => {
    component.openInFullChat();
    expect(router.navigate).toHaveBeenCalledWith(['/chat', 'conv-proj-1']);
  });
});
