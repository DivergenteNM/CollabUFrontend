import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';

import { WebSocketService } from './websocket.service';

// No se puede usar `vi.mock('socket.io-client', ...)` — el unit-test builder de
// Angular 21 + Vitest lo rechaza explícitamente ("not supported... use Angular
// TestBed for mocking"). En su lugar se usan instancias reales de `Socket`
// (io() las crea síncronamente sin esperar la conexión) y se verifica su
// propiedad pública `.auth`, identidad de instancia, y se desconecta cada una
// al final de cada test para no dejar intentos de reconexión colgando.
describe('WebSocketService', () => {
  let service: WebSocketService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WebSocketService);
  });

  afterEach(() => {
    service.disconnectAll();
  });

  it('crea un socket con el token de auth para un path no conectado', () => {
    const socket = service.connect('/ws/notifications', 'jwt-token');

    expect(socket.auth).toEqual({ token: 'jwt-token' });
  });

  it('reutiliza el mismo socket para el mismo path (no reconecta)', () => {
    const first = service.connect('/ws/chat', 'jwt-token');
    const second = service.connect('/ws/chat', 'jwt-token');

    expect(second).toBe(first);
  });

  it('crea sockets independientes para paths distintos', () => {
    const a = service.connect('/ws/notifications', 'jwt-token');
    const b = service.connect('/ws/chat', 'jwt-token');

    expect(a).not.toBe(b);
  });

  it('disconnect cierra y olvida el socket del path (una reconexión posterior crea uno nuevo)', () => {
    const socket = service.connect('/ws/chat', 'jwt-token');

    service.disconnect('/ws/chat');
    expect(socket.connected).toBe(false);

    const reconnected = service.connect('/ws/chat', 'jwt-token');
    expect(reconnected).not.toBe(socket);
  });

  it('disconnect en un path sin socket conectado no lanza error', () => {
    expect(() => service.disconnect('/ws/inexistente')).not.toThrow();
  });

  it('disconnectAll cierra todos los sockets abiertos y limpia el registro (siguiente connect crea uno nuevo)', () => {
    const a = service.connect('/ws/notifications', 'jwt-token');
    const b = service.connect('/ws/chat', 'jwt-token');

    service.disconnectAll();

    expect(a.connected).toBe(false);
    expect(b.connected).toBe(false);

    const reconnected = service.connect('/ws/chat', 'jwt-token');
    expect(reconnected).not.toBe(b);
  });
});
