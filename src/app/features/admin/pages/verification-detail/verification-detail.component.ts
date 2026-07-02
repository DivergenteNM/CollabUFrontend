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
  templateUrl: './verification-detail.component.html',
  styleUrl: './verification-detail.component.scss',
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
