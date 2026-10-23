import { Component, ChangeDetectionStrategy, input, computed, signal, inject } from '@angular/core';
import { DecimalPipe, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { httpResource } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { CompanyProfile, Evaluation } from '../../../../core/models';
import { PublicEvaluationsResponse, PublicReviewsStats } from '../../../../features/evaluations/services/evaluation.service';
import { StarRatingComponent } from '../../../../shared/components/ui/star-rating/star-rating.component';
import { ProfileReviewsComponent } from '../../../../shared/components/ui/profile-reviews/profile-reviews.component';
import { resolveImageUrl } from '../../../../shared/utils';

@Component({
  selector: 'app-company-public-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe, MatIconModule, MatButtonModule, MatCardModule,
    MatChipsModule, StarRatingComponent, ProfileReviewsComponent,
  ],
  templateUrl: './company-public-profile.component.html',
  styleUrl: './company-public-profile.component.scss',
})
export class CompanyPublicProfileComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  readonly id = input<string>();
  readonly profileId = computed(() => this.id() || this.route.snapshot.paramMap.get('id') || '');

  readonly logoLoadError = signal(false);

  readonly resource = httpResource<any>(() => {
    const id = this.profileId();
    if (!id) return undefined;
    return { url: `${environment.apiUrl}/companies/profile/${id}` };
  });

  readonly reviewsResource = httpResource<any>(() => {
    const id = this.profileId();
    if (!id) return undefined;
    return { url: `${environment.apiUrl}/evaluations/company/${id}` };
  });

  readonly company = computed(() => {
    const res: any = this.resource.value();
    if (!res) return null;
    return (res.data ?? res) as CompanyProfile;
  });

  readonly reviewsData = computed<PublicEvaluationsResponse | null>(() => {
    const res: any = this.reviewsResource.value();
    if (!res) return null;
    return (res.data ?? res) as PublicEvaluationsResponse;
  });

  readonly evaluations = computed<Evaluation[]>(() => {
    return this.reviewsData()?.evaluations ?? [];
  });

  readonly reviewStats = computed<PublicReviewsStats | null>(() => {
    return this.reviewsData()?.stats ?? null;
  });

  readonly reviewsLoading = computed(() => this.reviewsResource.isLoading());

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

  goBack(): void {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/profile/view']);
    }
  }

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
