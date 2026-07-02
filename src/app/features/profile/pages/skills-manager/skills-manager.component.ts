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
  templateUrl: './skills-manager.component.html',
  styleUrl: './skills-manager.component.scss',
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

  levelLabel(level?: string): string {
    const labels: Record<string, string> = {
      basic: 'Básico',
      beginner: 'Principiante',
      intermediate: 'Intermedio',
      advanced: 'Avanzado',
      expert: 'Experto',
    };
    return (level && labels[level]) ?? level ?? 'Sin nivel';
  }
}
