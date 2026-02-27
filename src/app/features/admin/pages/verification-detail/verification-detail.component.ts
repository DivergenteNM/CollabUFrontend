import { Component, ChangeDetectionStrategy, input, signal, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { ApiResponse, CompanyVerification } from '../../../../core/models';
import { AdminService } from '../../services/admin.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../shared/components/ui/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-verification-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIconModule, MatButtonModule, MatCardModule, MatChipsModule,
    MatFormFieldModule, MatInputModule, FormsModule, DatePipe,
  ],
  template: `
    <div class="verification-detail">
      <button mat-button (click)="goBack()">
        <mat-icon>arrow_back</mat-icon>
        Volver a verificaciones
      </button>

      @if (resource.isLoading()) {
        <mat-card>
          <mat-card-content>
            <p>Cargando datos de verificación...</p>
          </mat-card-content>
        </mat-card>
      }

      @if (resource.value(); as resp) {
        @if (resp.data; as v) {
          <mat-card class="verification-detail__info">
            <mat-card-header>
              <mat-card-title>{{ v.companyName }}</mat-card-title>
              <mat-card-subtitle>
                <mat-chip-set>
                  <mat-chip [class]="'status-' + v.status">
                    {{ statusLabel(v.status) }}
                  </mat-chip>
                </mat-chip-set>
              </mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">NIT</span>
                  <span class="info-value">{{ v.nit }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Fecha de solicitud</span>
                  <span class="info-value">{{ v.requestedAt | date:'d MMM yyyy, HH:mm' }}</span>
                </div>
                @if (v.reviewedAt) {
                  <div class="info-item">
                    <span class="info-label">Fecha revisión</span>
                    <span class="info-value">{{ v.reviewedAt | date:'d MMM yyyy, HH:mm' }}</span>
                  </div>
                }
                @if (v.rejectionReason) {
                  <div class="info-item full">
                    <span class="info-label">Razón de rechazo</span>
                    <span class="info-value rejection">{{ v.rejectionReason }}</span>
                  </div>
                }
              </div>

              @if (v.documents.length > 0) {
                <h3>Documentos adjuntos</h3>
                <div class="doc-list">
                  @for (doc of v.documents; track doc) {
                    <a [href]="doc" target="_blank" class="doc-item">
                      <mat-icon>description</mat-icon>
                      <span>Documento</span>
                      <mat-icon>open_in_new</mat-icon>
                    </a>
                  }
                </div>
              }
            </mat-card-content>

            @if (v.status === 'pending') {
              <mat-card-actions align="end">
                <button mat-button color="warn" (click)="reject(v)">
                  <mat-icon>close</mat-icon>
                  Rechazar
                </button>
                <button mat-flat-button color="primary" (click)="approve(v)">
                  <mat-icon>check</mat-icon>
                  Aprobar
                </button>
              </mat-card-actions>
            }
          </mat-card>

          <!-- Reject dialog inline -->
          @if (showRejectForm()) {
            <mat-card class="verification-detail__reject">
              <mat-card-header>
                <mat-card-title>Razón de rechazo</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Motivo</mat-label>
                  <textarea matInput [(ngModel)]="rejectReason" rows="3"
                    placeholder="Explique la razón del rechazo..."></textarea>
                </mat-form-field>
              </mat-card-content>
              <mat-card-actions align="end">
                <button mat-button (click)="showRejectForm.set(false)">Cancelar</button>
                <button mat-flat-button color="warn"
                  [disabled]="!rejectReason.trim() || submitting()"
                  (click)="confirmReject(v.id)">
                  Confirmar Rechazo
                </button>
              </mat-card-actions>
            </mat-card>
          }
        }
      }
    </div>
  `,
  styles: `
    .verification-detail {
      max-width: 800px;
      margin: 0 auto;

      > button:first-child {
        margin-bottom: 16px;
      }

      &__info {
        margin-bottom: 16px;
      }

      &__reject {
        margin-top: 16px;
      }
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin: 16px 0;

      @media (max-width: 599px) {
        grid-template-columns: 1fr;
      }
    }

    .info-item {
      &.full {
        grid-column: 1 / -1;
      }
    }

    .info-label {
      display: block;
      font-size: 0.8125rem;
      color: var(--mat-sys-on-surface-variant);
      margin-bottom: 4px;
    }

    .info-value {
      font-size: 1rem;
      font-weight: 500;

      &.rejection {
        color: var(--mat-sys-error);
      }
    }

    .status-pending {
      background-color: #fff3e0 !important;
      color: #e65100 !important;
    }

    .status-approved {
      background-color: #e8f5e9 !important;
      color: #2e7d32 !important;
    }

    .status-rejected {
      background-color: #ffebee !important;
      color: #c62828 !important;
    }

    h3 {
      margin: 24px 0 12px;
      font-size: 1rem;
      font-weight: 500;
    }

    .doc-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .doc-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 8px;
      text-decoration: none;
      color: var(--mat-sys-primary);
      background: color-mix(in srgb, var(--mat-sys-primary) 5%, transparent);

      span { flex: 1; }
    }

    .full-width {
      width: 100%;
    }
  `,
})
export class VerificationDetailComponent {
  readonly id = input.required<string>();
  private readonly adminService = inject(AdminService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  readonly showRejectForm = signal(false);
  readonly submitting = signal(false);
  rejectReason = '';

  readonly resource = httpResource<ApiResponse<CompanyVerification>>(
    () => ({ url: `${environment.apiUrl}/admin/verifications/${this.id()}` })
  );

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      approved: 'Aprobada',
      rejected: 'Rechazada',
    };
    return labels[status] ?? status;
  }

  approve(v: CompanyVerification): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Aprobar Empresa',
        message: `¿Está seguro de aprobar la verificación de ${v.companyName}?`,
        confirmText: 'Aprobar',
        type: 'info',
      } satisfies ConfirmDialogData,
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.submitting.set(true);
      this.adminService.reviewVerification(v.id, { status: 'approved' }).subscribe({
        next: () => this.router.navigate(['/admin/verifications']),
        error: () => this.submitting.set(false),
      });
    });
  }

  reject(_v: CompanyVerification): void {
    this.showRejectForm.set(true);
  }

  confirmReject(id: string): void {
    this.submitting.set(true);
    this.adminService
      .reviewVerification(id, { status: 'rejected', reason: this.rejectReason.trim() })
      .subscribe({
        next: () => this.router.navigate(['/admin/verifications']),
        error: () => this.submitting.set(false),
      });
  }

  goBack(): void {
    this.router.navigate(['/admin/verifications']);
  }
}
