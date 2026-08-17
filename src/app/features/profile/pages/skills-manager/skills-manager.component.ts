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
import { AdminService } from '../../../admin/services/admin.service';
import { StudentSkill, SkillCatalogEntry, SkillCategory } from '../../../../core/models';
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
  private readonly adminService = inject(AdminService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  readonly skills = signal<StudentSkill[]>([]);
  readonly loading = signal(true);
  readonly adding = signal(false);
  readonly removing = signal(false);

  newSkillName = '';
  newSkillCategory: SkillCategory = 'concept';
  newSkillLevel: StudentSkill['proficiencyLevel'] = 'beginner' as StudentSkill['proficiencyLevel'];
  private matchedCatalogId: string | null = null;

  readonly catalog = signal<SkillCatalogEntry[]>([]);
  readonly filteredSuggestions = signal<SkillCatalogEntry[]>([]);

  readonly categoryOptions: { value: SkillCategory; label: string }[] = [
    { value: 'language', label: 'Lenguaje' },
    { value: 'framework', label: 'Framework' },
    { value: 'tool', label: 'Herramienta' },
    { value: 'concept', label: 'Concepto' },
    { value: 'soft_skill', label: 'Habilidad blanda' },
  ];

  ngOnInit(): void {
    this.studentService.getProfile().subscribe({
      next: (resp) => {
        const programId = resp.data.programId ?? null;
        if (programId) {
          this.loadCatalogByProgramId(programId);
        } else {
          // Dato legacy sin programId resuelto (ver PLANNING_MATCHING_SERVICE_FIX.md FASE 3/8) —
          // fallback por nombre normalizado, mismo criterio que el backend.
          this.loadCatalog(resp.data.program ?? null);
        }
      },
      error: () => this.loadCatalog(null),
    });

    this.studentService.getSkills().subscribe({
      next: (resp) => {
        this.skills.set(resp.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private loadCatalogByProgramId(programId: string): void {
    this.adminService.getSkillCatalog({ programId }).subscribe({
      next: (entries) => { this.catalog.set(entries); this.filterSuggestions(''); },
    });
  }

  private loadCatalog(programName: string | null): void {
    if (!programName) {
      this.adminService.getSkillCatalog().subscribe({
        next: (entries) => { this.catalog.set(entries); this.filterSuggestions(''); },
      });
      return;
    }

    this.adminService.getPrograms(true).subscribe({
      next: (programs) => {
        const program = programs.find((p) => p.name === programName);
        this.adminService.getSkillCatalog(program ? { programId: program.id } : undefined).subscribe({
          next: (entries) => { this.catalog.set(entries); this.filterSuggestions(''); },
        });
      },
      error: () => {
        this.adminService.getSkillCatalog().subscribe({
          next: (entries) => { this.catalog.set(entries); this.filterSuggestions(''); },
        });
      },
    });
  }

  onNameChange(value: string): void {
    this.newSkillName = value;
    this.filterSuggestions(value);
    const match = this.catalog().find((s) => s.displayName.toLowerCase() === value.trim().toLowerCase());
    this.matchedCatalogId = match?.id ?? null;
    if (match) this.newSkillCategory = match.category;
  }

  private filterSuggestions(q: string): void {
    const query = q.trim().toLowerCase();
    const owned = new Set(this.skills().map((s) => s.name.toLowerCase()));
    const source = this.catalog().filter((s) => !owned.has(s.displayName.toLowerCase()));
    this.filteredSuggestions.set(
      query
        ? source.filter((s) => s.displayName.toLowerCase().includes(query))
        : source,
    );
  }

  addFromChip(entry: SkillCatalogEntry): void {
    this.newSkillName = entry.displayName;
    this.newSkillCategory = entry.category;
    this.matchedCatalogId = entry.id;
    this.addSkill();
  }

  categoryLabel(cat: string): string {
    return this.categoryOptions.find((c) => c.value === cat)?.label ?? cat;
  }

  addSkill(): void {
    if (!this.newSkillName.trim()) return;
    this.adding.set(true);

    this.studentService.addSkill({
      name: this.newSkillName.trim(),
      category: this.newSkillCategory,
      proficiencyLevel: this.newSkillLevel,
      catalogSkillId: this.matchedCatalogId ?? undefined,
    }).subscribe({
      next: (resp) => {
        this.skills.update(list => [...list, resp.data]);
        this.newSkillName = '';
        this.newSkillCategory = 'concept';
        this.newSkillLevel = 'beginner' as StudentSkill['proficiencyLevel'];
        this.matchedCatalogId = null;
        this.adding.set(false);
        this.filterSuggestions('');
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
          this.filterSuggestions('');
          this.snackBar.open('Habilidad eliminada', 'Cerrar', { duration: 2000 });
        },
        error: () => this.removing.set(false),
      });
    });
  }

  levelLabel(level?: string): string {
    const labels: Record<string, string> = {
      beginner: 'Principiante',
      intermediate: 'Intermedio',
      advanced: 'Avanzado',
      expert: 'Experto',
    };
    return (level && labels[level]) ?? level ?? 'Sin nivel';
  }
}
