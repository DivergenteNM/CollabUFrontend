import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { httpResource } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { ApiResponse, StudentProfile } from '../../../../core/models';
import { StarRatingComponent } from '../../../../shared/components/ui/star-rating/star-rating.component';

@Component({
  selector: 'app-student-public-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIconModule, MatButtonModule, MatCardModule,
    MatChipsModule, StarRatingComponent,
  ],
  template: `
    <div class="public-profile">
      <button mat-button (click)="history.back()">
        <mat-icon>arrow_back</mat-icon>
        Volver
      </button>

      @if (resource.isLoading()) {
        <mat-card><mat-card-content><p>Cargando perfil...</p></mat-card-content></mat-card>
      }

      @if (resource.value()?.data; as s) {
        <mat-card>
          <mat-card-content>
            <div class="profile-header">
              <div class="avatar">
                <mat-icon>person</mat-icon>
              </div>
              <div class="profile-info">
                <h2>{{ s.program }}</h2>
                <p>Semestre {{ s.semester }}</p>
                @if (s.averageRating) {
                  <app-star-rating [value]="s.averageRating" [readonly]="true" size="sm" />
                }
              </div>
            </div>

            @if (s.bio) {
              <div class="section">
                <h3>Acerca de</h3>
                <p>{{ s.bio }}</p>
              </div>
            }

            @if (s.skills.length > 0) {
              <div class="section">
                <h3>Habilidades</h3>
                <div class="skills-detailed">
                  @for (skill of s.skills; track skill.id) {
                    <mat-chip-set>
                      <mat-chip>
                        {{ skill.name }}
                        <span class="skill-level">{{ levelLabel(skill.proficiencyLevel) }}</span>
                      </mat-chip>
                    </mat-chip-set>
                  }
                </div>
              </div>
            }

            @if (s.workExperience.length > 0) {
              <div class="section">
                <h3>Experiencia</h3>
                @for (exp of s.workExperience; track exp.id) {
                  <div class="experience-item">
                    <strong>{{ exp.position }}</strong>
                    <span class="exp-company">{{ exp.companyName }}</span>
                    <p>{{ exp.description }}</p>
                  </div>
                }
              </div>
            }

            @if (s.linkedinUrl || s.githubUrl || s.portfolioUrl) {
              <div class="section">
                <h3>Enlaces</h3>
                <div class="links">
                  @if (s.linkedinUrl) {
                    <a [href]="s.linkedinUrl" target="_blank"><mat-icon>link</mat-icon> LinkedIn</a>
                  }
                  @if (s.githubUrl) {
                    <a [href]="s.githubUrl" target="_blank"><mat-icon>code</mat-icon> GitHub</a>
                  }
                  @if (s.portfolioUrl) {
                    <a [href]="s.portfolioUrl" target="_blank"><mat-icon>language</mat-icon> Portfolio</a>
                  }
                </div>
              </div>
            }
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: `
    .public-profile {
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

    .avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: var(--mat-sys-surface-variant);
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
        color: var(--mat-sys-on-surface-variant);
      }
    }

    .profile-info h2 {
      margin: 0 0 4px;
      font-size: 1.5rem;
    }

    .profile-info p {
      margin: 0;
      color: var(--mat-sys-on-surface-variant);
    }

    .section {
      margin-bottom: 24px;

      h3 {
        font-size: 1rem;
        font-weight: 600;
        margin-bottom: 12px;
      }
    }

    .skills-detailed {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;

      .skill-level {
        font-size: 0.75rem;
        opacity: 0.7;
        margin-left: 4px;
      }
    }

    .experience-item {
      padding: 12px 0;
      border-bottom: 1px solid var(--mat-sys-outline-variant);

      &:last-child { border-bottom: none; }

      strong { display: block; }
      .exp-company {
        font-size: 0.875rem;
        color: var(--mat-sys-on-surface-variant);
      }
      p {
        margin-top: 8px;
        font-size: 0.9375rem;
      }
    }

    .links {
      display: flex;
      gap: 16px;

      a {
        display: flex;
        align-items: center;
        gap: 4px;
        color: var(--mat-sys-primary);
        text-decoration: none;
        &:hover { text-decoration: underline; }
      }
    }
  `,
})
export class StudentPublicProfileComponent {
  readonly id = input.required<string>();
  readonly history = window.history;

  readonly resource = httpResource<ApiResponse<StudentProfile>>(
    () => ({ url: `${environment.apiUrl}/students/${this.id()}/profile` })
  );

  levelLabel(level: string): string {
    const labels: Record<string, string> = {
      basic: 'Básico', intermediate: 'Intermedio',
      advanced: 'Avanzado', expert: 'Experto',
    };
    return labels[level] ?? level;
  }
}
