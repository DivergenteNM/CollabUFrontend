import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AcademicPeriod } from '../../../../core/models';

@Component({
  selector: 'app-period-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatCheckboxModule,
  ],
  templateUrl: './period-dialog.component.html',
  styleUrl: './period-dialog.component.scss',
})
export class PeriodDialogComponent {
  readonly data = inject<AcademicPeriod | null>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<PeriodDialogComponent>);

  form: Partial<AcademicPeriod> = this.data
    ? { ...this.data }
    : { periodCode: '', name: '', startDate: '', endDate: '', applicationDeadline: '', isActive: false };
}
