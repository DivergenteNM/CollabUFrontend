import {
  Component, ChangeDetectionStrategy, inject, computed, PLATFORM_ID, input, effect,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { httpResource } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { DatePipe, Location } from '@angular/common';

import { environment } from '../../../../../environments/environment';
import { ApiResponse, Project, MatchBreakdown } from '../../../../core/models';
import { MatchResult } from '../../../../core/models/matching.model';
import { AuthStore } from '../../../../state/auth.store';
import { SeoService } from '../../../../core/services/seo.service';
import { StatusBadgeComponent } from '../../../../shared/components/ui/status-badge/status-badge.component';
import { MatchScoreCardComponent } from '../../../../shared/components/cards/match-score-card/match-score-card.component';
import { SkillChipListComponent } from '../../../../shared/components/ui/skill-chip-list/skill-chip-list.component';
import { SkeletonComponent } from '../../../../shared/components/ui/skeleton/skeleton.component';
import { ApplyDialogComponent, ApplyDialogData } from '../../components/apply-dialog/apply-dialog.component';

@Component({
  selector: 'app-project-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule, MatIconModule, MatButtonModule, MatChipsModule,
    MatTabsModule, MatDividerModule, DatePipe,
    StatusBadgeComponent, MatchScoreCardComponent, SkillChipListComponent,
    SkeletonComponent,
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
  private readonly seoService = inject(SeoService);

  readonly id = input.required<string>();

  constructor() {
    effect(() => {
      const p = this.project();
      if (p) {
        const companyName = p.companyName || 'Universidad de Nariño';
        const pageTitle = `${p.title} - ${companyName}`;
        const descriptionSnippet = p.description
          ? (p.description.length > 160 ? `${p.description.substring(0, 157)}...` : p.description)
          : `Convocatoria de práctica profesional ${p.title} en ${companyName}.`;
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://collabu.udenar.edu.co';
        const pageUrl = `${origin}/projects/${p.id}`;

        this.seoService.setMetaTags({
          title: pageTitle,
          description: descriptionSnippet,
          ogTitle: pageTitle,
          ogDescription: descriptionSnippet,
          ogType: 'job',
          ogUrl: pageUrl,
          robots: 'index, follow',
        });

        const jobPostingSchema = {
          '@context': 'https://schema.org',
          '@type': 'JobPosting',
          'title': p.title,
          'description': p.description || descriptionSnippet,
          'datePosted': (p as any).createdAt || new Date().toISOString(),
          'validThrough': (p as any).applicationDeadline || undefined,
          'employmentType': 'INTERN',
          'hiringOrganization': {
            '@type': 'Organization',
            'name': companyName,
          },
          'jobLocation': {
            '@type': 'Place',
            'address': {
              '@type': 'PostalAddress',
              'addressLocality': (p as any).location || 'Pasto',
              'addressRegion': 'Nariño',
              'addressCountry': 'CO',
            },
          },
        };

        this.seoService.setStructuredData(jobPostingSchema, 'project-detail-jsonld');
      }
    });
  }

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

  matchBreakdown(match: MatchResult): MatchBreakdown {
    return {
      overall: match.overallScore,
      skill: match.skillScore,
      experience: match.experienceScore,
      education: match.educationScore,
      availability: match.availabilityScore,
      rating: match.ratingScore,
    };
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
