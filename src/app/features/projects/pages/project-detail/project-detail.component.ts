import {
  Component, ChangeDetectionStrategy, inject, computed, signal, PLATFORM_ID, input, effect,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { httpResource } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { DatePipe, Location } from '@angular/common';

import { environment } from '../../../../../environments/environment';
import { ApiResponse, CompanyProfile, Project } from '../../../../core/models';
import { MatchResult, MatResultBreakdown } from '../../../../core/models/matching.model';
import { AuthStore } from '../../../../state/auth.store';
import { StatusBadgeComponent } from '../../../../shared/components/ui/status-badge/status-badge.component';
import { MatchScoreCardComponent } from '../../../../shared/components/cards/match-score-card/match-score-card.component';
import { SkillChipListComponent } from '../../../../shared/components/ui/skill-chip-list/skill-chip-list.component';
import { SkeletonComponent } from '../../../../shared/components/ui/skeleton/skeleton.component';
import { FileLinkComponent } from '../../../../shared/components/ui/file-link/file-link.component';
import { ApplyDialogComponent, ApplyDialogData } from '../../components/apply-dialog/apply-dialog.component';
import { AdminService } from '../../../admin/services/admin.service';
import { CompanyProfileService } from '../../../../core/services/company-profile.service';
import { AcademicProgram } from '../../../../core/models';

@Component({
  selector: 'app-project-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule, MatIconModule, MatButtonModule, MatChipsModule,
    MatDividerModule, DatePipe,
    StatusBadgeComponent, MatchScoreCardComponent, SkillChipListComponent,
    SkeletonComponent, FileLinkComponent,
  ],
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.scss',
})
export class ProjectDetailComponent {
  readonly router = inject(Router);
  readonly authStore = inject(AuthStore);
  private readonly dialog = inject(MatDialog);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  readonly location = inject(Location);
  private readonly adminService = inject(AdminService);
  private readonly companyProfileService = inject(CompanyProfileService);

  readonly id = input.required<string>();
  private readonly programs = signal<AcademicProgram[]>([]);
  readonly companyProfile = signal<CompanyProfile | null>(null);
  readonly companyProfileLoading = signal(false);

  readonly projectResource = httpResource<ApiResponse<Project>>(
    () => {
      const id = this.id();
      if (!this.isBrowser || !id) return undefined;
      return { url: `${environment.apiUrl}/projects/${id}` };
    },
  );

  readonly matchResource = httpResource<ApiResponse<MatchResult>>(
    () => {
      const id = this.id();
      if (!this.isBrowser || !id || !this.authStore.isStudent()) return undefined;
      return { url: `${environment.apiUrl}/matching/projects/${id}/my-match` };
    },
  );

  readonly project = computed(() => {
    try {
      const res = this.projectResource.value() as any;
      return res?.data ?? res ?? null;
    } catch {
      return null;
    }
  });

  readonly matchData = computed(() => {
    try {
      const res = this.matchResource.value() as any;
      return res?.data ?? res ?? null;
    } catch {
      return null;
    }
  });

  readonly hasError = computed(() => !!this.projectResource.error());
  readonly errorMessage = computed(() => {
    const err = this.projectResource.error() as any;
    return err?.message ?? 'No se pudo cargar el proyecto.';
  });

  constructor() {
    this.adminService.getPrograms(true).subscribe({
      next: (programs) => this.programs.set(programs),
      error: () => {},
    });

    let requestedCompanyId: string | null = null;
    effect(() => {
      const p = this.project();
      if (!p?.companyId || p.companyId === requestedCompanyId) return;
      requestedCompanyId = p.companyId;
      this.companyProfileLoading.set(true);
      this.companyProfileService.getProfileByUserId(p.companyId).subscribe({
        next: (res) => {
          this.companyProfileLoading.set(false);
          this.companyProfile.set((res as any)?.data ?? (res as any) ?? null);
        },
        error: () => {
          this.companyProfileLoading.set(false);
          this.companyProfile.set(null);
        },
      });
    });
  }

  academicProgramNames(project: Project): string[] {
    const ids = (project as any).academicPrograms ?? [];
    return ids.map((id: string) => this.programs().find((p) => p.id === id)?.name ?? id);
  }

  nonSkillRequirements(project: Project): any[] {
    return (project.requirements ?? []).filter((r: any) => r.type !== 'skill');
  }

  skillNames(project: Project): string[] {
    return ((project as any).skills ?? []).map((s: any) => s.name + (s.isMandatory ? '' : ' (deseable)'));
  }

  readonly projectTypeLabel = computed(() => {
    const typeMap: Record<string, string> = {
      professional_practice: 'Práctica Profesional',
      thesis: 'Tesis / Trabajo de Grado',
      research: 'Investigación',
      internship: 'Pasantía',
      other: 'Otro',
    };
    return typeMap[this.project()?.projectType ?? ''] ?? '';
  });

  matchBreakdown(match: MatchResult): MatResultBreakdown {
    return match;
  }

  getRequirementIcon(type: string): string {
    const map: Record<string, string> = {
      skill: 'code',
      education: 'school',
      experience: 'work',
      language: 'translate',
      other: 'checklist',
    };
    return map[type] ?? 'check';
  }

  readonly companySizeLabel = computed(() => {
    const map: Record<string, string> = {
      startup: 'Startup',
      micro: 'Microempresa',
      small: 'Pequeña empresa',
      medium: 'Mediana empresa',
      large: 'Gran empresa',
      enterprise: 'Corporación',
    };
    const size = this.companyProfile()?.companySize;
    return size ? (map[size] ?? size) : null;
  });

  proficiencyLabel(level: string): string {
    const map: Record<string, string> = {
      basic: 'Básico',
      intermediate: 'Intermedio',
      advanced: 'Avanzado',
      expert: 'Experto',
    };
    return map[level] ?? level;
  }

  openApplyDialog(project: Project): void {
    this.dialog.open(ApplyDialogComponent, {
      data: { projectId: project.id, projectTitle: project.title } as ApplyDialogData,
      width: '600px',
      disableClose: true,
    });
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      if (this.authStore.isCompany()) {
        this.router.navigate(['/my-projects']);
      } else {
        this.router.navigate(['/projects']);
      }
    }
  }
}
