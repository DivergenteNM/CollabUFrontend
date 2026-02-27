import { Component, ChangeDetectionStrategy, signal, inject, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { ApiResponse, AcademicPeriod } from '../../../../core/models';
import { AdminService } from '../../services/admin.service';
import { PeriodDialogComponent } from './period-dialog.component';

@Component({
  selector: 'app-period-management',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatButtonModule, MatCardModule, MatChipsModule, DatePipe],
  template: `
    <div class="periods">
      <div class="periods__header">
        <h1>Periodos Académicos</h1>
        <button mat-flat-button color="primary" (click)="openDialog()">
          <mat-icon>add</mat-icon>
          Crear Periodo
        </button>
      </div>

      @if (resource.isLoading()) {
        <p>Cargando periodos...</p>
      }

      <div class="periods__list">
        @for (period of periods(); track period.id) {
          <mat-card class="period-card" [class.active]="period.isActive">
            <mat-card-header>
              <mat-card-title>{{ period.name }}</mat-card-title>
              <mat-card-subtitle>{{ period.periodCode }}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="period-info">
                <div class="period-dates">
                  <span><mat-icon>event</mat-icon> {{ period.startDate | date:'d MMM yyyy' }} — {{ period.endDate | date:'d MMM yyyy' }}</span>
                </div>
                <div class="period-deadline">
                  <span><mat-icon>schedule</mat-icon> Plazo aplicaciones: {{ period.applicationDeadline | date:'d MMM yyyy' }}</span>
                </div>
              </div>
              <mat-chip-set>
                @if (period.isActive) {
                  <mat-chip class="chip-active">Activo</mat-chip>
                } @else {
                  <mat-chip>Inactivo</mat-chip>
                }
              </mat-chip-set>
            </mat-card-content>
            <mat-card-actions align="end">
              <button mat-button (click)="openDialog(period)">
                <mat-icon>edit</mat-icon>
                Editar
              </button>
            </mat-card-actions>
          </mat-card>
        } @empty {
          @if (!resource.isLoading()) {
            <mat-card>
              <mat-card-content>
                <div class="empty">
                  <mat-icon>calendar_month</mat-icon>
                  <p>No hay periodos académicos registrados</p>
                </div>
              </mat-card-content>
            </mat-card>
          }
        }
      </div>
    </div>
  `,
  styles: `
    .periods {
      max-width: 900px;
      margin: 0 auto;

      &__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 24px;

        h1 {
          font-size: 1.75rem;
          font-weight: 500;
        }
      }

      &__list {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
    }

    .period-card {
      &.active {
        border-left: 4px solid var(--mat-sys-primary);
      }
    }

    .period-info {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin: 12px 0;

      span {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.9375rem;
        color: var(--mat-sys-on-surface-variant);

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }
    }

    .chip-active {
      background-color: #e8f5e9 !important;
      color: #2e7d32 !important;
    }

    .empty {
      text-align: center;
      padding: 32px;
      color: var(--mat-sys-on-surface-variant);

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        margin-bottom: 8px;
      }
    }
  `,
})
export class PeriodManagementComponent {
  private readonly dialog = inject(MatDialog);
  private readonly adminService = inject(AdminService);

  readonly resource = httpResource<ApiResponse<AcademicPeriod[]>>(
    () => ({ url: `${environment.apiUrl}/admin/periods` })
  );

  readonly periods = computed(() => this.resource.value()?.data ?? []);

  openDialog(period?: AcademicPeriod): void {
    const ref = this.dialog.open(PeriodDialogComponent, {
      width: '500px',
      data: period ?? null,
    });

    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      this.adminService.createPeriod(result).subscribe({
        next: () => this.resource.reload(),
      });
    });
  }
}
