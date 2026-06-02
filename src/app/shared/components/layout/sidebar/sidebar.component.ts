import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { AuthStore } from '../../../../state/auth.store';
import { NotificationsStore } from '../../../../state/notifications.store';
import { UserRole } from '../../../../core/enums/user-role.enum';

export interface MenuItem {
  icon?: string;
  label?: string;
  route?: string;
  badge?: number;
  children?: MenuItem[];
  divider?: boolean;
}

@Component({
  selector: 'app-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, MatListModule, MatIconModule, MatBadgeModule, MatDividerModule],
  host: {
    'class': 'app-sidebar',
    'role': 'navigation',
    '[attr.aria-label]': "'Menú de navegación principal'",
  },
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  private readonly authStore = inject(AuthStore);
  private readonly notificationsStore = inject(NotificationsStore);

  readonly unreadCount = this.notificationsStore.unreadCount;

  readonly menuItems = computed(() => {
    const role = this.authStore.role();
    return this.getMenuByRole(role);
  });

  private getMenuByRole(role: UserRole | null): MenuItem[] {
    if (!role) return [];

    const menus: Record<UserRole, MenuItem[]> = {
      [UserRole.STUDENT]: [
        { icon: 'dashboard', label: 'Dashboard', route: '/dashboard' },
        { icon: 'folder_open', label: 'Proyectos', route: '/projects' },
        { icon: 'mail_outline', label: 'Mis Aplicaciones', route: '/my-applications' },
        { icon: 'star_outline', label: 'Recomendaciones', route: '/matching' },
        { icon: 'chat_bubble_outline', label: 'Chat', route: '/chat' },
        { icon: 'rate_review', label: 'Evaluaciones', route: '/my-evaluations' },
        { icon: 'notifications_none', label: 'Notificaciones', route: '/notifications' },
        { divider: true },
        { icon: 'person_outline', label: 'Mi Perfil', route: '/profile/view' },
        { icon: 'settings', label: 'Configuración', route: '/settings' },
      ],
      [UserRole.COMPANY]: [
        { icon: 'dashboard', label: 'Dashboard', route: '/dashboard' },
        {
          icon: 'folder_open', label: 'Mis Proyectos', route: '/my-projects',
          children: [{ icon: 'add', label: 'Crear Proyecto', route: '/my-projects/create' }],
        },
        { icon: 'mail_outline', label: 'Aplicaciones', route: '/received-applications' },
        { icon: 'chat_bubble_outline', label: 'Chat', route: '/chat' },
        { icon: 'rate_review', label: 'Evaluaciones', route: '/my-evaluations' },
        { icon: 'notifications_none', label: 'Notificaciones', route: '/notifications' },
        { divider: true },
        { icon: 'business', label: 'Mi Perfil', route: '/profile/view' },
        { icon: 'settings', label: 'Configuración', route: '/settings' },
      ],
      [UserRole.FACULTY]: [
        { icon: 'dashboard', label: 'Dashboard', route: '/dashboard' },
        { icon: 'school', label: 'Mis Estudiantes', route: '/my-students' },
        { icon: 'rate_review', label: 'Evaluaciones', route: '/my-evaluations' },
        { icon: 'chat_bubble_outline', label: 'Chat', route: '/chat' },
        { icon: 'notifications_none', label: 'Notificaciones', route: '/notifications' },
        { divider: true },
        { icon: 'person_outline', label: 'Mi Perfil', route: '/profile/view' },
        { icon: 'settings', label: 'Configuración', route: '/settings' },
      ],
      [UserRole.ADMIN]: [
        { icon: 'analytics', label: 'Panel Analítico', route: '/admin/dashboard' },
        { icon: 'verified', label: 'Verificaciones', route: '/admin/verifications' },
        { icon: 'supervisor_account', label: 'Supervisores', route: '/admin/supervisors' },
        { icon: 'date_range', label: 'Periodos', route: '/admin/periods' },
        { icon: 'group', label: 'Usuarios', route: '/admin/users' },
        { divider: true },
        { icon: 'folder_open', label: 'Proyectos', route: '/projects' },
        { icon: 'notifications_none', label: 'Notificaciones', route: '/notifications' },
        { icon: 'settings', label: 'Configuración', route: '/settings' },
      ],
    };

    return menus[role] ?? [];
  }
}
