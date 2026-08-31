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
    // para el estado responsive) lo usa en un effect al arrancar.
    window.matchMedia = window.matchMedia ?? (() => ({
      matches: false, media: '', onchange: null,
      addListener: () => {}, removeListener: () => {},
      addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false,
    }) as unknown as MediaQueryList);

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
});
