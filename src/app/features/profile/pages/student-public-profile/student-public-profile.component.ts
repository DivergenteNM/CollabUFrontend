import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { httpResource } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { ApiResponse, StudentProfile } from '../../../../core/models';
import { StarRatingComponent } from '../../../../shared/components/ui/star-rating/star-rating.component';

@Component({
  selector: 'app-student-public-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIconModule, MatButtonModule, MatCardModule,
    MatChipsModule, StarRatingComponent,
  ],
  templateUrl: './student-public-profile.component.html',
  styleUrl: './student-public-profile.component.scss',
})
export class StudentPublicProfileComponent {
  readonly id = input.required<string>();
  readonly history = window.history;

  readonly resource = httpResource<ApiResponse<StudentProfile>>(
    () => ({ url: `${environment.apiUrl}/students/profile/${this.id()}` })
  );

  levelLabel(level?: string): string {
    const labels: Record<string, string> = {
      basic: 'Básico',
      beginner: 'Principiante',
      intermediate: 'Intermedio',
      advanced: 'Avanzado', expert: 'Experto',
    };
    return (level && labels[level]) ?? level ?? 'Sin nivel';
  }
}
