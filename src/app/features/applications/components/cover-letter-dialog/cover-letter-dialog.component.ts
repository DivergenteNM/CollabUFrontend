import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Application } from '../../../../core/models';
import { StatusBadgeComponent } from '../../../../shared/components/ui/status-badge/status-badge.component';

export interface CoverLetterDialogData {
  application: Application;
}

@Component({
  selector: 'app-cover-letter-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    StatusBadgeComponent,
  ],
  templateUrl: './cover-letter-dialog.component.html',
  styleUrl: './cover-letter-dialog.component.scss',
})
export class CoverLetterDialogComponent {
  readonly data = inject<CoverLetterDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<CoverLetterDialogComponent>);
  private readonly router = inject(Router);

  get application(): Application {
    return this.data.application;
  }

  get projectTitle(): string {
    return this.application.project?.title || this.application.projectTitle || 'Proyecto';
  }

  get companyName(): string {
    return this.application.companyName || this.application.project?.companyName || 'Empresa aliada';
  }

  goToWorkspace(): void {
    this.dialogRef.close();
    this.router.navigate(['/workspace', this.application.id]);
  }
}
