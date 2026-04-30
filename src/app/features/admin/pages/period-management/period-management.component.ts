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
  templateUrl: './period-management.component.html',
  styleUrl: './period-management.component.scss',
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
