import { ChangeDetectionStrategy, Component, PLATFORM_ID, computed, effect, inject, input, output, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { AnalyticsService } from '../../../../features/analytics/services/analytics.service';
import { SkillCategoryKey, SkillTrend } from '../../../../core/models';
import { SkillGapChartComponent } from '../skill-gap-chart/skill-gap-chart.component';
import { DepartmentFilterComponent } from '../../department-filter/department-filter.component';

type SortKey = 'gap' | 'demand' | 'supply' | 'name';

/**
 * Oferta vs demanda de habilidades con filtros: departamento (solo Facultad), categoría, Top N, orden,
 * texto y vista (agrupada / brecha). Lo usan el dashboard del admin y la página de Tendencias de Skills.
 */
@Component({
  selector: 'app-skill-supply-demand-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonToggleModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressBarModule, MatSelectModule,
    SkillGapChartComponent, DepartmentFilterComponent,
  ],
  templateUrl: './skill-supply-demand-panel.component.html',
  styleUrl: './skill-supply-demand-panel.component.scss',
})
export class SkillSupplyDemandPanelComponent {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly analytics = inject(AnalyticsService);

  /** Departamento impuesto por el contenedor (p. ej. el filtro global del dashboard). */
  readonly programId = input<string | null>(null);
  /** Si es true el departamento lo decide el contenedor y el panel no muestra su propio selector. */
  readonly externalDepartment = input(false);
  /** Skills mostradas por defecto. */
  readonly defaultLimit = input(10);

  /** Habilidades que se están mostrando (para que el contenedor pinte una tabla con los mismos filtros). */
  readonly skillsChange = output<SkillTrend[]>();

  readonly ownDepartment = signal('');
  readonly category = signal<SkillCategoryKey | ''>('');
  readonly limit = signal<number | null>(null);
  readonly sort = signal<SortKey>('gap');
  readonly search = signal('');
  readonly view = signal<'grouped' | 'gap'>('grouped');

  readonly categories: { value: SkillCategoryKey | ''; label: string }[] = [
    { value: '', label: 'Todas las categorías' },
    { value: 'language', label: 'Lenguajes' },
    { value: 'framework', label: 'Frameworks' },
    { value: 'tool', label: 'Herramientas' },
    { value: 'concept', label: 'Conceptos' },
    { value: 'soft_skill', label: 'Habilidades blandas' },
  ];
  readonly limits = [5, 10, 15, 25, 50];
  readonly sorts: { value: SortKey; label: string }[] = [
    { value: 'gap', label: 'Mayor brecha' },
    { value: 'demand', label: 'Mayor demanda' },
    { value: 'supply', label: 'Mayor oferta' },
    { value: 'name', label: 'Nombre (A-Z)' },
  ];

  readonly effectiveLimit = computed(() => this.limit() ?? this.defaultLimit());
  private readonly effectiveDepartment = computed(() =>
    this.externalDepartment() ? (this.programId() ?? '') : this.ownDepartment(),
  );

  readonly trends = rxResource({
    params: () =>
      isPlatformBrowser(this.platformId)
        ? {
            programId: this.effectiveDepartment(),
            category: this.category(),
            limit: this.effectiveLimit(),
            sort: this.sort(),
            search: this.search().trim(),
          }
        : undefined,
    stream: ({ params }) => this.analytics.getSkillTrends(params),
  });

  readonly skills = computed<SkillTrend[]>(() => this.trends.value() ?? []);
  readonly chartHeight = computed(() => Math.max(260, this.skills().length * 34 + 70));
  readonly hasFilters = computed(
    () => !!this.category() || !!this.search().trim() || this.sort() !== 'gap' || this.limit() !== null,
  );

  constructor() {
    effect(() => this.skillsChange.emit(this.skills()));
  }

  onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  reset(): void {
    this.category.set('');
    this.search.set('');
    this.sort.set('gap');
    this.limit.set(null);
  }
}
