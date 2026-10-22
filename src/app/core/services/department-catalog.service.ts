import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AdminService } from '../../features/admin/services/admin.service';
import { AcademicProgram } from '../models/admin.model';

/**
 * Catálogo de departamentos de la Facultad (= programas académicos activos).
 * Se carga una sola vez y se comparte: chips de departamento, filtros del superadmin y formularios.
 */
@Injectable({ providedIn: 'root' })
export class DepartmentCatalogService {
  private readonly adminService = inject(AdminService);

  private readonly _departments = signal<AcademicProgram[]>([]);
  private readonly _loaded = signal(false);
  private loading: Promise<void> | null = null;

  readonly departments = this._departments.asReadonly();
  readonly loaded = this._loaded.asReadonly();
  private readonly byId = computed(() => new Map(this._departments().map((d) => [d.id, d])));

  /** Carga el catálogo si aún no está cargado (idempotente). */
  load(): Promise<void> {
    if (this._loaded()) return Promise.resolve();
    this.loading ??= firstValueFrom(this.adminService.getPrograms(true))
      .then((programs) => {
        this._departments.set(programs);
        this._loaded.set(true);
      })
      .catch((err) => console.warn('No se pudo cargar el catálogo de departamentos', err))
      .finally(() => (this.loading = null));
    return this.loading;
  }

  /** Nombre corto del departamento: "Sistemas" en vez de "Ingeniería de Sistemas". */
  shortName(id: string | null | undefined): string {
    if (!id) return '';
    const name = this.byId().get(id)?.name;
    return name ? name.replace(/^Ingeniería( de)?\s+/i, '') : '';
  }

  name(id: string | null | undefined): string {
    return (id && this.byId().get(id)?.name) || '';
  }
}
