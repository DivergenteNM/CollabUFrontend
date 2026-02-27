import {
  trigger, transition, style, animate, query, stagger, state, keyframes,
} from '@angular/animations';

/**
 * Route transition animation — subtle fade + slide up.
 * Use on the component hosting <router-outlet>.
 */
export const routeAnimation = trigger('routeAnimation', [
  transition('* <=> *', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(8px)' }),
    ], { optional: true }),
    query(':leave', [
      animate('150ms ease', style({ opacity: 0 })),
    ], { optional: true }),
    query(':enter', [
      animate('250ms ease', style({ opacity: 1, transform: 'translateY(0)' })),
    ], { optional: true }),
  ]),
]);

/**
 * Stagger animation for list items (cards, rows, etc.)
 * Use on a parent container; child selectors are generic.
 */
export const listAnimation = trigger('listAnimation', [
  transition(':enter', [
    query('.animate-item, mat-card, [animate-item]', [
      style({ opacity: 0, transform: 'translateY(16px)' }),
      stagger(50, [
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ], { optional: true }),
  ]),
]);

/**
 * Sidebar expand/collapse animation.
 * Bind to [@sidebarAnimation]="isExpanded ? 'expanded' : 'collapsed'".
 */
export const sidebarAnimation = trigger('sidebarAnimation', [
  state('expanded', style({ width: 'var(--sidebar-width)' })),
  state('collapsed', style({ width: 'var(--sidebar-collapsed)' })),
  transition('expanded <=> collapsed',
    animate('250ms cubic-bezier(0.4, 0, 0.2, 1)'),
  ),
]);

/**
 * Badge counter bounce — triggers on value increment.
 */
export const counterAnimation = trigger('counterAnimation', [
  transition(':increment', [
    animate('200ms', keyframes([
      style({ transform: 'scale(1)' }),
      style({ transform: 'scale(1.3)' }),
      style({ transform: 'scale(1)' }),
    ])),
  ]),
]);

/**
 * Simple fade-in for elements entering the DOM.
 */
export const fadeInAnimation = trigger('fadeIn', [
  transition(':enter', [
    style({ opacity: 0 }),
    animate('250ms ease', style({ opacity: 1 })),
  ]),
]);

/**
 * Slide-in from bottom.
 */
export const slideUpAnimation = trigger('slideUp', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(16px)' }),
    animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
  ]),
]);
