import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { UiStore } from '../../../../state/ui.store';
import { AuthStore } from '../../../../state/auth.store';
import { NotificationsStore } from '../../../../state/notifications.store';

@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatMenuModule,
    MatDividerModule,
  ],
  host: {
    'class': 'app-header',
  },
  template: `
    <mat-toolbar class="header">
      <!-- Left section -->
      <div class="header__left">
        <button mat-icon-button (click)="uiStore.toggleSidebar()" aria-label="Abrir/cerrar menú">
          <mat-icon>menu</mat-icon>
        </button>
        <a routerLink="/dashboard" class="header__brand">
          <span class="header__brand-icon">🎓</span>
          <span class="header__brand-text">Collab-U</span>
        </a>
      </div>

      <!-- Center: Search (hidden on mobile) -->
      <div class="header__center">
        <div class="header__search">
          <mat-icon class="header__search-icon">search</mat-icon>
          <input
            type="text"
            class="header__search-input"
            placeholder="Buscar proyectos, estudiantes..."
            aria-label="Buscar"
          />
        </div>
      </div>

      <!-- Right section -->
      <div class="header__right">
        <!-- Notifications -->
        <button
          mat-icon-button
          [matMenuTriggerFor]="notifMenu"
          aria-label="Notificaciones"
        >
          <mat-icon
            [matBadge]="unreadCount() > 0 ? unreadCount() : null"
            matBadgeColor="warn"
            matBadgeSize="small"
          >
            notifications_none
          </mat-icon>
        </button>

        <mat-menu #notifMenu="matMenu" class="header__notif-menu">
          <div class="header__notif-header" (click)="$event.stopPropagation()">
            <strong>Notificaciones</strong>
            @if (unreadCount() > 0) {
              <span class="header__notif-count">{{ unreadCount() }} nuevas</span>
            }
          </div>
          <mat-divider></mat-divider>
          @for (notif of recentNotifications(); track notif.id) {
            <button mat-menu-item class="header__notif-item">
              <mat-icon>{{ notif.isRead ? 'notifications_none' : 'notifications_active' }}</mat-icon>
              <div class="header__notif-content">
                <span class="header__notif-title">{{ notif.title }}</span>
                <span class="header__notif-message">{{ notif.message }}</span>
              </div>
            </button>
          } @empty {
            <div class="header__notif-empty" (click)="$event.stopPropagation()">
              <mat-icon>notifications_off</mat-icon>
              <span>Sin notificaciones</span>
            </div>
          }
          <mat-divider></mat-divider>
          <button mat-menu-item routerLink="/notifications" class="header__notif-all">
            <span>Ver todas las notificaciones</span>
          </button>
        </mat-menu>

        <!-- User menu -->
        <button mat-icon-button [matMenuTriggerFor]="userMenu" aria-label="Menú de usuario">
          <mat-icon>account_circle</mat-icon>
        </button>

        <mat-menu #userMenu="matMenu">
          <div class="header__user-info" (click)="$event.stopPropagation()">
            <mat-icon class="header__user-avatar">account_circle</mat-icon>
            <div>
              <div class="header__user-name">{{ displayName() }}</div>
              <div class="header__user-email">{{ authStore.user()?.email }}</div>
            </div>
          </div>
          <mat-divider></mat-divider>
          <button mat-menu-item routerLink="/profile/view">
            <mat-icon>person_outline</mat-icon>
            <span>Mi Perfil</span>
          </button>
          <button mat-menu-item routerLink="/settings">
            <mat-icon>settings</mat-icon>
            <span>Configuración</span>
          </button>
          <mat-divider></mat-divider>
          <button mat-menu-item (click)="logout()">
            <mat-icon>logout</mat-icon>
            <span>Cerrar Sesión</span>
          </button>
        </mat-menu>
      </div>
    </mat-toolbar>
  `,
  styles: `
    :host {
      display: block;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      background: var(--mat-sys-surface);
      border-bottom: 1px solid var(--mat-sys-outline-variant);
      padding: 0 8px;
      height: 64px;
    }

    .header__left {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
    }

    .header__brand {
      display: flex;
      align-items: center;
      gap: 6px;
      text-decoration: none;
      color: var(--mat-sys-on-surface);
    }

    .header__brand-icon {
      font-size: 24px;
    }

    .header__brand-text {
      font-size: 18px;
      font-weight: 700;
    }

    .header__center {
      flex: 1;
      display: flex;
      justify-content: center;
      max-width: 480px;
    }

    .header__search {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 8px 16px;
      background: var(--mat-sys-surface-container);
      border-radius: 24px;
      border: 1px solid var(--mat-sys-outline-variant);
      transition: border-color 0.2s;

      &:focus-within {
        border-color: var(--mat-sys-primary);
      }
    }

    .header__search-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: var(--mat-sys-on-surface-variant);
    }

    .header__search-input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      font-size: 14px;
      color: var(--mat-sys-on-surface);

      &::placeholder {
        color: var(--mat-sys-on-surface-variant);
      }
    }

    .header__right {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
    }

    .header__notif-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      font-size: 14px;
    }

    .header__notif-count {
      font-size: 12px;
      color: var(--mat-sys-primary);
    }

    .header__notif-item {
      height: auto !important;
      padding: 8px 16px !important;
    }

    .header__notif-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .header__notif-title {
      font-size: 13px;
      font-weight: 500;
    }

    .header__notif-message {
      font-size: 12px;
      color: var(--mat-sys-on-surface-variant);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 240px;
    }

    .header__notif-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 24px 16px;
      color: var(--mat-sys-on-surface-variant);
      font-size: 13px;
    }

    .header__notif-all {
      text-align: center;
      justify-content: center;
      color: var(--mat-sys-primary);
      font-weight: 500;
    }

    .header__user-info {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
    }

    .header__user-avatar {
      font-size: 36px;
      width: 36px;
      height: 36px;
      color: var(--mat-sys-primary);
    }

    .header__user-name {
      font-size: 14px;
      font-weight: 500;
      color: var(--mat-sys-on-surface);
    }

    .header__user-email {
      font-size: 12px;
      color: var(--mat-sys-on-surface-variant);
    }

    @media (max-width: 599px) {
      .header__center {
        display: none;
      }

      .header__brand-text {
        display: none;
      }
    }

    @media (min-width: 600px) and (max-width: 959px) {
      .header__center {
        max-width: 280px;
      }
    }
  `,
})
export class HeaderComponent {
  readonly uiStore = inject(UiStore);
  readonly authStore = inject(AuthStore);
  private readonly notificationsStore = inject(NotificationsStore);
  private readonly router = inject(Router);

  readonly displayName = this.authStore.displayName;
  readonly unreadCount = this.notificationsStore.unreadCount;
  readonly recentNotifications = this.notificationsStore.recentNotifications;

  logout(): void {
    this.authStore.clearAuth();
  }
}
