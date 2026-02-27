import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { StudentService } from '../../../students/services/student.service';
import { StudentSkill } from '../../../../core/models';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../shared/components/ui/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-skills-manager',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink, FormsModule,
    MatIconModule, MatButtonModule, MatCardModule,
    MatFormFieldModule, MatInputModule, MatAutocompleteModule,
    MatChipsModule, MatSelectModule, MatSnackBarModule,
  ],
  template: `
    <div class="skills-manager">
      <div class="skills-manager__header">
        <h1>Gestionar Habilidades</h1>
        <a mat-button routerLink="/profile/view">
          <mat-icon>arrow_back</mat-icon>
          Volver al perfil
        </a>
      </div>

      <!-- Add Skill -->
      <mat-card class="skills-manager__add">
        <mat-card-header>
          <mat-card-title>Agregar Habilidad</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="add-form">
            <mat-form-field appearance="outline">
              <mat-label>Habilidad</mat-label>
              <input matInput [(ngModel)]="newSkillName"
                [matAutocomplete]="auto"
                placeholder="Ej: Angular, Python, SQL..." />
              <mat-autocomplete #auto="matAutocomplete">
                @for (s of filteredSuggestions(); track s) {
                  <mat-option [value]="s">{{ s }}</mat-option>
                }
              </mat-autocomplete>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Categoría</mat-label>
              <input matInput [(ngModel)]="newSkillCategory" placeholder="Ej: Frontend, Backend..." />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Nivel</mat-label>
              <mat-select [(ngModel)]="newSkillLevel">
                <mat-option value="basic">Básico</mat-option>
                <mat-option value="intermediate">Intermedio</mat-option>
                <mat-option value="advanced">Avanzado</mat-option>
                <mat-option value="expert">Experto</mat-option>
              </mat-select>
            </mat-form-field>

            <button mat-flat-button color="primary"
              [disabled]="!newSkillName.trim() || adding()"
              (click)="addSkill()">
              <mat-icon>add</mat-icon>
              Agregar
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Current Skills -->
      <mat-card>
        <mat-card-header>
          <mat-card-title>Mis Habilidades ({{ skills().length }})</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          @if (loading()) {
            <p>Cargando habilidades...</p>
          }

          @for (skill of skills(); track skill.id) {
            <div class="skill-row">
              <mat-chip-set>
                <mat-chip>{{ skill.name }}</mat-chip>
              </mat-chip-set>
              <span class="skill-category">{{ skill.category }}</span>
              <span class="skill-level" [class]="'level-' + skill.proficiencyLevel">
                {{ levelLabel(skill.proficiencyLevel) }}
              </span>
              <button mat-icon-button (click)="removeSkill(skill)" [disabled]="removing()">
                <mat-icon>close</mat-icon>
              </button>
            </div>
          } @empty {
            @if (!loading()) {
              <div class="empty">
                <mat-icon>psychology</mat-icon>
                <p>No tienes habilidades registradas. ¡Agrega tu primera habilidad!</p>
              </div>
            }
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: `
    .skills-manager {
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

      &__add {
        margin-bottom: 24px;
      }
    }

    .add-form {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      flex-wrap: wrap;

      mat-form-field {
        flex: 1;
        min-width: 150px;
      }

      button {
        margin-top: 8px;
      }
    }

    .skill-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
      border-bottom: 1px solid var(--mat-sys-outline-variant);

      &:last-child {
        border-bottom: none;
      }

      .skill-category {
        font-size: 0.8125rem;
        color: var(--mat-sys-on-surface-variant);
        flex: 1;
      }

      .skill-level {
        font-size: 0.8125rem;
        font-weight: 500;
        padding: 2px 8px;
        border-radius: 12px;

        &.level-basic { background: #e3f2fd; color: #1565c0; }
        &.level-intermediate { background: #e8f5e9; color: #2e7d32; }
        &.level-advanced { background: #fff3e0; color: #e65100; }
        &.level-expert { background: #fce4ec; color: #c62828; }
      }
    }

    .empty {
      text-align: center;
      padding: 32px;
      color: var(--mat-sys-on-surface-variant);

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        margin-bottom: 8px;
      }
    }
  `,
})
export class SkillsManagerComponent implements OnInit {
  private readonly studentService = inject(StudentService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  readonly skills = signal<StudentSkill[]>([]);
  readonly loading = signal(true);
  readonly adding = signal(false);
  readonly removing = signal(false);

  newSkillName = '';
  newSkillCategory = '';
  newSkillLevel: StudentSkill['proficiencyLevel'] = 'basic';

  private readonly suggestions = [
    'Angular', 'React', 'Vue', 'TypeScript', 'JavaScript', 'Python', 'Java',
    'Node.js', 'SQL', 'PostgreSQL', 'MongoDB', 'Docker', 'Git', 'AWS',
    'Flutter', 'Swift', 'Kotlin', 'C#', '.NET', 'PHP', 'Laravel',
    'HTML', 'CSS', 'SASS', 'Tailwind CSS', 'Figma', 'Adobe XD',
  ];

  readonly filteredSuggestions = signal<string[]>(this.suggestions);

  ngOnInit(): void {
    this.studentService.getSkills().subscribe({
      next: (resp) => {
        this.skills.set(resp.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  addSkill(): void {
    if (!this.newSkillName.trim()) return;
    this.adding.set(true);

    this.studentService.addSkill({
      name: this.newSkillName.trim(),
      category: this.newSkillCategory.trim() || 'General',
      proficiencyLevel: this.newSkillLevel,
    }).subscribe({
      next: (resp) => {
        this.skills.update(list => [...list, resp.data]);
        this.newSkillName = '';
        this.newSkillCategory = '';
        this.newSkillLevel = 'basic';
        this.adding.set(false);
        this.snackBar.open('Habilidad agregada', 'Cerrar', { duration: 2000 });
      },
      error: () => this.adding.set(false),
    });
  }

  removeSkill(skill: StudentSkill): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar Habilidad',
        message: `¿Eliminar "${skill.name}" de tus habilidades?`,
        confirmText: 'Eliminar',
        type: 'danger',
      } satisfies ConfirmDialogData,
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.removing.set(true);
      this.studentService.removeSkill(skill.id).subscribe({
        next: () => {
          this.skills.update(list => list.filter(s => s.id !== skill.id));
          this.removing.set(false);
          this.snackBar.open('Habilidad eliminada', 'Cerrar', { duration: 2000 });
        },
        error: () => this.removing.set(false),
      });
    });
  }

  levelLabel(level: string): string {
    const labels: Record<string, string> = {
      basic: 'Básico',
      intermediate: 'Intermedio',
      advanced: 'Avanzado',
      expert: 'Experto',
    };
    return labels[level] ?? level;
  }
}
