import { Component, ChangeDetectionStrategy, input, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { ApiResponse } from '../../../../core/models';
import { StarRatingComponent } from '../../../../shared/components/ui/star-rating/star-rating.component';

interface SupervisionDetail {
  applicationId: string;
  student: {
    id: string;
    name: string;
    program: string;
    semester: number;
    avatarUrl?: string;
  };
  company: {
    name: string;
    logoUrl?: string;
  };
  project: {
    title: string;
    type: string;
  };
  hoursCompleted: number;
  hoursRequired: number;
  status: string;
  deliverables: Deliverable[];
  evaluations: EvaluationSummary[];
}

interface Deliverable {
  id: string;
  title: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  submittedAt?: string;
  fileUrl?: string;
}

interface EvaluationSummary {
  id: string;
  evaluatorName: string;
  overallRating: number;
  comment: string;
  createdAt: string;
}

@Component({
  selector: 'app-student-supervision',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink, MatIconModule, MatButtonModule, MatCardModule,
    MatTabsModule, MatProgressBarModule, MatChipsModule,
    DatePipe, StarRatingComponent,
  ],
  templateUrl: './student-supervision.component.html',
  styleUrl: './student-supervision.component.scss',
})
export class StudentSupervisionComponent {
  readonly applicationId = input.required<string>();
  private readonly router = inject(Router);

  readonly resource = httpResource<ApiResponse<SupervisionDetail>>(
    () => ({ url: `${environment.apiUrl}/faculty/students/${this.applicationId()}` })
  );

  deliverableStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      submitted: 'Entregado',
      approved: 'Aprobado',
      rejected: 'Rechazado',
    };
    return labels[status] ?? status;
  }
}
