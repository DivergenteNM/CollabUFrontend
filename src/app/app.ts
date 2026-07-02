import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { routeAnimation } from './shared/animations';

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
export class App {}
