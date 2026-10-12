import {
  signalStore, withState, withMethods, withComputed, withHooks, patchState,
} from '@ngrx/signals';
import { inject, computed, PLATFORM_ID, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Application } from '../core/models';
import { ApplicationStatus } from '../core/enums';
import { ApplicationService } from '../features/applications/services/application.service';
import { AuthStore } from './auth.store';
import { resolveApplicationPhase, PhaseResolutionResult } from '../features/applications/utils/application-phases.utils';

export const ACTIVE_PROJECT_STATUSES: ApplicationStatus[] = [
  ApplicationStatus.ACCEPTED,
  ApplicationStatus.PENDING_SUPERVISOR,
  ApplicationStatus.IN_PROGRESS,
];

export interface StudentProjectState {
  applications: Application[];
  loading: boolean;
  loaded: boolean;
}

const initialState: StudentProjectState = {
  applications: [],
  loading: false,
  loaded: false,
};

export const StudentProjectStore = signalStore(
  { providedIn: 'root' },
  withState<StudentProjectState>(initialState),

  withComputed((store) => {
    const activeApplication = computed<Application | null>(() => {
      const apps = store.applications();
      return apps.find((app) => ACTIVE_PROJECT_STATUSES.includes(app.status)) ?? null;
    });

    const activeProject = computed(() => activeApplication()?.project ?? null);

    return {
      activeApplication,
      hasActiveProject: computed(() => !!activeApplication()),
      activeProject,
      activeProjectTitle: computed(() => {
        const app = activeApplication();
        return app?.project?.title || app?.projectTitle || 'Mi Proyecto Asignado';
      }),
      activeCompanyName: computed(() => {
        const app = activeApplication();
        return app?.companyName || app?.project?.companyName || 'Empresa Aliada';
      }),
      projectRoute: computed(() => {
        const app = activeApplication();
        return app ? `/workspace/${app.id}` : '/dashboard';
      }),
      phaseResolution: computed<PhaseResolutionResult | null>(() => {
        const app = activeApplication();
        if (!app) return null;
        const hasInterview = !!app.interviews?.some((i) => i.status === 'scheduled');
        return resolveApplicationPhase(app.status, hasInterview);
      }),
    };
  }),

  withMethods((store) => {
    const applicationService = inject(ApplicationService);

    const loadApplications = (): void => {
      patchState(store, { loading: true });
      applicationService.getMyApplications({ limit: 50 }).subscribe({
        next: (res) => {
          const apps = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? (res as any) : [];
          patchState(store, {
            applications: apps,
            loading: false,
            loaded: true,
          });
        },
        error: () => {
          patchState(store, { loading: false, loaded: true });
        },
      });
    };

    return {
      load(): void {
        loadApplications();
      },
      refresh(): void {
        loadApplications();
      },
      setApplications(applications: Application[]): void {
        patchState(store, { applications, loaded: true });
      },
      clear(): void {
        patchState(store, initialState);
      },
    };
  }),

  withHooks({
    onInit(store) {
      const platformId = inject(PLATFORM_ID);
      const authStore = inject(AuthStore);

      if (!isPlatformBrowser(platformId)) return;

      effect(() => {
        const isStudent = authStore.isStudent();
        const isAuth = authStore.isAuthenticated();
        if (isStudent && isAuth && !store.loaded() && !store.loading()) {
          store.load();
        } else if (!isAuth && store.loaded()) {
          store.clear();
        }
      });
    },
  })
);
