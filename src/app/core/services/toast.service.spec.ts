import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ToastService } from './toast.service';

// `providedIn: 'root'` en MatSnackBar no se sobreescribe de forma fiable vía
// `providers` en configureTestingModule bajo el unit-test builder de Angular 21 +
// Vitest — overrideProvider sí fuerza el reemplazo (ver deliverable-card.component.spec.ts).
describe('ToastService', () => {
  let service: ToastService;
  let snackBarMock: { open: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    snackBarMock = { open: vi.fn() };
    TestBed.configureTestingModule({}).overrideProvider(MatSnackBar, { useValue: snackBarMock });
    service = TestBed.inject(ToastService);
  });

  it('success abre un snackbar con panelClass toast-success y duración 4000ms', () => {
    service.success('Guardado con éxito');

    expect(snackBarMock.open).toHaveBeenCalledWith(
      'Guardado con éxito',
      '✕',
      expect.objectContaining({ duration: 4000, panelClass: 'toast-success' }),
    );
  });

  it('error abre un snackbar con panelClass toast-error y duración 6000ms', () => {
    service.error('Ocurrió un error');

    expect(snackBarMock.open).toHaveBeenCalledWith(
      'Ocurrió un error',
      '✕',
      expect.objectContaining({ duration: 6000, panelClass: 'toast-error' }),
    );
  });

  it('warning abre un snackbar con panelClass toast-warning y duración 5000ms', () => {
    service.warning('Cuidado');

    expect(snackBarMock.open).toHaveBeenCalledWith(
      'Cuidado',
      '✕',
      expect.objectContaining({ duration: 5000, panelClass: 'toast-warning' }),
    );
  });

  it('info abre un snackbar con panelClass toast-info y duración 4000ms', () => {
    service.info('Nota informativa');

    expect(snackBarMock.open).toHaveBeenCalledWith(
      'Nota informativa',
      '✕',
      expect.objectContaining({ duration: 4000, panelClass: 'toast-info' }),
    );
  });
});
