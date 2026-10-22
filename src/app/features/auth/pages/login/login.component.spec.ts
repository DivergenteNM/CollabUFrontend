import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NEVER } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../../core/services/auth.service';
import { AuthStore } from '../../../../state/auth.store';

describe('LoginComponent', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { login: () => NEVER } },
        { provide: AuthStore, useValue: { setAuth: vi.fn() } },
      ],
    });
  });

  afterEach(() => vi.useRealTimers());

  it('libera el formulario y avisa si el servidor no responde en 10 s', () => {
    const component = TestBed.createComponent(LoginComponent).componentInstance;
    component.form.setValue({ email: 'estudiante@collabu.dev', password: 'CollabU2026!', rememberMe: false });

    component.onSubmit();
    expect(component.isSubmitting()).toBe(true);

    vi.advanceTimersByTime(9_999);
    expect(component.isSubmitting()).toBe(true);

    vi.advanceTimersByTime(1);
    expect(component.isSubmitting()).toBe(false);
    expect(component.errorMessage()).toContain('tardó demasiado');
  });
});
