import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
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
import { UserRole } from '../../../../core/enums';

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
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  readonly uiStore = inject(UiStore);
  readonly authStore = inject(AuthStore);
  private readonly notificationsStore = inject(NotificationsStore);
  private readonly router = inject(Router);

  readonly displayName = this.authStore.displayName;
  readonly unreadCount = this.notificationsStore.unreadCount;
  readonly recentNotifications = this.notificationsStore.recentNotifications;

  readonly welcomeMessage = computed(() => {
    const role = this.authStore.role();
    if (!role) return '';
    switch (role) {
      case UserRole.STUDENT:
        return '🎓 ¡Bienvenido Estudiante!';
      case UserRole.COMPANY:
        return '💼 ¡Bienvenida Empresa!';
      case UserRole.FACULTY:
        return '🏫 ¡Bienvenido Docente!';
      case UserRole.ADMIN:
        return '🛡️ ¡Bienvenido Admin!';
      default:
        return '';
    }
  });

  logout(): void {
    this.authStore.clearAuth();
  }
}
