import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { ApplicationService } from '../../applications/services/application.service';

/**
 * `anteproyecto` se agregó aquí porque el alcance pre-desarrollo se extendió
 * explícitamente hasta la aceptación del anteproyecto (Bloque 18) — antes
 * llegar a esta etapa mandaba al `DevelopmentWorkspace`. El corte real queda
 * en `documents`/`agreement` (que sí quedan en el workspace de desarrollo,
 * sin tocar) porque solo se alcanzan después de que el anteproyecto ya fue
 * aceptado por todos los jurados asignados.
 */
const PRE_DEVELOPMENT_STAGES = new Set(['application', 'selection', 'academic_assignment', 'anteproyecto']);

/**
 * `/workspace/:applicationId` sigue siendo la vista de proyecto en desarrollo
 * (anteproyecto → finalización, sin tocar). Antes de que el proyecto inicie
 * (aplicación, selección, esperando asesor) la experiencia es otra —
 * `SelectionWorkspaceComponent` — así que este guard redirige según la etapa
 * real que devuelve `getContext`, sin duplicar esa lógica en el componente.
 */
export const developmentStageGuard: CanActivateFn = (route) => {
  const applicationService = inject(ApplicationService);
  const router = inject(Router);
  const id = route.paramMap.get('applicationId')!;

  return applicationService.getContext(id).pipe(
    map((ctx) => {
      if (PRE_DEVELOPMENT_STAGES.has(ctx.stage.current)) {
        return router.parseUrl(`/selection/${id}`);
      }
      return true;
    }),
    catchError(() => of(true)), // deja que el componente destino muestre su propio error
  );
};

/**
 * `/my-students/:applicationId` (`StudentSupervisionComponent`) quedó huérfana:
 * auditoría confirmó que ningún link, dashboard ni deep-link de notificación
 * navega ahí — todo apunta a `/workspace/:id`. Se deja el componente en disco
 * (por si algún bookmark viejo o integración externa la referencia) pero la
 * ruta redirige siempre a `/workspace/:id`, que ya cascada correctamente a
 * `/selection/:id` cuando la etapa es pre-desarrollo. Un solo salto, sin loop:
 * el guard de `/workspace` nunca redirige de vuelta a `/my-students`.
 */
export const legacySupervisionRedirectGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const id = route.paramMap.get('applicationId')!;
  return router.parseUrl(`/workspace/${id}`);
};

/** Inverso: si el proyecto ya inició, `/selection/:id` reenvía al workspace de desarrollo. */
export const selectionStageGuard: CanActivateFn = (route) => {
  const applicationService = inject(ApplicationService);
  const router = inject(Router);
  const id = route.paramMap.get('applicationId')!;

  return applicationService.getContext(id).pipe(
    map((ctx) => {
      if (!PRE_DEVELOPMENT_STAGES.has(ctx.stage.current)) {
        return router.parseUrl(`/workspace/${id}`);
      }
      return true;
    }),
    catchError(() => of(true)),
  );
};
