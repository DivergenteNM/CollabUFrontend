import { Component, ChangeDetectionStrategy, inject, computed, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CompanyProfile, StudentProfile } from '../../../../core/models';
import { CompanyProfileService } from '../../../../core/services/company-profile.service';
import { StudentService } from '../../../students/services/student.service';
import { AuthStore } from '../../../../state/auth.store';
import { SkillChipListComponent } from '../../../../shared/components/ui/skill-chip-list/skill-chip-list.component';
import { FacultyService } from '../../../faculty/services/faculty.service';
import { ImageUrlPipe } from '../../../../shared/pipes';
import { resolveImageUrl } from '../../../../shared/utils';

@Component({
  selector: 'app-profile-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe, RouterLink, MatIconModule, MatButtonModule, MatCardModule,
    MatChipsModule, MatProgressBarModule, SkillChipListComponent,
    ImageUrlPipe,
  ],
  templateUrl: './profile-view.component.html',
  styleUrl: './profile-view.component.scss',
})
export class ProfileViewComponent {
  readonly authStore = inject(AuthStore);
  private readonly studentService = inject(StudentService);
  private readonly companyProfileService = inject(CompanyProfileService);
  private readonly facultyService = inject(FacultyService);

  readonly loading = signal(true);
  readonly student = signal<StudentProfile | null>(null);
  readonly company = signal<CompanyProfile | null>(null);
  readonly supervisor = signal<any | null>(null);
  readonly companyLogoLoadError = signal(false);
  readonly studentAvatarLoadError = signal(false);

  readonly resolvedCompanyLogoUrl = computed(() => {
    const c = this.company();
    return resolveImageUrl(c?.logoUrl || this.authStore.profile()?.avatarUrl);
  });

  readonly companyInitials = computed(() => {
    const name = this.company()?.companyName?.trim();
    if (!name) return 'EMP';
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  });

  readonly resolvedStudentAvatarUrl = computed(() => {
    return resolveImageUrl(this.authStore.profile()?.avatarUrl || this.student()?.user?.avatarUrl);
  });

  readonly studentInitials = computed(() => {
    const name = (this.authStore.displayName() || this.student()?.user?.firstName || 'Estudiante').trim();
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  });

  readonly missingCompanyCompleteness = computed(() => {
    const c = this.company();
    if (!c) return [];
    const missing: { key: string; label: string }[] = [];
    if (!c.logoUrl && !this.authStore.profile()?.avatarUrl) missing.push({ key: 'logo', label: 'Logo institucional' });
    if (!c.legalName) missing.push({ key: 'legal', label: 'Razón social' });
    if (!c.website && !c.websiteUrl) missing.push({ key: 'web', label: 'Sitio web' });
    if (!c.description || c.description.length < 20) missing.push({ key: 'desc', label: 'Descripción completa' });
    if (!c.contacts || c.contacts.length === 0) missing.push({ key: 'contacts', label: 'Contactos clave' });
    if (!c.locations || c.locations.length === 0) missing.push({ key: 'locations', label: 'Sedes u oficinas' });
    if (!c.businessAreas || c.businessAreas.length === 0) missing.push({ key: 'areas', label: 'Áreas de negocio' });
    return missing;
  });

  readonly missingStudentCompleteness = computed(() => {
    const s = this.student();
    if (!s) return [];
    const missing: { key: string; label: string; route?: string }[] = [];
    if (!this.authStore.profile()?.avatarUrl && !s.user?.avatarUrl) {
      missing.push({ key: 'avatar', label: 'Foto de perfil', route: '/profile/edit' });
    }
    if (!s.headline) {
      missing.push({ key: 'headline', label: 'Titular profesional', route: '/profile/edit' });
    }
    if (!s.bio || s.bio.length < 20) {
      missing.push({ key: 'bio', label: 'Acerca de mí', route: '/profile/edit' });
    }
    if (!s.skills || s.skills.length === 0) {
      missing.push({ key: 'skills', label: 'Habilidades técnicas', route: '/profile/skills' });
    }
    if (!s.experiences || s.experiences.length === 0) {
      missing.push({ key: 'experiences', label: 'Experiencia / Proyectos', route: '/profile/edit' });
    }
    if (!s.education || s.education.length === 0) {
      missing.push({ key: 'education', label: 'Historial educativo', route: '/profile/edit' });
    }
    if (!s.languages || s.languages.length === 0) {
      missing.push({ key: 'languages', label: 'Idiomas', route: '/profile/edit' });
    }
    if (!s.cvUrl) {
      missing.push({ key: 'cv', label: 'Curriculum Vitae (CV)', route: '/profile/edit' });
    }
    if (!s.githubUrl && !s.portfolioUrl && !this.authStore.profile()?.linkedinUrl) {
      missing.push({ key: 'links', label: 'Portafolio o Enlaces', route: '/profile/edit' });
    }
    return missing;
  });

