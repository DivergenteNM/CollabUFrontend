import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { Subject, of } from 'rxjs';

import { ChatRoomComponent } from './chat-room.component';
import { ChatRealtimeService } from '../../../../core/services/chat-realtime.service';
import { ChatService } from '../../services/chat.service';
import { UserProfileService } from '../../../../core/services/user-profile.service';
import { ProjectService } from '../../../projects/services/project.service';
import { MatSnackBar } from '@angular/material/snack-bar';

/**
 * Regresión de UX (hallazgo H7, pruebas con usuarios finales — rol
 * Estudiante): un mensaje enviado por WebSocket que el servidor nunca
 * confirma quedaba mostrando el ícono de "enviando" indefinidamente, sin
 * ninguna señal de error — reportado como "bugs" en el chat. No se modifica
 * el transporte ni el protocolo: solo se hace visible un estado que antes
 * era indistinguible de "colgado", y se ofrece reintentar.
 */
describe('ChatRoomComponent — confirmación de mensajes', () => {
  let component: ChatRoomComponent;
  let messages$: Subject<any>;
  let sendMessageSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    // jsdom no implementa matchMedia — UiStore (inyectado por ChatRoomComponent
    const win = typeof window !== 'undefined' ? window : (globalThis as any).window;
    if (win) {
      win.matchMedia = win.matchMedia ?? (() => ({
        matches: false, media: '', onchange: null,
        addListener: () => {}, removeListener: () => {},
        addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false,
      }) as unknown as MediaQueryList);
    }

    messages$ = new Subject();
    sendMessageSpy = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ChatRealtimeService,
          useValue: {
            connectionStatus: signal('connected'),
            joinConversation: vi.fn(),
            leaveConversation: vi.fn(),
            markAsRead: vi.fn(),
            sendMessage: sendMessageSpy,
            sendTyping: vi.fn(),
            onMessage: () => messages$.asObservable(),
            onTyping: () => new Subject().asObservable(),
            onUserStatus: () => new Subject().asObservable(),
          },
        },
        { provide: ChatService, useValue: { getConversations: () => of({ data: [] }) } },
        { provide: UserProfileService, useValue: { getProfileById: () => of({ data: null }) } },
        { provide: ProjectService, useValue: { getById: () => of({ data: null }) } },
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
      ],
    });

    const fixture = TestBed.createComponent(ChatRoomComponent);
    fixture.componentRef.setInput('conversationId', 'conv-1');
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('marca el mensaje como fallido si el servidor nunca lo confirma dentro del tiempo de espera', () => {
    (component as any).messageText.set('hola');
    component.sendMessage();

    const tempId = [...(component as any).pendingMessageIds() as Set<string>][0];
    expect(component.isSending(tempId)).toBe(true);
    expect(component.isFailed(tempId)).toBe(false);

    vi.advanceTimersByTime(10000);

    expect(component.isFailed(tempId)).toBe(true);
  });

  it('no marca como fallido un mensaje confirmado a tiempo por el servidor', () => {
    (component as any).messageText.set('hola');
    component.sendMessage();
    const tempId = [...(component as any).pendingMessageIds() as Set<string>][0];

    messages$.next({
      id: 'real-1', conversationId: 'conv-1', senderId: '', content: 'hola',
      messageType: 'text', isRead: false, createdAt: new Date().toISOString(),
    });

    vi.advanceTimersByTime(10000);

    expect(component.isFailed(tempId)).toBe(false);
  });

  it('retryMessage() reenvía el contenido y limpia el estado de fallo', () => {
    (component as any).messageText.set('hola');
    component.sendMessage();
    const tempId = [...(component as any).pendingMessageIds() as Set<string>][0];
    vi.advanceTimersByTime(10000);
    expect(component.isFailed(tempId)).toBe(true);

    sendMessageSpy.mockClear();
    component.retryMessage(tempId);

    expect(component.isFailed(tempId)).toBe(false);
    expect(sendMessageSpy).toHaveBeenCalledWith('conv-1', 'hola');
  });

  it('permite alternar el selector de emojis e insertar un emoji', () => {
    expect(component.showEmojiPicker()).toBe(false);
    component.toggleEmojiPicker();
    expect(component.showEmojiPicker()).toBe(true);

    component.messageText.set('Hola');
    component.onEmojiSelected('👋');
    expect(component.messageText()).toContain('👋');
  });

  it('permite abrir y cerrar el panel de información del contacto', () => {
    expect(component.showContactInfo()).toBe(false);
    component.openContactInfo();
    expect(component.showContactInfo()).toBe(true);

    component.closeContactInfo();
    expect(component.showContactInfo()).toBe(false);
  });

  it('muestra retroalimentación informativa al presionar llamadas de voz o video', () => {
    const spy = vi.spyOn((component as any).snackBar, 'open');
    component.onCallClick('audio');
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('Llamadas de voz'),
      'Entendido',
      expect.any(Object),
    );
  });
});
