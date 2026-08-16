import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CompanyProfile } from '../../../../features/applications/services/application.service';

const SIZE_LABELS: Record<string, string> = {
  startup: 'Startup', small: 'Pequeña (1-50)', medium: 'Mediana (51-250)',
  large: 'Grande (251-1000)', enterprise: 'Corporación (1000+)',
};

/**
 * Info de empresa para que el estudiante la conozca antes de decidir/aceptar.
 * Muestra "sin calificaciones aún" en vez de 0★ — el rating solo se llena
 * cuando el ciclo de evaluaciones post-proyecto está conectado (pendiente,
 * ver nota en application.service.ts backend).
 */
@Component({
  selector: 'app-company-profile-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatIconModule, MatChipsModule, MatTooltipModule],
  template: `
    <mat-card class="cpc">
      <mat-card-header>
        <div class="cpc__logo" mat-card-avatar>
          @if (company()?.logoUrl) {
            <img [src]="company()!.logoUrl" [alt]="company()!.companyName" />
          } @else {
            <mat-icon>business</mat-icon>
          }
        </div>
        <mat-card-title>{{ company()?.companyName ?? 'Empresa' }}</mat-card-title>
        <mat-card-subtitle>
          @if (company()?.industry) { {{ company()!.industry }} }
          @if (company()?.headquartersCity) { · {{ company()!.headquartersCity }} }
        </mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        @if (company()?.verificationStatus === 'verified') {
          <span class="cpc__verified"><mat-icon>verified</mat-icon> Empresa verificada</span>
        }

        <div class="cpc__rating">
          @if ((company()?.totalReviews ?? 0) > 0) {
            <mat-icon class="cpc__star">star</mat-icon>
            <span>{{ company()!.rating }}/5 · {{ company()!.totalReviews }} reseñas</span>
          } @else {
            <span class="cpc__no-rating">Sin calificaciones aún</span>
          }
        </div>

        @if (company()?.description) {
          <p class="cpc__desc">{{ company()!.description }}</p>
        }

        <div class="cpc__stats">
          @if (company()?.companySize) {
            <span class="cpc__stat"><mat-icon>groups</mat-icon> {{ sizeLabel() }}</span>
          }
          @if (company()?.foundedYear) {
            <span class="cpc__stat"><mat-icon>event</mat-icon> Desde {{ company()!.foundedYear }}</span>
          }
          @if ((company()?.totalProjects ?? 0) > 0) {
            <span class="cpc__stat"><mat-icon>work_outline</mat-icon> {{ company()!.totalProjects }} proyectos</span>
          }
        </div>

        @if (company()?.businessAreas?.length) {
          <div class="cpc__chips">
            @for (a of company()!.businessAreas; track a) {
              <span class="cpc__chip">{{ a }}</span>
            }
          </div>
        }

        @if (company()?.website) {
          <a class="cpc__link" [href]="company()!.website" target="_blank" rel="noopener">
            <mat-icon>language</mat-icon> Sitio web
          </a>
        }

        @if (!company()) {
          <p class="cpc__empty">Esta empresa no completó su perfil todavía.</p>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .cpc__logo { width: 40px; height: 40px; border-radius: 8px; overflow: hidden;
      display: flex; align-items: center; justify-content: center; background: var(--bg-tertiary); }
    .cpc__logo img { width: 100%; height: 100%; object-fit: cover; }
    .cpc__verified { display: flex; align-items: center; gap: 4px; font-size: .75rem;
      color: var(--color-success); margin-bottom: 8px; }
    .cpc__verified mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .cpc__rating { display: flex; align-items: center; gap: 6px; margin-bottom: 10px; font-size: .8125rem; }
    .cpc__star { color: #f5a623; font-size: 18px; width: 18px; height: 18px; }
    .cpc__no-rating { color: var(--text-secondary); font-style: italic; }
    .cpc__desc { font-size: .8125rem; color: var(--text-secondary); line-height: 1.5; margin: 0 0 12px; }
    .cpc__stats { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 10px; }
    .cpc__stat { display: flex; align-items: center; gap: 4px; font-size: .75rem; color: var(--text-secondary); }
    .cpc__stat mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .cpc__chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
    .cpc__chip { background: var(--bg-tertiary); padding: 3px 10px; border-radius: 12px; font-size: .6875rem; }
    .cpc__link { display: inline-flex; align-items: center; gap: 4px; font-size: .8125rem; color: var(--color-primary); }
    .cpc__link mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .cpc__empty { color: var(--text-secondary); font-size: .8125rem; font-style: italic; }
  `],
})
export class CompanyProfileCardComponent {
  readonly company = input<CompanyProfile | null>(null);

  readonly sizeLabel = computed(() => {
    const size = this.company()?.companySize;
    return size ? (SIZE_LABELS[size] ?? size) : '';
  });
}
