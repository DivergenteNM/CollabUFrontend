import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AdminService, AcademicQueueRow } from '../../services/admin.service';
import { StatusBadgeComponent } from '../../../../shared/components/ui/status-badge/status-badge.component';
import { DeadlineChipComponent } from '../../../../shared/components/ui/deadline-chip/deadline-chip.component';
import { statusLabel as registryLabel } from '../../../../core/status/status-registry';

const STATUS_ORDER = [
  'accepted', 'pending_supervisor',
  'waiting_anteproyecto', 'waiting_documents', 'waiting_agreement',
  'active', 'waiting_final_docs', 'final_docs_review',
  'finalizing',
];

/** Estados que no tienen ProjectAcademicRecord todavía — dominio 'application', no 'academicRecord'. */
const PRE_ASSIGNMENT_STATUSES = new Set(['accepted', 'pending_supervisor']);

@Component({
  selector: 'app-academic-process',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe, FormsModule, MatCardModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatChipsModule,
    MatPaginatorModule, MatProgressBarModule, MatTooltipModule,
    StatusBadgeComponent, DeadlineChipComponent,
  ],
  template: `
    <div class="aq">
      <div class="aq__header">
        <h1>Cola de trabajo académico</h1>
        <p class="aq__subtitle">Registros académicos activos organizados por estado.</p>
      </div>

      <!-- Status filter chips -->
      <div class="aq__filters">
        <button mat-stroked-button
          [class.aq__chip--active]="!statusFilter()"
          (click)="setStatusFilter(null)">
          Todos ({{ totalActive() }})
        </button>
        @for (s of statusOrder; track s) {
          @if (statusCounts()[s]; as count) {
            <button mat-stroked-button
              [class.aq__chip--active]="statusFilter() === s"
              (click)="setStatusFilter(s)">
              {{ statusLabel(s) }} ({{ count }})
            </button>
          }
        }
      </div>

      @if (queueResource.isLoading()) {
        <mat-progress-bar mode="indeterminate" />
      }

      <!-- Search -->
      <mat-card class="aq__search">
        <mat-card-content>
          <mat-form-field appearance="outline" class="aq__search-field">
            <mat-label>Buscar por título de proyecto o ID</mat-label>
            <mat-icon matPrefix>search</mat-icon>
            <input matInput [(ngModel)]="searchQuery"
              (ngModelChange)="searchText.set($event)"
              (keyup.enter)="goToWorkspace()"
              placeholder="Escriba para filtrar..." />
          </mat-form-field>
        </mat-card-content>
      </mat-card>

      <!-- Queue list -->
      @if (rows().length > 0) {
        <div class="aq__list">
          <div class="aq__row aq__row--head">
            <span class="aq__col aq__col--project">Proyecto</span>
            <span class="aq__col aq__col--status">Estado</span>
            <span class="aq__col aq__col--date">Inicio</span>
            <span class="aq__col aq__col--date">Fin esperado</span>
            <span class="aq__col aq__col--signal"></span>
            <span class="aq__col aq__col--action"></span>
          </div>

          @for (row of rows(); track row.applicationId) {
            <div class="aq__row">
              <div class="aq__col aq__col--project">
                <span class="aq__project-title">{{ row.projectTitle ?? 'Sin título' }}</span>
              </div>

              <div class="aq__col aq__col--status">
                <app-status-badge [status]="row.status"
                  [domain]="isPreAssignment(row) ? 'application' : 'academicRecord'" size="sm" />
              </div>

              <div class="aq__col aq__col--date">
                <span class="aq__date-label">Inicio</span>
                {{ row.officialStartDate ? (row.officialStartDate | date:'d MMM yy') : '—' }}
              </div>

              <div class="aq__col aq__col--date">
                <span class="aq__date-label">Fin esperado</span>
                @if (row.expectedEndDate) {
                  <app-deadline-chip [date]="row.expectedEndDate" />
                } @else {
                  <span>—</span>
                }
              </div>

              <div class="aq__col aq__col--signal">
                @if (row.asesorCompletionSignal) {
                  <mat-icon matTooltip="Asesor señaló completitud" class="aq__signal aq__signal--ok">check_circle</mat-icon>
                }
              </div>

              <div class="aq__col aq__col--action">
                @if (row.status === 'accepted') {
                  <button mat-icon-button color="primary"
                    matTooltip="Asignar asesor" (click)="openSupervisorAssignment(row)">
                    <mat-icon>school</mat-icon>
                  </button>
                } @else if (row.status === 'pending_supervisor') {
                  <button mat-icon-button disabled
                    matTooltip="Asesor asignado, esperando su aceptación">
                    <mat-icon>hourglass_top</mat-icon>
                  </button>
                } @else {
                  <button mat-icon-button matTooltip="Abrir workspace" (click)="openWorkspace(row)">
                    <mat-icon>open_in_new</mat-icon>
                  </button>
                }
              </div>
            </div>
          }
        </div>

        <mat-paginator
          class="aq__paginator"
          [length]="total()"
          [pageSize]="pageSize()"
          [pageIndex]="page() - 1"
          [pageSizeOptions]="[10, 20, 50]"
          (page)="onPage($event)"
          showFirstLastButtons />
      } @else if (!queueResource.isLoading()) {
        <mat-card>
          <mat-card-content class="aq__empty">
            <mat-icon>check_circle_outline</mat-icon>
            <p>No hay registros académicos pendientes.</p>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .aq { padding: 24px; max-width: 1100px; margin: 0 auto; }
    .aq__header h1 { margin: 0 0 4px; font-size: 1.4rem; font-weight: 700; }
    .aq__subtitle { margin: 0 0 16px; color: var(--text-secondary); font-size: .875rem; }
    .aq__filters {
      display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px;
    }
    .aq__chip--active {
      background: var(--mat-sys-primary) !important;
      color: var(--mat-sys-on-primary) !important;
    }
    .aq__search { margin-bottom: 16px; }
    .aq__search mat-card-content { display: flex; align-items: center; gap: 12px; padding-top: 16px; }
    .aq__search-field { flex: 1; }

    .aq__list {
      display: flex; flex-direction: column; gap: 4px;
      border: 1px solid color-mix(in srgb, var(--mat-sys-outline) 40%, transparent);
      border-radius: 14px;
      padding: 6px;
      background: var(--mat-sys-surface-container-lowest, transparent);
    }

    /* Fixed pixel tracks (except the flexible project column) so every row —
       each an independent grid — lands on identical column boundaries, and
       every row (regardless of status) renders through the exact same
       template: one status badge, two date cells, one signal slot, one
       icon-button action. Budget kept tight (measured max content: badge
       174px, chip 190px) since the admin sidebar leaves ~870-900px to work with. */
    .aq__row {
      display: grid;
      grid-template-columns: minmax(200px, 2fr) 178px 64px 170px 24px 44px;
      align-items: center;
      gap: 10px;
      padding: 12px 14px;
      border-radius: 10px;
      transition: background .12s ease;
    }
    .aq__row:not(.aq__row--head):hover {
      background: color-mix(in srgb, var(--mat-sys-primary) 5%, transparent);
    }
    .aq__row--head {
      font-size: .7rem; text-transform: uppercase; letter-spacing: .05em; font-weight: 600;
      color: var(--text-secondary);
      padding: 4px 14px 8px;
    }

    .aq__col { min-width: 0; }
    .aq__col--date { font-size: .8125rem; color: var(--text-secondary); }
    .aq__date-label { display: none; }
    .aq__col--action { display: flex; justify-content: flex-end; }

    .aq__project-title {
      font-weight: 600; display: block;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }

    .aq__signal { font-size: 18px; width: 18px; height: 18px; }
    .aq__signal--ok { color: #2e7d32; }

    .aq__paginator {
      margin-top: 4px;
      background: transparent;
      border-radius: 0 0 14px 14px;
    }

    .aq__empty {
      text-align: center; padding: 48px 16px; color: var(--text-secondary);
      mat-icon { font-size: 48px; width: 48px; height: 48px; color: #2e7d32; }
      p { margin: 8px 0 0; }
    }

    @media (max-width: 960px) {
      .aq__row--head { display: none; }
      .aq__row {
        grid-template-columns: 1fr auto;
        grid-template-areas:
          "project status"
          "start   end"
          "signal  action";
        row-gap: 6px;
        border: 1px solid color-mix(in srgb, var(--mat-sys-outline) 30%, transparent);
        margin-bottom: 4px;
      }
      .aq__col--project { grid-area: project; }
      .aq__col--status { grid-area: status; justify-self: end; }
      .aq__col--date:nth-of-type(3) { grid-area: start; }
      .aq__col--date:nth-of-type(4) { grid-area: end; justify-self: end; }
      .aq__col--signal { grid-area: signal; }
      .aq__col--action { grid-area: action; }
      .aq__date-label {
        display: inline-block; font-size: .65rem; text-transform: uppercase;
        color: var(--text-secondary); margin-right: 6px; letter-spacing: .04em;
      }
    }
  `],
})
export class AcademicProcessComponent {
  private readonly adminService = inject(AdminService);
  private readonly router = inject(Router);

