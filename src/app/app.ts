import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';
import { routeAnimation } from './shared/animations';
import { SeoService } from './core/services/seo.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  animations: [routeAnimation],
  template: `
    <div id="main-content" [@routeAnimation]="outlet.isActivated ? outlet.activatedRoute.routeConfig?.path : ''">
      <router-outlet #outlet="outlet" />
    </div>
  `,
})
export class App implements OnInit {
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

