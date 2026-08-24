import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';
import { routeAnimation } from './shared/animations';
import { SeoService } from './core/services/seo.service';
import { AuthStore } from './state/auth.store';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  animations: [routeAnimation],
  template: `
    @if (!authStore.authReady()) {
      <div class="app-splash" aria-live="polite" aria-busy="true">
        <div class="app-splash__brand">
          <div class="app-splash__logo">
            <span class="app-splash__logo-symbol">C</span>
            <span class="app-splash__logo-accent">U</span>
          </div>
          <h1 class="app-splash__title">Collab-U</h1>
          <div class="app-splash__loader">
            <div class="app-splash__loader-bar"></div>
          </div>
        </div>
      </div>
    } @else {
      <div id="main-content" [@routeAnimation]="outlet.isActivated ? outlet.activatedRoute.routeConfig?.path : ''">
        <router-outlet #outlet="outlet" />
      </div>
    }
  `,
  styleUrl: './app.scss',
})
export class App implements OnInit {
  readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly seoService = inject(SeoService);

  ngOnInit(): void {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        let route = this.activatedRoute;
        while (route.firstChild) {
          route = route.firstChild;
        }

        const data = route.snapshot.data;
        const title = data?.['title'];
        const description = data?.['description'];
        const keywords = data?.['keywords'];
        const robots = data?.['robots'] || 'noindex, nofollow';

        this.seoService.setMetaTags({
          title,
          description,
          keywords,
          robots,
        });
      });
  }
}

