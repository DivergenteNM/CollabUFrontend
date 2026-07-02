import {
  signalStore, withState, withMethods, withComputed, withHooks, patchState,
} from '@ngrx/signals';
import { inject, computed, effect, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

interface UiState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  loadingCount: number;
  breadcrumbs: { label: string; url?: string }[];
}

export const UiStore = signalStore(
  { providedIn: 'root' },
  withState<UiState>({
    sidebarOpen: true,
    theme: 'light',
    loadingCount: 0,
    breadcrumbs: [],
  }),

  withComputed((store) => {
    const breakpointObserver = inject(BreakpointObserver);
    const platformId = inject(PLATFORM_ID);

    const isMobile = isPlatformBrowser(platformId)
      ? toSignal(
          breakpointObserver.observe(['(max-width: 959px)']).pipe(
            map(result => result.matches)
          ),
          { initialValue: false }
        )
      : () => false;

    const isTablet = isPlatformBrowser(platformId)
      ? toSignal(
          breakpointObserver.observe(['(min-width: 960px) and (max-width: 1279px)']).pipe(
            map(result => result.matches)
          ),
          { initialValue: false }
        )
      : () => false;

    return {
      isLoading: computed(() => store.loadingCount() > 0),
      isMobile,
      isTablet,
      isDesktop: computed(() => !isMobile() && !isTablet()),
    };
  }),

  withMethods((store) => ({
    toggleSidebar(): void {
      patchState(store, { sidebarOpen: !store.sidebarOpen() });
    },
    setSidebarOpen(open: boolean): void {
      patchState(store, { sidebarOpen: open });
    },
    setTheme(theme: 'light' | 'dark' | 'system'): void {
      patchState(store, { theme });
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('collabu_theme', theme);
      }
    },
    incrementLoading(): void {
      patchState(store, { loadingCount: store.loadingCount() + 1 });
    },
    decrementLoading(): void {
      patchState(store, { loadingCount: Math.max(0, store.loadingCount() - 1) });
    },
    setBreadcrumbs(breadcrumbs: { label: string; url?: string }[]): void {
      patchState(store, { breadcrumbs });
    },
  })),

  withHooks({
    onInit(store) {
      const platformId = inject(PLATFORM_ID);
      if (!isPlatformBrowser(platformId)) return;

      const saved = localStorage.getItem('collabu_theme') as 'light' | 'dark' | 'system' | null;
      if (saved) {
        patchState(store, { theme: saved });
      }

      effect(() => {
        const theme = store.theme();
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
        document.documentElement.classList.toggle('dark-theme', isDark);
      });

      effect(() => {
        if (store.isMobile()) {
          patchState(store, { sidebarOpen: false });
        }
      });
    },
  })
);
