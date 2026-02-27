import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ApplicationStatus, ProjectStatus } from '../../../../core/enums';

interface StatusConfig {
  label: string;
  icon: string;
  color: string;
  bg: string;
}

function buildStatusMap(): Map<string, StatusConfig> {
  const map = new Map<string, StatusConfig>();
  // Application statuses
  map.set(ApplicationStatus.PENDING,      { label: 'Pendiente',     icon: 'schedule',        color: '#f57c00', bg: '#fff3e0' });
  map.set(ApplicationStatus.UNDER_REVIEW, { label: 'En revisión',   icon: 'visibility',      color: '#1565c0', bg: '#e3f2fd' });
  map.set(ApplicationStatus.INTERVIEW,    { label: 'Entrevista',    icon: 'event',           color: '#6a1b9a', bg: '#f3e5f5' });
  map.set(ApplicationStatus.ACCEPTED,     { label: 'Aceptada',      icon: 'check_circle',    color: '#2e7d32', bg: '#e8f5e9' });
  map.set(ApplicationStatus.REJECTED,     { label: 'Rechazada',     icon: 'cancel',          color: '#c62828', bg: '#ffebee' });
  map.set(ApplicationStatus.IN_PROGRESS,  { label: 'En progreso',   icon: 'play_circle',     color: '#0277bd', bg: '#e1f5fe' });
  map.set(ApplicationStatus.COMPLETED,    { label: 'Completada',    icon: 'task_alt',        color: '#1b5e20', bg: '#e8f5e9' });
  map.set(ApplicationStatus.CANCELLED,    { label: 'Cancelada',     icon: 'block',           color: '#616161', bg: '#f5f5f5' });
  map.set(ApplicationStatus.WITHDRAWN,    { label: 'Retirada',      icon: 'undo',            color: '#78909c', bg: '#eceff1' });
  // Project statuses (overrides shared enum values intentionally — project labels)
  map.set('project_' + ProjectStatus.DRAFT,               { label: 'Borrador',     icon: 'edit',            color: '#78909c', bg: '#eceff1' });
  map.set('project_' + ProjectStatus.PUBLISHED,           { label: 'Publicado',    icon: 'public',          color: '#2e7d32', bg: '#e8f5e9' });
  map.set('project_' + ProjectStatus.APPLICATIONS_CLOSED, { label: 'Cerrado',      icon: 'lock',            color: '#f57c00', bg: '#fff3e0' });
  map.set('project_' + ProjectStatus.IN_PROGRESS,         { label: 'En progreso',  icon: 'play_circle',     color: '#0277bd', bg: '#e1f5fe' });
  map.set('project_' + ProjectStatus.COMPLETED,           { label: 'Completado',   icon: 'task_alt',        color: '#1b5e20', bg: '#e8f5e9' });
  map.set('project_' + ProjectStatus.CANCELLED,           { label: 'Cancelado',    icon: 'block',           color: '#616161', bg: '#f5f5f5' });
  return map;
}

const STATUS_MAP = buildStatusMap();

@Component({
  selector: 'app-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  host: {
    'class': 'status-badge',
    '[class]': '"status-badge--" + size()',
    '[style.--badge-color]': 'statusConfig().color',
    '[style.--badge-bg]': 'statusConfig().bg',
    '[attr.aria-label]': '"Estado: " + statusConfig().label',
  },
  template: `
    <mat-icon>{{ statusConfig().icon }}</mat-icon>
    <span>{{ statusConfig().label }}</span>
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 10px;
      border-radius: 999px;
      font-weight: 500;
      color: var(--badge-color);
      background-color: var(--badge-bg);
      white-space: nowrap;
    }

    :host(.status-badge--sm) {
      font-size: 0.75rem;
      padding: 1px 8px;

      mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }
    }

    :host(.status-badge--md) {
      font-size: 0.8125rem;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    }
  `,
})
export class StatusBadgeComponent {
  readonly status = input.required<ApplicationStatus | ProjectStatus>();
  readonly size = input<'sm' | 'md'>('md');

  readonly statusConfig = computed<StatusConfig>(() => {
    const s = this.status();
    // Try direct match first, then project-prefixed for ProjectStatus values
    return STATUS_MAP.get(s) ?? STATUS_MAP.get('project_' + s) ?? { label: s, icon: 'help', color: '#757575', bg: '#eeeeee' };
  });
}
