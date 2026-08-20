import { Component, ChangeDetectionStrategy, computed, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthStore } from '../../../../state/auth.store';
import { NotificationsStore } from '../../../../state/notifications.store';
import { ChatUnreadStore } from '../../../../state/chat-unread.store';
import { UserRole } from '../../../../core/enums/user-role.enum';
import {
  CATEGORY_LABELS, NotificationCategory,
} from '../../../../core/notifications/notification-registry';

export interface MenuItem {
  icon?: string;
  label?: string;
  route?: string;
  badgeKind?: 'notifications' | 'chat' | null;
  children?: MenuItem[];
  divider?: boolean;
}

@Component({
  selector: 'app-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink, RouterLinkActive,
    MatListModule, MatIconModule, MatBadgeModule, MatDividerModule, MatTooltipModule,
  ],
  host: {
    'class': 'app-sidebar',
    'role': 'navigation',
    '[attr.aria-label]': "'Menú de navegación principal'",
  },
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent implements OnInit {
  private readonly authStore = inject(AuthStore);
  private readonly notificationsStore = inject(NotificationsStore);
  private readonly chatUnreadStore = inject(ChatUnreadStore);

  readonly unreadCount = this.notificationsStore.unreadCount;
  readonly unreadByCategory = this.notificationsStore.unreadByCategory;
  readonly chatUnread = this.chatUnreadStore.total;

  readonly menuItems = computed(() => this.getMenuByRole(this.authStore.role()));

  /**
   * Desglose de no leídos por categoría, filtrando las que están en cero.
   * Se muestra como tooltip sobre el badge de notificaciones para dar contexto
   * sin ocupar espacio en el sidebar.
   */
  readonly unreadBreakdownTooltip = computed(() => {
    const counts = this.unreadByCategory();
    const lines: string[] = [];
    (Object.keys(counts) as NotificationCategory[]).forEach((cat) => {
      if (counts[cat] > 0) lines.push(`${CATEGORY_LABELS[cat]}: ${counts[cat]}`);
    });
    return lines.length ? lines.join(' · ') : 'Sin notificaciones';
  });

  ngOnInit(): void {
    // El sidebar es persistente; cargar los conteos una vez es suficiente.
    // Las actualizaciones incrementales las hace el socket dentro del store.
    if (this.authStore.role()) this.chatUnreadStore.loadInitial();
  }

  private getMenuByRole(role: UserRole | null): MenuItem[] {
    if (!role) return [];

    const menus: Record<UserRole, MenuItem[]> = {
      [UserRole.STUDENT]: [
        { icon: 'dashboard', label: 'Dashboard', route: '/dashboard' },
        { icon: 'folder_open', label: 'Proyectos', route: '/projects' },
        { icon: 'mail_outline', label: 'Mis Aplicaciones', route: '/my-applications' },
        { icon: 'star_outline', label: 'Recomendaciones', route: '/matching' },
        { icon: 'insights', label: 'Tendencias de Skills', route: '/skills' },
        { icon: 'chat_bubble_outline', label: 'Chat', route: '/chat', badgeKind: 'chat' },
        { icon: 'rate_review', label: 'Evaluaciones', route: '/my-evaluations' },
        { icon: 'notifications_none', label: 'Notificaciones', route: '/notifications', badgeKind: 'notifications' },
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
        { icon: 'insights', label: 'Tendencias de Skills', route: '/skills' },
        { icon: 'chat_bubble_outline', label: 'Chat', route: '/chat', badgeKind: 'chat' },
        { icon: 'rate_review', label: 'Evaluaciones', route: '/my-evaluations' },
        { icon: 'notifications_none', label: 'Notificaciones', route: '/notifications', badgeKind: 'notifications' },
        { divider: true },
        { icon: 'business', label: 'Mi Perfil', route: '/profile/view' },
        { icon: 'settings', label: 'Configuración', route: '/settings' },
      ],
      [UserRole.FACULTY]: [
        { icon: 'dashboard', label: 'Dashboard', route: '/dashboard' },
        { icon: 'school', label: 'Mis Estudiantes', route: '/my-students' },
        { icon: 'insights', label: 'Tendencias de Skills', route: '/skills' },
        { icon: 'rate_review', label: 'Evaluaciones', route: '/my-evaluations' },
        { icon: 'chat_bubble_outline', label: 'Chat', route: '/chat', badgeKind: 'chat' },
        { icon: 'notifications_none', label: 'Notificaciones', route: '/notifications', badgeKind: 'notifications' },
        { divider: true },
        { icon: 'person_outline', label: 'Mi Perfil', route: '/profile/view' },
        { icon: 'settings', label: 'Configuración', route: '/settings' },
      ],
      [UserRole.ADMIN]: [
        { icon: 'analytics', label: 'Panel Analítico', route: '/admin/dashboard' },
        { icon: 'verified', label: 'Verificaciones', route: '/admin/verifications' },
        { icon: 'rule', label: 'Categorías de rechazo', route: '/admin/rejection-categories' },
        { icon: 'description', label: 'Plantillas académicas', route: '/admin/templates' },
        { icon: 'rule_folder', label: 'Documentos requeridos', route: '/admin/document-requirements' },
        { icon: 'psychology', label: 'Catálogo de habilidades', route: '/admin/skills' },
        { icon: 'supervisor_account', label: 'Supervisores', route: '/admin/supervisors' },
        { icon: 'assignment_turned_in', label: 'Proceso académico', route: '/admin/academic-process' },
        { icon: 'date_range', label: 'Periodos', route: '/admin/periods' },
        { icon: 'group', label: 'Usuarios', route: '/admin/users' },
        { icon: 'description', label: 'Reportes', route: '/admin/reports' },
        { divider: true },
        { icon: 'insights', label: 'Tendencias de Skills', route: '/skills' },
        { icon: 'folder_open', label: 'Proyectos', route: '/projects' },
        { icon: 'notifications_none', label: 'Notificaciones', route: '/notifications', badgeKind: 'notifications' },
        { icon: 'settings', label: 'Configuración', route: '/settings' },
      ],
    };

    return menus[role] ?? [];
  }
}
