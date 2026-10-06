import { Component, ChangeDetectionStrategy, input, computed, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { httpResource } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { ApiResponse, CompanyProfile } from '../../../../core/models';
import { StarRatingComponent } from '../../../../shared/components/ui/star-rating/star-rating.component';
import { resolveImageUrl } from '../../../../shared/utils';

@Component({
  selector: 'app-company-public-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe, MatIconModule, MatButtonModule, MatCardModule,
    MatChipsModule, StarRatingComponent,
  ],
  templateUrl: './company-public-profile.component.html',
  styleUrl: './company-public-profile.component.scss',
})
export class CompanyPublicProfileComponent {
  readonly id = input.required<string>();
  readonly history = window.history;

  readonly logoLoadError = signal(false);

  readonly resource = httpResource<ApiResponse<CompanyProfile>>(
    () => ({ url: `${environment.apiUrl}/companies/profile/${this.id()}` })
  );

  readonly company = computed(() => this.resource.value()?.data ?? null);

  readonly resolvedLogoUrl = computed(() => {
    const c = this.company();
    return resolveImageUrl(c?.logoUrl);
  });

  readonly companyInitials = computed(() => {
    const name = this.company()?.companyName?.trim();
    if (!name) return 'EM';
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  });

  readonly cleanWebsiteUrl = computed(() => {
    const url = this.company()?.website ?? this.company()?.websiteUrl;
    if (!url) return null;
    return url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
  });

  onLogoError(): void {
    this.logoLoadError.set(true);
  }

  onLogoLoad(): void {
    this.logoLoadError.set(false);
  }

  sizeLabel(size?: string): string {
    const labels: Record<string, string> = {
      startup: 'Startup (1 - 10)',
      micro: 'Microempresa (1 - 10)',
      small: 'Pequeña empresa (11 - 50)',
      medium: 'Mediana empresa (51 - 200)',
      large: 'Gran empresa (201 - 500)',
      enterprise: 'Corporativo / Enterprise (+500)',
    };
    return (size && labels[size]) ?? size ?? 'No especificado';
  }

  verificationStatusLabel(status?: string): string {
    const labels: Record<string, string> = {
      verified: 'Verificada institucionalmente',
      pending: 'En proceso de verificación',
      rejected: 'Verificación rechazada',
      suspended: 'Cuenta suspendida',
    };
    return (status && labels[status]) ?? 'No verificada';
  }
}
