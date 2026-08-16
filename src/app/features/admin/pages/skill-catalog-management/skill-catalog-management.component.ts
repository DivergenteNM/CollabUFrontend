import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { httpResource } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { AdminService } from '../../services/admin.service';
import { SkillCatalogEntry, SkillCategory, AcademicProgram } from '../../../../core/models';

const CATEGORY_OPTIONS: { value: SkillCategory; label: string }[] = [
  { value: 'language', label: 'Lenguaje' },
  { value: 'framework', label: 'Framework' },
  { value: 'tool', label: 'Herramienta' },
  { value: 'concept', label: 'Concepto' },
  { value: 'soft_skill', label: 'Habilidad blanda' },
];

// ─── Skill Form Dialog ──────────────────────────────────────────────────────
@Component({
  selector: 'app-skill-catalog-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule, FormsModule],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Editar habilidad' : 'Nueva habilidad' }}</h2>
    <mat-dialog-content class="dlg-content">
      <mat-form-field appearance="outline" class="full-w">
        <mat-label>Nombre</mat-label>
        <input matInput [(ngModel)]="displayName" required maxlength="100" placeholder="Ej: React" />
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-w">
        <mat-label>Categoría</mat-label>
        <mat-select [(ngModel)]="category">
          @for (opt of categoryOptions; track opt.value) {
            <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close(null)">Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="!displayName.trim()" (click)="save()">
        <mat-icon>save</mat-icon> Guardar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.dlg-content{min-width:380px;padding-top:8px;display:flex;flex-direction:column;gap:8px}.full-w{width:100%}`],
})
export class SkillCatalogDialogComponent {
  readonly data = inject<SkillCatalogEntry | null>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<SkillCatalogDialogComponent>);
  readonly categoryOptions = CATEGORY_OPTIONS;

  displayName = this.data?.displayName ?? '';
  category: SkillCategory = this.data?.category ?? 'concept';

  save() {
    if (!this.displayName.trim()) return;
    this.dialogRef.close({ displayName: this.displayName.trim(), category: this.category });
  }
}

// ─── Program Association Dialog ────────────────────────────────────────────
@Component({
  selector: 'app-skill-programs-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule, MatFormFieldModule, MatSelectModule, MatIconModule, FormsModule],
  template: `
    <h2 mat-dialog-title>Asociar "{{ data.skill.displayName }}" a programas</h2>
    <mat-dialog-content class="dlg-content">
      <mat-form-field appearance="outline" class="full-w">
        <mat-label>Programas académicos</mat-label>
        <mat-select [(ngModel)]="selectedIds" multiple>
          @for (p of data.programs; track p.id) {
            <mat-option [value]="p.id">{{ p.name }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close(null)">Cancelar</button>
      <button mat-flat-button color="primary" (click)="dialogRef.close(selectedIds)">
        <mat-icon>save</mat-icon> Guardar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.dlg-content{min-width:380px;padding-top:8px}.full-w{width:100%}`],
})
export class SkillProgramsDialogComponent {
  readonly data = inject<{ skill: SkillCatalogEntry; programs: AcademicProgram[] }>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<SkillProgramsDialogComponent>);
  selectedIds: string[] = [];
}

// ─── Main Component ─────────────────────────────────────────────────────────
@Component({
  selector: 'app-skill-catalog-management',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatButtonModule, MatCardModule, MatChipsModule, MatFormFieldModule, MatSelectModule, FormsModule, MatSnackBarModule, MatTooltipModule],
  template: `
    <div class="cat-page">
      <div class="cat-page__header">
        <div>
          <h1>Catálogo de habilidades</h1>
          <p class="cat-page__subtitle">
            Habilidades disponibles para estudiantes y proyectos. Las desactivadas dejan de sugerirse pero
            los datos existentes que las usan siguen siendo válidos.
          </p>
        </div>
        <button mat-flat-button color="primary" (click)="openDialog()">
          <mat-icon>add</mat-icon> Nueva habilidad
        </button>
      </div>

      <mat-form-field appearance="outline" class="cat-page__filter">
        <mat-label>Filtrar por categoría</mat-label>
        <mat-select [(ngModel)]="categoryFilter" (ngModelChange)="resource.reload()">
          <mat-option [value]="null">Todas</mat-option>
          @for (opt of categoryOptions; track opt.value) {
            <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-card class="cat-card">
        @if (resource.isLoading()) {
          <div class="empty-state"><p>Cargando...</p></div>
        } @else if (skills().length === 0) {
          <div class="empty-state">
            <mat-icon>psychology</mat-icon>
            <p>No hay habilidades en el catálogo</p>
          </div>
        } @else {
          @for (skill of skills(); track skill.id) {
            <div class="cat-row" [class.cat-row--inactive]="!skill.isActive">
              <div class="cat-row__main">
                <span class="cat-row__name">{{ skill.displayName }}</span>
                <span class="cat-row__cat">{{ categoryLabel(skill.category) }}</span>
                @if (!skill.isActive) { <span class="cat-row__badge">Inactiva</span> }
              </div>
              <div class="cat-row__actions">
                <button mat-icon-button matTooltip="Asociar a programas" (click)="openProgramsDialog(skill)">
                  <mat-icon>school</mat-icon>
                </button>
                <button mat-icon-button (click)="openDialog(skill)"><mat-icon>edit</mat-icon></button>
                @if (skill.isActive) {
                  <button mat-icon-button (click)="deactivate(skill)"><mat-icon>visibility_off</mat-icon></button>
                }
              </div>
            </div>
          }
        }
      </mat-card>
    </div>
  `,
  styles: [`
    .cat-page { padding: 24px; max-width: 900px; margin: 0 auto; }
    .cat-page__header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; gap: 16px; }
    .cat-page__header h1 { margin: 0 0 4px; font-size: 1.4rem; font-weight: 700; }
    .cat-page__subtitle { margin: 0; color: #6b7280; font-size: .875rem; max-width: 560px; }
    .cat-page__filter { width: 240px; margin-bottom: 12px; }
    .cat-card { padding: 8px; }
    .cat-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid #f0f0f0; gap: 12px; }
    .cat-row:last-child { border-bottom: none; }
    .cat-row--inactive { opacity: .55; }
    .cat-row__main { flex: 1; display: flex; align-items: center; gap: 10px; }
    .cat-row__name { font-weight: 600; font-size: .9rem; }
    .cat-row__cat { font-size: .7rem; background: #ede9fe; color: #5b21b6; padding: 2px 9px; border-radius: 10px; }
    .cat-row__badge { font-size: .7rem; background: #f3f4f6; color: #6b7280; padding: 1px 8px; border-radius: 10px; }
    .cat-row__actions { display: flex; gap: 2px; flex-shrink: 0; }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 48px 0; color: #9ca3af; gap: 8px; }
  `],
})
export class SkillCatalogManagementComponent {
  private readonly dialog = inject(MatDialog);
  private readonly adminService = inject(AdminService);
  private readonly snackBar = inject(MatSnackBar);

  readonly categoryOptions = CATEGORY_OPTIONS;
  categoryFilter: SkillCategory | null = null;

  readonly programs = signal<AcademicProgram[]>([]);

  readonly resource = httpResource<SkillCatalogEntry[]>(
    () => ({
      url: `${environment.apiUrl}/admin/skills`,
      params: {
        includeInactive: 'true',
        ...(this.categoryFilter ? { category: this.categoryFilter } : {}),
      },
    }),
  );

  readonly skills = computed(() => this.resource.value() ?? []);

  constructor() {
    this.adminService.getPrograms(true).subscribe({
      next: (programs) => this.programs.set(programs),
      error: () => {},
    });
  }

  categoryLabel(cat: string): string {
    return this.categoryOptions.find((c) => c.value === cat)?.label ?? cat;
  }

  openDialog(skill?: SkillCatalogEntry) {
    this.dialog.open(SkillCatalogDialogComponent, { data: skill ?? null, width: '440px' })
      .afterClosed().subscribe((result) => {
        if (!result) return;
        const op$ = skill
          ? this.adminService.updateSkill(skill.id, result)
          : this.adminService.createSkill(result);
        op$.subscribe({
          next: () => {
            this.resource.reload();
            this.snackBar.open(skill ? 'Habilidad actualizada' : 'Habilidad creada', 'OK', { duration: 2200 });
          },
          error: (err) => {
            this.snackBar.open(err?.error?.message ?? 'Error al guardar', 'Cerrar', { duration: 4000 });
          },
        });
      });
  }

  openProgramsDialog(skill: SkillCatalogEntry) {
    this.dialog.open(SkillProgramsDialogComponent, {
      data: { skill, programs: this.programs() },
      width: '440px',
    }).afterClosed().subscribe((programIds: string[] | null) => {
      if (!programIds || programIds.length === 0) return;
      this.adminService.associateSkillPrograms(skill.id, programIds).subscribe({
        next: () => this.snackBar.open('Programas asociados', 'OK', { duration: 2200 }),
        error: () => this.snackBar.open('Error al asociar programas', 'Cerrar', { duration: 4000 }),
      });
    });
  }

  deactivate(skill: SkillCatalogEntry) {
    this.adminService.deactivateSkill(skill.id).subscribe({
      next: () => {
        this.resource.reload();
        this.snackBar.open('Habilidad desactivada', 'OK', { duration: 2200 });
      },
    });
  }
}
