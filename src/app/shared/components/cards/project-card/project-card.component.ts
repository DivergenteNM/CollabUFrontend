import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe } from '@angular/common';
import { Project } from '../../../../core/models';
import { ProjectType, ProjectStatus } from '../../../../core/enums';

interface ThematicTheme {
  icon: string;
  bgClass: string;
  colorClass: string;
}

@Component({
  selector: 'app-project-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, DatePipe],
  host: { 'class': 'project-card' },
  templateUrl: './project-card.component.html',
  styleUrl: './project-card.component.scss',
})
export class ProjectCardComponent {
  readonly project = input.required<Project>();
  readonly matchScore = input<number>();
  readonly showActions = input<boolean>(true);
  readonly canApply = input<boolean>(true);
  readonly viewDetail = output<string>();
  readonly apply = output<string>();

  readonly circumference = 2 * Math.PI * 30; // r = 30 -> 188.495

  readonly normalizedMatchScore = computed(() => {
    const score = this.matchScore();
    if (score === undefined || score === null || isNaN(score)) return null;
    return Math.max(0, Math.min(100, Math.round(score)));
  });

  readonly strokeDashoffset = computed(() => {
    const score = this.normalizedMatchScore();
    if (score === null) return this.circumference;
    return this.circumference - (score / 100) * this.circumference;
  });

  readonly projectTypeLabel = computed(() => {
    const type = this.project().projectType;
    const map: Record<string, string> = {
      [ProjectType.PROFESSIONAL_PRACTICE]: 'Práctica Profesional',
      [ProjectType.THESIS]: 'Tesis / Trabajo de Grado',
      [ProjectType.RESEARCH]: 'Investigación',
      [ProjectType.INTERNSHIP]: 'Pasantía',
      [ProjectType.OTHER]: 'Proyecto',
    };
    return map[type] || 'Proyecto';
  });

  readonly statusLabel = computed(() => {
    const status = this.project().status;
    const map: Record<string, string> = {
      [ProjectStatus.PUBLISHED]: 'Publicado',
      [ProjectStatus.DRAFT]: 'Borrador',
      [ProjectStatus.IN_PROGRESS]: 'En Progreso',
      [ProjectStatus.COMPLETED]: 'Completado',
      [ProjectStatus.CANCELLED]: 'Cancelado',
      [ProjectStatus.PENDING_APPROVAL]: 'En Revisión',
      [ProjectStatus.NEEDS_CHANGES]: 'Requiere Cambios',
    };
    return map[status] || 'Publicado';
  });

  readonly isPublished = computed(() => {
    return this.project().status === ProjectStatus.PUBLISHED || (this.project().status as string) === 'published';
  });

  readonly theme = computed<ThematicTheme>(() => {
    const title = (this.project().title || '').toLowerCase();
    const desc = (this.project().description || '').toLowerCase();
    const skills = (this.project().skills || []).map((s) => (s.name || '').toLowerCase()).join(' ');
    const combined = `${title} ${desc} ${skills}`;

    if (combined.includes('móvil') || combined.includes('movil') || combined.includes('mobile') || combined.includes('android') || combined.includes('ios') || combined.includes('flutter') || combined.includes('react native')) {
      return { icon: 'smartphone', bgClass: 'theme-green', colorClass: 'text-green' };
    }
    if (combined.includes('dato') || combined.includes('data') || combined.includes('analytics') || combined.includes('marketing') || combined.includes('machine learning') || combined.includes('ia') || combined.includes('python')) {
      return { icon: 'pie_chart', bgClass: 'theme-purple', colorClass: 'text-purple' };
    }
    if (combined.includes('diseño') || combined.includes('ui') || combined.includes('ux') || combined.includes('figma') || combined.includes('prototipo')) {
      return { icon: 'palette', bgClass: 'theme-amber', colorClass: 'text-amber' };
    }
    if (combined.includes('inventario') || combined.includes('sistema') || combined.includes('gestión') || combined.includes('gestion') || combined.includes('almacén') || combined.includes('logística')) {
      return { icon: 'inventory_2', bgClass: 'theme-blue', colorClass: 'text-blue' };
    }
    return { icon: 'code', bgClass: 'theme-indigo', colorClass: 'text-indigo' };
  });
}