  constructor() {
    this.loadProfile();
  }

  onCompanyLogoError(): void {
    this.companyLogoLoadError.set(true);
  }

  onCompanyLogoLoad(): void {
    this.companyLogoLoadError.set(false);
  }

  onStudentAvatarError(): void {
    this.studentAvatarLoadError.set(true);
  }

  onStudentAvatarLoad(): void {
    this.studentAvatarLoadError.set(false);
  }

  readonly skillNames = computed(() =>
    this.student()?.skills?.map((s) => s.name) ?? []
  );

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

  getLanguageProficiency(lang: any): string {
    return lang?.proficiencyLevel ?? lang?.proficiency ?? '';
  }

  getInterestName(interest: any): string {
    return interest?.interestName ?? interest?.area ?? '';
  }

  supervisorRoleLabel(role?: string): string {
    const labels: Record<string, string> = {
      academic_director: 'Director Académico',
      internship_coordinator: 'Coordinador de Pasantías',
      thesis_advisor: 'Asesor de Tesis',
      faculty_supervisor: 'Supervisor de Facultad',
    };
    return (role && labels[role]) ?? role ?? 'Docente';
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

  docTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      resume: 'CV',
      transcript: 'Certificado Notas',
      certificate: 'Certificado',
      id_document: 'Documento ID',
      other: 'Otro',
    };
    return labels[type] ?? type;
  }

  companySizeLabel(size?: string): string {
    const labels: Record<string, string> = {
      startup: 'Startup (1-10 colaboradores)',
      micro: 'Microempresa (1-10 colaboradores)',
      small: 'Pequeña empresa (11-50 colaboradores)',
      medium: 'Mediana empresa (51-200 colaboradores)',
      large: 'Grande empresa (201-1000 colaboradores)',
      enterprise: 'Corporativa / Enterprise (+1000 colaboradores)',
    };
    return (size && labels[size]) ?? size ?? 'No especificado';
  }

  verificationStatusLabel(status?: string): string {
    const labels: Record<string, string> = {
      verified: 'Empresa Verificada',
      pending: 'En revisión institucional',
      rejected: 'Verificación no aprobada',
      suspended: 'Cuenta suspendida',
    };
    return (status && labels[status]) ?? 'Pendiente de verificación';
  }

  private loadProfile(): void {
    this.loading.set(true);

    if (this.authStore.isStudent()) {
      this.studentService.getProfile().subscribe({
        next: (res) => {
          this.student.set({
            ...res.data,
            education: res.data.education ?? res.data.academicInfo ?? [],
            experiences: res.data.experiences ?? res.data.workExperience ?? [],
            languages: res.data.languages ?? [],
            interests: res.data.interests ?? [],
          });

          // Fetch nested lists in background to guarantee accuracy
          this.studentService.getLanguages().subscribe({
            next: (langRes) => {
              this.student.update(s => s ? { ...s, languages: langRes.data } : null);
            }
          });
          this.studentService.getInterests().subscribe({
            next: (intRes) => {
              this.student.update(s => s ? { ...s, interests: intRes.data } : null);
            }
          });

          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
      return;
    }

    if (this.authStore.isCompany()) {
      this.companyProfileService.getProfile().subscribe({
        next: (res) => {
          this.company.set(res.data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
      return;
    }

    if (this.authStore.isFaculty()) {
      this.facultyService.getMyProfile().subscribe({
        next: (res) => {
          this.supervisor.set(res);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
      return;
    }

    this.loading.set(false);
  }
}
