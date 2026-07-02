import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { httpResource } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { ApiResponse, CompanyProfile } from '../../../../core/models';
import { StarRatingComponent } from '../../../../shared/components/ui/star-rating/star-rating.component';

@Component({
  selector: 'app-company-public-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIconModule, MatButtonModule, MatCardModule,
    MatChipsModule, StarRatingComponent,
  ],
  templateUrl: './company-public-profile.component.html',
  styleUrl: './company-public-profile.component.scss',
})
export class CompanyPublicProfileComponent {
  readonly id = input.required<string>();
  readonly history = window.history;

  readonly resource = httpResource<ApiResponse<CompanyProfile>>(
    () => ({ url: `${environment.apiUrl}/companies/profile/${this.id()}` })
  );

  sizeLabel(size?: string): string {
    const labels: Record<string, string> = {
      startup: 'Startup',
      micro: 'Micro',
      small: 'Pequeña',
      medium: 'Mediana',
      large: 'Grande',
      enterprise: 'Enterprise',
    };
    return (size && labels[size]) ?? size ?? 'N/A';
  }
}