  readonly statusOrder = STATUS_ORDER;
  readonly statusFilter = signal<string | null>(null);
  readonly page = signal(1);
  readonly pageSize = signal(20);
  searchQuery = '';
  readonly searchText = signal('');

  readonly queueResource = rxResource({
    params: () => ({ status: this.statusFilter(), page: this.page(), limit: this.pageSize() }),
    stream: ({ params }) => this.adminService.getAcademicQueue({
      status: params.status ?? undefined,
      page: params.page,
      limit: params.limit,
    }).pipe(catchError(() => of({ data: [], total: 0, page: 1, limit: 20, totalPages: 0, statusCounts: {} }))),
  });

  readonly allRows = computed<AcademicQueueRow[]>(() => this.queueResource.value()?.data ?? []);
  readonly rows = computed<AcademicQueueRow[]>(() => {
    const q = this.searchText().toLowerCase().trim();
    if (!q) return this.allRows();
    return this.allRows().filter(r =>
      (r.projectTitle ?? '').toLowerCase().includes(q) ||
      (r.applicationId ?? '').toLowerCase().includes(q),
    );
  });
  readonly total = computed(() => this.queueResource.value()?.total ?? 0);
  readonly statusCounts = computed<Record<string, number>>(() => this.queueResource.value()?.statusCounts ?? {});
  readonly totalActive = computed(() => {
    const counts = this.statusCounts();
    return STATUS_ORDER.reduce((sum, s) => sum + (counts[s] ?? 0), 0);
  });

  statusLabel(status: string): string {
    return registryLabel(PRE_ASSIGNMENT_STATUSES.has(status) ? 'application' : 'academicRecord', status);
  }

  setStatusFilter(status: string | null): void {
    this.statusFilter.set(status);
    this.page.set(1);
  }

  onPage(event: PageEvent): void {
    this.page.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
  }

  isPreAssignment(row: AcademicQueueRow): boolean {
    return PRE_ASSIGNMENT_STATUSES.has(row.status);
  }

  openWorkspace(row: AcademicQueueRow): void {
    this.router.navigate(['/workspace', row.applicationId]);
  }

  openSupervisorAssignment(row: AcademicQueueRow): void {
    this.router.navigate(['/admin/supervisors'], {
      queryParams: { applicationId: row.applicationId },
    });
  }

  goToWorkspace(): void {
    const q = this.searchQuery.trim();
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidPattern.test(q)) {
      this.router.navigate(['/workspace', q]);
    }
  }
}
