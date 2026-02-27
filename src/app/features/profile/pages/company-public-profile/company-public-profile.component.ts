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
  template: `
    <div class="company-profile">
      <button mat-button (click)="history.back()">
        <mat-icon>arrow_back</mat-icon>
        Volver
      </button>

      @if (resource.isLoading()) {
        <mat-card><mat-card-content><p>Cargando perfil...</p></mat-card-content></mat-card>
      }

      @if (resource.value()?.data; as c) {
        <mat-card>
          <mat-card-content>
            <div class="profile-header">
              <div class="company-logo">
                @if (c.logoUrl) {
                  <img [src]="c.logoUrl" [alt]="c.companyName" />
                } @else {
                  <mat-icon>business</mat-icon>
                }
              </div>
              <div class="company-info">
                <h2>
                  {{ c.companyName }}
                  @if (c.isVerified) {
                    <mat-icon class="verified-badge">verified</mat-icon>
                  }
                </h2>
                <p>{{ c.industry }} · {{ c.city }}, {{ c.department }}</p>
                @if (c.averageRating) {
                  <div class="rating-row">
                    <app-star-rating [value]="c.averageRating" [readonly]="true" size="sm" />
                    <span>({{ c.totalProjects }} proyectos)</span>
                  </div>
                }
              </div>
            </div>

            @if (c.description) {
              <div class="section">
                <h3>Descripción</h3>
                <p>{{ c.description }}</p>
              </div>
            }

            <div class="section">
              <h3>Información</h3>
              <div class="info-grid">
                <div class="info-item">
                  <span class="label">Tamaño</span>
                  <span>{{ sizeLabel(c.companySize) }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Proyectos activos</span>
                  <span>{{ c.activeProjects }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Total proyectos</span>
                  <span>{{ c.totalProjects }}</span>
                </div>
                @if (c.websiteUrl) {
                  <div class="info-item">
                    <span class="label">Sitio web</span>
                    <a [href]="c.websiteUrl" target="_blank">{{ c.websiteUrl }}</a>
                  </div>
                }
                @if (c.phone) {
                  <div class="info-item">
                    <span class="label">Teléfono</span>
                    <span>{{ c.phone }}</span>
                  </div>
                }
                @if (c.address) {
                  <div class="info-item">
                    <span class="label">Dirección</span>
                    <span>{{ c.address }}</span>
                  </div>
                }
              </div>
            </div>

            @if (c.contacts.length > 0) {
              <div class="section">
                <h3>Contactos</h3>
                @for (contact of c.contacts; track contact.id) {
                  <div class="contact-card">
                    <strong>{{ contact.fullName }}</strong>
                    <span>{{ contact.position }}</span>
                    <span>{{ contact.email }}</span>
                  </div>
                }
              </div>
            }
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: `
    .company-profile {
      max-width: 800px;
      margin: 0 auto;

      > button:first-child {
        margin-bottom: 16px;
      }
    }

    .profile-header {
      display: flex;
      gap: 20px;
      align-items: center;
      margin-bottom: 24px;
    }

    .company-logo {
      width: 80px;
      height: 80px;
      border-radius: 12px;
      background: var(--mat-sys-surface-variant);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      mat-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
        color: var(--mat-sys-on-surface-variant);
      }
    }

    .company-info h2 {
      margin: 0 0 4px;
      font-size: 1.5rem;
      display: flex;
      align-items: center;
      gap: 8px;

      .verified-badge {
        color: var(--mat-sys-primary);
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    .company-info p {
      margin: 0;
      color: var(--mat-sys-on-surface-variant);
    }

    .rating-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 4px;

      span {
        font-size: 0.8125rem;
        color: var(--mat-sys-on-surface-variant);
      }
    }

    .section {
      margin-bottom: 24px;

      h3 {
        font-size: 1rem;
        font-weight: 600;
        margin-bottom: 12px;
      }
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;

      @media (max-width: 599px) {
        grid-template-columns: 1fr;
      }
    }

    .info-item {
      .label {
        display: block;
        font-size: 0.8125rem;
        color: var(--mat-sys-on-surface-variant);
        margin-bottom: 2px;
      }

      a {
        color: var(--mat-sys-primary);
        text-decoration: none;
        &:hover { text-decoration: underline; }
      }
    }

    .contact-card {
      padding: 12px;
      border-radius: 8px;
      background: color-mix(in srgb, var(--mat-sys-surface-variant) 50%, transparent);
      margin-bottom: 8px;

      strong, span {
        display: block;
      }

      span {
        font-size: 0.875rem;
        color: var(--mat-sys-on-surface-variant);
      }
    }
  `,
})
export class CompanyPublicProfileComponent {
  readonly id = input.required<string>();
  readonly history = window.history;

  readonly resource = httpResource<ApiResponse<CompanyProfile>>(
    () => ({ url: `${environment.apiUrl}/companies/${this.id()}/profile` })
  );

  sizeLabel(size: string): string {
    const labels: Record<string, string> = {
      micro: 'Micro',
      small: 'Pequeña',
      medium: 'Mediana',
      large: 'Grande',
    };
    return labels[size] ?? size;
  }
}
