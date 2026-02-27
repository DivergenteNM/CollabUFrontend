import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { MatSidenavModule } from '@angular/material/sidenav';
import { UiStore } from '../../../../state/ui.store';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { BreadcrumbsComponent } from '../breadcrumbs/breadcrumbs.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-main-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    MatSidenavModule,
    HeaderComponent,
    SidebarComponent,
    BreadcrumbsComponent,
    FooterComponent,
  ],
  host: {
    'class': 'app-main-layout',
  },
  template: `
    <mat-sidenav-container class="main-layout">
      <mat-sidenav
        [mode]="sidebarMode()"
        [opened]="uiStore.sidebarOpen()"
        (openedChange)="uiStore.setSidebarOpen($event)"
        class="main-layout__sidenav"
      >
        <app-sidebar />
      </mat-sidenav>

      <mat-sidenav-content class="main-layout__content">
        <app-header />
        <app-breadcrumbs />
        <main id="main-content" class="main-layout__main">
          <router-outlet />
        </main>
        <app-footer />
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: `
    :host {
      display: block;
      height: 100vh;
    }

    .main-layout {
      height: 100%;
    }

    .main-layout__sidenav {
      border-right: 1px solid var(--mat-sys-outline-variant);
    }

    .main-layout__content {
      display: flex;
      flex-direction: column;
      min-height: 100%;
    }

    .main-layout__main {
      flex: 1;
      padding: 16px 24px 24px;
      max-width: 1440px;
      width: 100%;
      margin: 0 auto;
      box-sizing: border-box;
    }

    @media (max-width: 599px) {
      .main-layout__main {
        padding: 12px 16px 16px;
      }
    }
  `,
})
export class MainLayoutComponent {
  readonly uiStore = inject(UiStore);
  private readonly breakpoint = inject(BreakpointObserver);

  readonly sidebarMode = toSignal(
    this.breakpoint.observe(['(max-width: 959px)']).pipe(
      map((r) => (r.matches ? 'over' : 'side') as 'over' | 'side')
    ),
    { initialValue: 'side' as const }
  );
}
