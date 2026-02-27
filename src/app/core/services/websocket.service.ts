import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private sockets = new Map<string, Socket>();

  connect(path: string, token: string): Socket {
    if (this.sockets.has(path)) {
      return this.sockets.get(path)!;
    }

    const socket = io(environment.wsUrl, {
      path,
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => console.log(`WS conectado: ${path}`));
    socket.on('disconnect', (reason) => console.log(`WS desconectado: ${path} - ${reason}`));
    socket.on('connect_error', (err) => console.error(`WS error: ${path}`, err.message));

    this.sockets.set(path, socket);
    return socket;
  }

  disconnect(path: string): void {
    const socket = this.sockets.get(path);
    if (socket) {
      socket.disconnect();
      this.sockets.delete(path);
    }
  }

  disconnectAll(): void {
    this.sockets.forEach(socket => socket.disconnect());
    this.sockets.clear();
  }
}
