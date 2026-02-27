import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { httpResource } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { ApiResponse, StudentProfile, CompanyProfile } from '../../../../core/models';
import { AuthStore } from '../../../../state/auth.store';
import { UserRole } from '../../../../core/enums/user-role.enum';
import { SkillChipListComponent } from '../../../../shared/components/ui/skill-chip-list/skill-chip-list.component';

@Component({
  selector: 'app-profile-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink, MatIconModule, MatButtonModule, MatCardModule,
    MatChipsModule, MatProgressBarModule, SkillChipListComponent,
  ],
  template: `
    <div class="profile-view">
      <div class="profile-view__header">
        <h1>Mi Perfil</h1>
        <a mat-flat-button routerLink="/profile/edit">
          <mat-icon>edit</mat-icon>
          Editar Perfil
        </a>
      </div>

      @if (authStore.isStudent()) {
        @if (studentResource.isLoading()) {
          <mat-card><mat-card-content><p>Cargando perfil...</p></mat-card-content></mat-card>
        }

        @if (studentResource.value()?.data; as s) {
          <mat-card class="profile-view__main">
            <mat-card-content>
              <div class="profile-header">
                <div class="avatar">
                  <mat-icon>person</mat-icon>
                </div>
                <div>
                  <h2>{{ authStore.displayName() }}</h2>
                  <p>{{ s.program }} · Semestre {{ s.semester }}</p>
                  <p><mat-icon>badge</mat-icon> Código: {{ s.studentCode }}</p>
                </div>
              </div>

              <!-- Profile Completeness -->
              <div class="completeness">
                <span>Perfil {{ s.profileCompleteness }}% completo</span>
                <mat-progress-bar mode="determinate" [value]="s.profileCompleteness" />
              </div>

              @if (s.bio) {
                <div class="section">
                  <h3>Acerca de</h3>
                  <p>{{ s.bio }}</p>
                </div>
              }

              <!-- Skills -->
              @if (s.skills.length > 0) {
                <div class="section">
                  <h3>
                    Habilidades
                    <a mat-button routerLink="/profile/skills" class="section-link">Gestionar</a>
                  </h3>
                  <app-skill-chip-list [skills]="skillNames()" [maxVisible]="10" />
                </div>
              }

              <!-- Practice Hours -->
              <div class="section">
                <h3>Horas de Práctica</h3>
                <div class="hours-info">
                  <span class="hours-value">{{ s.practiceHoursCompleted }}/{{ s.practiceHoursRequired }}h</span>
                  <mat-progress-bar mode="determinate"
                    [value]="(s.practiceHoursCompleted / s.practiceHoursRequired) * 100" />
                </div>
              </div>

              <!-- Links -->
              @if (s.linkedinUrl || s.githubUrl || s.portfolioUrl) {
                <div class="section">
                  <h3>Enlaces</h3>
                  <div class="links">
                    @if (s.linkedinUrl) {
                      <a [href]="s.linkedinUrl" target="_blank" class="link-item">
                        <mat-icon>link</mat-icon> LinkedIn
                      </a>
                    }
                    @if (s.githubUrl) {
                      <a [href]="s.githubUrl" target="_blank" class="link-item">
                        <mat-icon>code</mat-icon> GitHub
                      </a>
                    }
                    @if (s.portfolioUrl) {
                      <a [href]="s.portfolioUrl" target="_blank" class="link-item">
                        <mat-icon>language</mat-icon> Portfolio
                      </a>
                    }
                  </div>
                </div>
              }

              <!-- Documents -->
              @if (s.documents.length > 0) {
                <div class="section">
                  <h3>
                    Documentos
                    <a mat-button routerLink="/profile/documents" class="section-link">Gestionar</a>
                  </h3>
                  <div class="doc-list">
                    @for (doc of s.documents; track doc.id) {
                      <div class="doc-item">
                        <mat-icon>description</mat-icon>
                        <span>{{ doc.originalName }}</span>
                        <span class="doc-type">{{ docTypeLabel(doc.documentType) }}</span>
                      </div>
                    }
                  </div>
                </div>
              }
            </mat-card-content>
          </mat-card>
        }
      }

      @if (authStore.isCompany()) {
        @if (companyResource.isLoading()) {
          <mat-card><mat-card-content><p>Cargando perfil...</p></mat-card-content></mat-card>
        }

        @if (companyResource.value()?.data; as c) {
          <mat-card class="profile-view__main">
            <mat-card-content>
              <div class="profile-header">
                <div class="avatar company-avatar">
                  @if (c.logoUrl) {
                    <img [src]="c.logoUrl" [alt]="c.companyName" />
                  } @else {
                    <mat-icon>business</mat-icon>
                  }
                </div>
                <div>
                  <h2>{{ c.companyName }}</h2>
                  <p>{{ c.industry }} · {{ c.city }}, {{ c.department }}</p>
                  <p><mat-icon>badge</mat-icon> NIT: {{ c.nit }}</p>
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
                    <span class="info-label">Tamaño</span>
                    <span>{{ c.companySize }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Proyectos activos</span>
                    <span>{{ c.activeProjects }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Rating promedio</span>
                    <span>{{ c.averageRating ?? 'N/A' }}</span>
                  </div>
                  @if (c.websiteUrl) {
                    <div class="info-item">
                      <span class="info-label">Sitio web</span>
                      <a [href]="c.websiteUrl" target="_blank">{{ c.websiteUrl }}</a>
                    </div>
                  }
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        }
      }

      @if (authStore.isFaculty() || authStore.isAdmin()) {
        <mat-card class="profile-view__main">
          <mat-card-content>
            <div class="profile-header">
              <div class="avatar">
                <mat-icon>person</mat-icon>
              </div>
              <div>
                <h2>{{ authStore.displayName() }}</h2>
                <p>{{ authStore.role() }}</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: `
    .profile-view {
      max-width: 800px;
      margin: 0 auto;

      &__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 24px;

        h1 {
          font-size: 1.75rem;
          font-weight: 500;
        }
      }
    }

    .profile-header {
      display: flex;
      gap: 20px;
      align-items: center;
      margin-bottom: 24px;

      h2 {
        margin: 0 0 4px;
        font-size: 1.5rem;
      }

      p {
        margin: 2px 0;
        color: var(--mat-sys-on-surface-variant);
        display: flex;
        align-items: center;
        gap: 4px;

        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }
    }

    .avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: var(--mat-sys-surface-variant);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      mat-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
        color: var(--mat-sys-on-surface-variant);
      }

      &.company-avatar {
        border-radius: 12px;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 12px;
        }
      }
    }

    .completeness {
      margin-bottom: 24px;
      padding: 12px 16px;
      background: color-mix(in srgb, var(--mat-sys-primary) 5%, transparent);
      border-radius: 8px;

      span {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--mat-sys-primary);
        margin-bottom: 8px;
        display: block;
      }
    }

    .section {
      margin-bottom: 24px;

      h3 {
        font-size: 1rem;
        font-weight: 600;
        margin-bottom: 12px;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .section-link {
        font-size: 0.8125rem;
        margin-left: auto;
      }
    }

    .hours-info {
      .hours-value {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--mat-sys-primary);
        margin-bottom: 8px;
        display: block;
      }
    }

    .links {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .link-item {
      display: flex;
      align-items: center;
      gap: 4px;
      color: var(--mat-sys-primary);
      text-decoration: none;

      &:hover { text-decoration: underline; }
    }

    .doc-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .doc-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 8px;
      background: color-mix(in srgb, var(--mat-sys-surface-variant) 50%, transparent);

      span:first-of-type { flex: 1; }
      .doc-type {
        font-size: 0.75rem;
        color: var(--mat-sys-on-surface-variant);
      }
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .info-item {
      .info-label {
        display: block;
        font-size: 0.8125rem;
        color: var(--mat-sys-on-surface-variant);
        margin-bottom: 4px;
      }

      a {
        color: var(--mat-sys-primary);
        text-decoration: none;
        &:hover { text-decoration: underline; }
      }
    }
  `,
})
export class ProfileViewComponent {
  readonly authStore = inject(AuthStore);

  readonly studentResource = httpResource<ApiResponse<StudentProfile>>(
    () => this.authStore.isStudent()
      ? { url: `${environment.apiUrl}/students/profile` }
      : undefined
  );

  readonly companyResource = httpResource<ApiResponse<CompanyProfile>>(
    () => this.authStore.isCompany()
      ? { url: `${environment.apiUrl}/companies/profile` }
      : undefined
  );

  readonly skillNames = computed(() =>
    this.studentResource.value()?.data?.skills?.map(s => s.name) ?? []
  );

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
}
