import { Component, ChangeDetectionStrategy, input, computed, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { httpResource } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { ApiResponse, StudentProfile, UserProfile } from '../../../../core/models';
import { StarRatingComponent } from '../../../../shared/components/ui/star-rating/star-rating.component';
import { resolveImageUrl } from '../../../../shared/utils';

@Component({
  selector: 'app-student-public-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe, MatIconModule, MatButtonModule, MatCardModule,
    MatChipsModule, StarRatingComponent,
  ],
  templateUrl: './student-public-profile.component.html',
  styleUrl: './student-public-profile.component.scss',
})
export class StudentPublicProfileComponent {
  readonly id = input.required<string>();
  readonly history = window.history;

  readonly avatarLoadError = signal(false);

  readonly resource = httpResource<ApiResponse<StudentProfile>>(
    () => ({ url: `${environment.apiUrl}/students/profile/${this.id()}` })
  );

  readonly student = computed(() => this.resource.value()?.data ?? null);

  readonly studentUserId = computed(() => this.student()?.userId ?? this.id());

  readonly userResource = httpResource<ApiResponse<UserProfile>>(
    () => ({ url: `${environment.apiUrl}/users/profile/${this.studentUserId()}` })
  );

  readonly user = computed(() => this.userResource.value()?.data ?? this.student()?.user ?? null);

  readonly studentDisplayName = computed(() => {
    const u = this.user();
    if (u?.firstName || u?.lastName) {
      return `${u?.firstName ?? ''} ${u?.lastName ?? ''}`.trim();
    }
    return this.student()?.program || 'Estudiante';
  });

  readonly resolvedAvatarUrl = computed(() => {
    return resolveImageUrl(this.user()?.avatarUrl);
  });

  readonly studentInitials = computed(() => {
    const name = this.studentDisplayName().trim();
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  });

  onAvatarError(): void {
    this.avatarLoadError.set(true);
  }

  onAvatarLoad(): void {
    this.avatarLoadError.set(false);
  }

  cleanUrl(url?: string | null): string | null {
    if (!url) return null;
    return url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
  }

  levelLabel(level?: string): string {
    const labels: Record<string, string> = {
      basic: 'Básico',
      beginner: 'Principiante',
      intermediate: 'Intermedio',
      advanced: 'Avanzado',
      expert: 'Experto',
      native: 'Nativo',
    };
    return (level && labels[level]) ?? level ?? 'Sin nivel';
  }

  availabilityLabel(avail?: string): string {
    const labels: Record<string, string> = {
      full_time: 'Tiempo Completo',
      part_time: 'Medio Tiempo',
      flexible: 'Horario Flexible',
      unavailable: 'No Disponible',
    };
    return (avail && labels[avail]) ?? 'Flexible';
  }

  workModeLabel(mode?: string): string {
    const labels: Record<string, string> = {
      remote: 'Remoto',
      hybrid: 'Híbrido',
      on_site: 'Presencial',
      onsite: 'Presencial',
    };
    return (mode && labels[mode]) ?? 'Híbrido / Remoto';
  }

  expTypeLabel(type?: string): string {
    const labels: Record<string, string> = {
      work: 'Profesional',
      professional: 'Profesional',
      internship: 'Práctica / Pasantía',
      volunteer: 'Voluntariado',
      academic: 'Académica',
      freelance: 'Freelance',
      personal_project: 'Proyecto Personal',
    };
    return (type && labels[type]) ?? type ?? 'Experiencia';
  }
}
