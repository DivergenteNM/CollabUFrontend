import {
  Component, ChangeDetectionStrategy, inject, signal, computed, effect, PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { httpResource } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

import { environment } from '../../../../../environments/environment';
import { PaginatedResponse, Project } from '../../../../core/models';
import { AuthStore } from '../../../../state/auth.store';
import { UiStore } from '../../../../state/ui.store';
import { ProjectCardComponent } from '../../../../shared/components/cards/project-card/project-card.component';
import { SkeletonComponent } from '../../../../shared/components/ui/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state.component';
import { MatchingService } from '../../../matching/services/matching.service';

interface FilterOption {
  id: string;
  label: string;
}

@Component({
  selector: 'app-project-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule, MatIconModule, FormsModule,
    ProjectCardComponent, SkeletonComponent, EmptyStateComponent,
  ],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.scss',
})
export class ProjectListComponent {
  readonly router = inject(Router);
  readonly authStore = inject(AuthStore);
  readonly uiStore = inject(UiStore);
  private readonly platformId = inject(PLATFORM_ID);
  readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly matchingService = inject(MatchingService);

  readonly page = signal(1);
  readonly pageSize = 12;
  readonly showMobileFilters = signal(false);
  readonly skeletonArray = Array(6);

  // Sidebar sections expand/collapse state
  readonly categoryOpen = signal(true);
  readonly durationOpen = signal(true);
  readonly skillsOpen = signal(true);

  // Active filter selections
  readonly searchText = signal('');
  readonly selectedCategory = signal<string>('');
  readonly selectedDuration = signal<string>('');
  readonly selectedSkill = signal<string>('');
  readonly skillSearchQuery = signal<string>('');
  readonly selectedSort = signal<string>('createdAt');

  // Filter definitions matching the mockup
  readonly categories: FilterOption[] = [
    { id: 'web', label: 'Desarrollo Web' },
    { id: 'mobile', label: 'Móvil' },
    { id: 'data', label: 'Ciencia de Datos' },
    { id: 'design', label: 'Diseño' },
  ];

  readonly durationOptions: FilterOption[] = [
    { id: '< 1 Mes', label: '< 1 Mes' },
    { id: '1-3 Meses', label: '1-3 Meses' },
    { id: '> 3 Meses', label: '> 3 Meses' },
  ];

  readonly allSkills: string[] = [
    'Python', 'React', 'UI/UX', 'Machine Learning',
    'Angular', 'Node.js', 'Figma', 'TypeScript', 'SQL', 'Flutter',
  ];

  readonly filteredSkills = computed(() => {
    const q = this.skillSearchQuery().toLowerCase().trim();
    if (!q) return this.allSkills;
    return this.allSkills.filter((s) => s.toLowerCase().includes(q));
  });

  /** projectId -> overallScore real ya calculado por matching-service para el estudiante actual. */
  readonly matchScores = signal<Map<string, number>>(new Map());
  /** Evita pedir el cálculo dos veces para el mismo proyecto en esta sesión de la página. */
  private readonly requestedProjectIds = new Set<string>();
  private readonly studentId = this.authStore.isStudent() ? (this.authStore.user()?.id ?? null) : null;

  constructor() {
    if (this.isBrowser && this.studentId) {
      this.matchingService.getResultsForStudent(this.studentId).subscribe({
        next: (res) => {
          const map = new Map(res.data.map((m) => [m.projectId, m.overallScore]));
          this.matchScores.set(map);
        },
        error: () => {},
      });

      effect(() => {
        const visible = this.projects();
        const studentId = this.studentId;
        if (!studentId) return;

        for (const project of visible) {
          if (this.requestedProjectIds.has(project.id)) continue;
          this.requestedProjectIds.add(project.id);

          this.matchingService.calculate(studentId, project.id).subscribe({
            next: (result) => {
              this.matchScores.update((current) => {
                const next = new Map(current);
                next.set(project.id, result.overallScore);
                return next;
              });
            },
            error: () => {},
          });
        }
      });
    }
  }

  matchScoreFor(projectId: string): number | undefined {
    return this.matchScores().get(projectId);
  }

  readonly projectsResource = httpResource<PaginatedResponse<Project>>(
    () => {
      if (!this.isBrowser) return undefined;
      return {
        url: `${environment.apiUrl}/projects`,
        params: this.buildParams(),
      };
    },
  );

  readonly projects = computed(() => {
    try {
      return this.projectsResource.value()?.data ?? [];
    } catch {
      return [];
    }
  });

  readonly totalProjects = computed(() => {
    try {
      return this.projectsResource.value()?.meta?.total ?? 0;
    } catch {
      return 0;
    }
  });

  readonly totalPages = computed(() => {
    const total = this.totalProjects();
    return Math.max(1, Math.ceil(total / this.pageSize));
  });

  readonly resultsSubtitle = computed(() => {
    const total = this.totalProjects();
    if (total > 25) {
      return 'Más de 25 proyectos publicados para postularte.';
    }
    if (total > 0) {
      return `${total} proyecto${total === 1 ? '' : 's'} publicado${total === 1 ? '' : 's'} para postularte.`;
    }
    return 'Explora las oportunidades publicadas para postularte.';
  });

  // Filter actions
  onSearchInput(value: string): void {
    this.searchText.set(value);
    this.page.set(1);
  }

  toggleCategory(categoryId: string): void {
    if (this.selectedCategory() === categoryId) {
      this.selectedCategory.set('');
    } else {
      this.selectedCategory.set(categoryId);
    }
    this.page.set(1);
  }

  toggleDuration(durationId: string): void {
    if (this.selectedDuration() === durationId) {
      this.selectedDuration.set('');
    } else {
      this.selectedDuration.set(durationId);
    }
    this.page.set(1);
  }

  toggleSkill(skill: string): void {
    if (this.selectedSkill() === skill) {
      this.selectedSkill.set('');
    } else {
      this.selectedSkill.set(skill);
    }
    this.page.set(1);
  }

  onSortChange(sortBy: string): void {
    this.selectedSort.set(sortBy);
    this.page.set(1);
  }

  prevPage(): void {
    if (this.page() > 1) {
      this.page.update((p) => p - 1);
    }
  }

  nextPage(): void {
    if (this.page() < this.totalPages()) {
      this.page.update((p) => p + 1);
    }
  }

  clearFilters(): void {
    this.searchText.set('');
    this.selectedCategory.set('');
    this.selectedDuration.set('');
    this.selectedSkill.set('');
    this.skillSearchQuery.set('');
    this.selectedSort.set('createdAt');
    this.page.set(1);
  }

  private buildParams(): Record<string, string | number | boolean> {
    const params: Record<string, string | number | boolean> = {
      page: this.page(),
      limit: this.pageSize,
    };

    const searchParts: string[] = [];
    if (this.searchText().trim()) {
      searchParts.push(this.searchText().trim());
    }
    if (this.selectedCategory()) {
      const cat = this.categories.find((c) => c.id === this.selectedCategory());
      if (cat) {
        searchParts.push(cat.label);
      }
    }

    if (searchParts.length > 0) {
      params['search'] = searchParts.join(' ');
    }

    if (this.selectedSkill()) {
      params['skill'] = this.selectedSkill();
    }

    if (this.selectedSort()) {
      params['sortBy'] = this.selectedSort();
    }

    return params;
  }
}

