import { Injectable, inject } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { Socket } from 'socket.io-client';
import { WebSocketService } from './websocket.service';
import { TokenService } from './token.service';
import { ChatMessage } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ChatRealtimeService {
  private socket: Socket | null = null;
  private messages$ = new Subject<ChatMessage>();
  private typing$ = new Subject<{ conversationId: string; userId: string; isTyping: boolean }>();
  private userStatus$ = new Subject<{ userId: string; isOnline: boolean }>();

  private readonly wsService = inject(WebSocketService);
  private readonly tokenService = inject(TokenService);

  connect(): void {
    const token = this.tokenService.getAccessToken();
    if (!token) return;

    this.socket = this.wsService.connect(environment.wsChatPath, token);

    this.socket.on('message', (msg: ChatMessage) => this.messages$.next(msg));
    this.socket.on('typing', (data: { conversationId: string; userId: string; isTyping: boolean }) => this.typing$.next(data));
    this.socket.on('user_status', (data: { userId: string; isOnline: boolean }) => this.userStatus$.next(data));
  }

  joinConversation(conversationId: string): void {
    this.socket?.emit('join', { conversationId });
  }

  leaveConversation(conversationId: string): void {
    this.socket?.emit('leave', { conversationId });
  }

  sendMessage(conversationId: string, content: string): void {
    this.socket?.emit('message', { conversationId, content });
  }

  sendTyping(conversationId: string, isTyping: boolean): void {
    this.socket?.emit('typing', { conversationId, isTyping });
  }

  markAsRead(conversationId: string): void {
    this.socket?.emit('read', { conversationId });
  }

  onMessage(): Observable<ChatMessage> {
    return this.messages$.asObservable();
  }

  onTyping(): Observable<{ conversationId: string; userId: string; isTyping: boolean }> {
    return this.typing$.asObservable();
  }

  onUserStatus(): Observable<{ userId: string; isOnline: boolean }> {
    return this.userStatus$.asObservable();
  }

  disconnect(): void {
    this.wsService.disconnect(environment.wsChatPath);
    this.socket = null;
  }
}
