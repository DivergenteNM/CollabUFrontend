import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CompanyProfile } from '../../../../features/applications/services/application.service';

const SIZE_LABELS: Record<string, string> = {
  startup: 'Startup',
  small: 'Pequeña (1-50)',
  medium: 'Mediana (51-250)',
  large: 'Grande (251-1000)',
  enterprise: 'Corporación (1000+)',
};

/**
 * Info de empresa para que el estudiante la conozca antes de decidir/aceptar.
 * Muestra calificaciones, reseñas y enlace a la vista pública.
 */
@Component({
  selector: 'app-company-profile-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatTooltipModule,
  ],
  templateUrl: './company-profile-card.component.html',
  styleUrl: './company-profile-card.component.scss',
})
export class CompanyProfileCardComponent {
  readonly company = input<CompanyProfile | null>(null);

  readonly sizeLabel = computed(() => {
    const size = this.company()?.companySize;
    return size ? (SIZE_LABELS[size] ?? size) : '';
  });

  readonly publicProfileId = computed(() => {
    const c = this.company() as any;
    return c?.companyId || c?.id || c?.userId || null;
  });
}
