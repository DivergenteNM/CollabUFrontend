import { TestBed } from '@angular/core/testing';
import { inject } from '@angular/core';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { errorInterceptor } from './error.interceptor';
import { AuthStore } from '../../state/auth.store';
import { AuthService } from '../services/auth.service';

describe('errorInterceptor', () => {
  const snackBar = { open: vi.fn() };
  const store = { updateTokens: vi.fn(), clearAuth: vi.fn() };

  function configure(authStoreFactory: () => unknown) {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: MatSnackBar, useValue: snackBar },
        { provide: AuthService, useValue: { refreshToken: vi.fn() } },
        { provide: AuthStore, useFactory: authStoreFactory },
      ],
    });
  }

  beforeEach(() => {
    snackBar.open.mockClear();
    store.clearAuth.mockClear();
  });

  it('no genera una dependencia circular si el AuthStore hace una petición al construirse (recarga con sesión)', () => {
    let constructed = false;
    configure(() => {
      // Igual que el store real: al construirse carga el perfil, y esa petición pasa por el interceptor.
      inject(HttpClient).get('/api/perfil').subscribe({ error: () => undefined });
      constructed = true;
      return store;
    });

    expect(() => TestBed.inject(AuthStore)).not.toThrow();
    expect(constructed).toBe(true);
    TestBed.inject(HttpTestingController).expectOne('/api/perfil').flush('x', { status: 404, statusText: 'No encontrado' });
  });

  it('un 401 en el refresh limpia la sesión usando el store', () => {
    configure(() => store);
    TestBed.inject(HttpClient).post('/api/v1/auth/refresh', {}).subscribe({ error: () => undefined });
    TestBed.inject(HttpTestingController).expectOne('/api/v1/auth/refresh').flush('x', { status: 401, statusText: 'No autorizado' });

    expect(store.clearAuth).toHaveBeenCalled();
  });

  it('un 502 avisa «Error del servidor» sin cerrar la sesión', () => {
    configure(() => store);
    TestBed.inject(HttpClient).get('/api/x').subscribe({ error: () => undefined });
    TestBed.inject(HttpTestingController).expectOne('/api/x').flush('x', { status: 502, statusText: 'Bad Gateway' });

    expect(snackBar.open).toHaveBeenCalledWith('Error del servidor. Intenta de nuevo más tarde.', 'Cerrar', expect.anything());
    expect(store.clearAuth).not.toHaveBeenCalled();
  });
});
