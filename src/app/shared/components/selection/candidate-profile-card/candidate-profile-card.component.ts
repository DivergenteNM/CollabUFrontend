import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { StudentProfile } from '../../../../core/models/student.model';

/**
 * Perfil del candidato para que la empresa lo evalúe sin salir del workspace.
 * Solo se renderiza cuando el viewer tiene `view_candidate` (empresa/admin);
 * el estudiante nunca ve esta tarjeta sobre sí mismo aquí.
 */
@Component({
  selector: 'app-candidate-profile-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatIconModule, MatChipsModule],
  template: `
    <mat-card class="capc">
      <mat-card-header>
        <mat-card-title>{{ fullName() ?? 'Estudiante' }}</mat-card-title>
        @if (student()?.headline) {
          <mat-card-subtitle>{{ student()!.headline }}</mat-card-subtitle>
        }
      </mat-card-header>
      <mat-card-content>
        @if (student(); as s) {
          <div class="capc__meta">
            @if (s.program) { <span class="capc__meta-item"><mat-icon>school</mat-icon> {{ s.program }}</span> }
            @if (s.semester) { <span class="capc__meta-item"><mat-icon>event_note</mat-icon> Semestre {{ s.semester }}</span> }
            @if (s.gpa) { <span class="capc__meta-item"><mat-icon>grade</mat-icon> Promedio {{ s.gpa }}</span> }
          </div>

          @if (s.bio) {
            <p class="capc__bio">{{ s.bio }}</p>
          }

          @if (s.skills.length) {
            <div class="capc__section-title">Habilidades</div>
            <div class="capc__chips">
              @for (sk of s.skills; track sk.id) {
                <span class="capc__chip">{{ sk.name }}</span>
              }
            </div>
          }

          @if (s.education.length) {
            <div class="capc__section-title">Formación</div>
            @for (e of s.education; track e.id) {
              <div class="capc__edu">
                <span class="capc__edu-degree">{{ e.degree }}</span>
                <span class="capc__edu-inst">{{ e.institution }}</span>
              </div>
            }
          }

          <div class="capc__links">
            @if (s.cvUrl) {
              <a [href]="s.cvUrl" target="_blank" rel="noopener" class="capc__link">
                <mat-icon>description</mat-icon> CV
              </a>
            }
            @if (s.portfolioUrl) {
              <a [href]="s.portfolioUrl" target="_blank" rel="noopener" class="capc__link">
                <mat-icon>work</mat-icon> Portafolio
              </a>
            }
            @if (s.githubUrl) {
              <a [href]="s.githubUrl" target="_blank" rel="noopener" class="capc__link">
                <mat-icon>code</mat-icon> GitHub
              </a>
            }
          </div>
        } @else {
          <p class="capc__empty">El estudiante no completó su perfil todavía.</p>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .capc__meta { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 10px; }
    .capc__meta-item { display: flex; align-items: center; gap: 4px; font-size: .75rem; color: var(--text-secondary); }
    .capc__meta-item mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .capc__bio { font-size: .8125rem; color: var(--text-secondary); line-height: 1.5; margin: 0 0 12px; }
    .capc__section-title { font-size: .6875rem; font-weight: 600; text-transform: uppercase;
      letter-spacing: .4px; color: var(--text-secondary); margin: 10px 0 6px; }
    .capc__chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 4px; }
    .capc__chip { background: var(--bg-tertiary); padding: 3px 10px; border-radius: 12px; font-size: .6875rem; }
    .capc__edu { display: flex; flex-direction: column; margin-bottom: 6px; }
    .capc__edu-degree { font-size: .8125rem; font-weight: 500; }
    .capc__edu-inst { font-size: .75rem; color: var(--text-secondary); }
    .capc__links { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 12px; }
    .capc__link { display: inline-flex; align-items: center; gap: 4px; font-size: .8125rem; color: var(--color-primary); }
    .capc__link mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .capc__empty { color: var(--text-secondary); font-size: .8125rem; font-style: italic; }
  `],
})
export class CandidateProfileCardComponent {
  readonly student = input<StudentProfile | null>(null);
  readonly fullName = input<string | null>(null);
}
