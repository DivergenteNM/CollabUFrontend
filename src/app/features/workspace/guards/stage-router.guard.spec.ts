import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, convertToParamMap } from '@angular/router';
import { firstValueFrom, isObservable, of, throwError } from 'rxjs';

import { developmentStageGuard, legacySupervisionRedirectGuard, selectionStageGuard } from './stage-router.guard';
import { ApplicationService, ProjectContext } from '../../applications/services/application.service';

const APP_ID = 'app-uuid-1';

function makeRoute(): ActivatedRouteSnapshot {
  return { paramMap: convertToParamMap({ applicationId: APP_ID }) } as ActivatedRouteSnapshot;
}

function makeContext(stage: string): ProjectContext {
  return { stage: { current: stage, completed: [], waitingOn: null } } as unknown as ProjectContext;
}

async function runGuard(
  guard: (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => unknown,
) {
  const result = TestBed.runInInjectionContext(() => guard(makeRoute(), {} as RouterStateSnapshot));
  return isObservable(result) ? await firstValueFrom(result) : result;
}

describe('stage-router guards', () => {
  let mockApplicationService: { getContext: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockApplicationService = { getContext: vi.fn() };
    TestBed.configureTestingModule({
      providers: [{ provide: ApplicationService, useValue: mockApplicationService }],
    });
  });

  describe('developmentStageGuard', () => {
    it('redirige a /selection/:id cuando la etapa actual es pre-desarrollo (application)', async () => {
      mockApplicationService.getContext.mockReturnValue(of(makeContext('application')));

      const result = await runGuard(developmentStageGuard);

      expect(result instanceof UrlTree).toBe(true);
      expect((result as UrlTree).toString()).toBe(`/selection/${APP_ID}`);
    });

    it('redirige a /selection/:id cuando la etapa es anteproyecto (alcance pre-desarrollo extendido, Bloque 18)', async () => {
      mockApplicationService.getContext.mockReturnValue(of(makeContext('anteproyecto')));

      const result = await runGuard(developmentStageGuard);

      expect(result instanceof UrlTree).toBe(true);
      expect((result as UrlTree).toString()).toBe(`/selection/${APP_ID}`);
    });

    it('permite el acceso cuando la etapa ya es de desarrollo (documents)', async () => {
      mockApplicationService.getContext.mockReturnValue(of(makeContext('documents')));

      const result = await runGuard(developmentStageGuard);

      expect(result).toBe(true);
    });

    it('permite el acceso si getContext falla (deja que el componente destino muestre su propio error)', async () => {
      mockApplicationService.getContext.mockReturnValue(throwError(() => new Error('network error')));

      const result = await runGuard(developmentStageGuard);

      expect(result).toBe(true);
    });
  });

  describe('selectionStageGuard', () => {
    it('redirige a /workspace/:id cuando la etapa ya no es pre-desarrollo', async () => {
      mockApplicationService.getContext.mockReturnValue(of(makeContext('documents')));

      const result = await runGuard(selectionStageGuard);

      expect(result instanceof UrlTree).toBe(true);
      expect((result as UrlTree).toString()).toBe(`/workspace/${APP_ID}`);
    });

    it('permite el acceso mientras la etapa sigue siendo pre-desarrollo (selection)', async () => {
      mockApplicationService.getContext.mockReturnValue(of(makeContext('selection')));

      const result = await runGuard(selectionStageGuard);

      expect(result).toBe(true);
    });

    it('permite el acceso si getContext falla', async () => {
      mockApplicationService.getContext.mockReturnValue(throwError(() => new Error('network error')));

      const result = await runGuard(selectionStageGuard);

      expect(result).toBe(true);
    });
  });

  describe('legacySupervisionRedirectGuard', () => {
    it('siempre redirige a /workspace/:id (ruta huérfana de StudentSupervisionComponent)', async () => {
      const result = await runGuard(legacySupervisionRedirectGuard);

      expect(result instanceof UrlTree).toBe(true);
      expect((result as UrlTree).toString()).toBe(`/workspace/${APP_ID}`);
    });
  });
});
