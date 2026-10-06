import { Component, ChangeDetectionStrategy, input, computed, signal, inject } from '@angular/core';
import { DecimalPipe, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { httpResource } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { StudentProfile, UserProfile } from '../../../../core/models';
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
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  readonly id = input<string>();
  readonly profileId = computed(() => this.id() || this.route.snapshot.paramMap.get('id') || '');

  readonly avatarLoadError = signal(false);

  readonly resource = httpResource<any>(() => {
    const id = this.profileId();
    if (!id) return undefined;
    return { url: `${environment.apiUrl}/students/profile/${id}` };
  });

  readonly student = computed(() => {
    const res: any = this.resource.value();
    if (!res) return null;
    return (res.data ?? res) as StudentProfile;
  });

  readonly studentUserId = computed(() => this.student()?.userId ?? this.profileId());

  readonly userResource = httpResource<any>(() => {
    const userId = this.studentUserId();
    if (!userId) return undefined;
    return { url: `${environment.apiUrl}/users/profile/${userId}` };
  });

  readonly user = computed(() => {
    const res: any = this.userResource.value();
    const u = res ? (res.data ?? res) : null;
    return (u ?? this.student()?.user ?? null) as UserProfile | null;
  });

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

  goBack(): void {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/profile/view']);
    }
  }

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
