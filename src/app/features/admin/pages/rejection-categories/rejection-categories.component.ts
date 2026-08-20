import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { httpResource } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { AdminService, RejectionCategory } from '../../services/admin.service';

// ─── Category Form Dialog ──────────────────────────────────────────────────────
@Component({
  selector: 'app-rejection-category-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatCheckboxModule, MatIconModule, FormsModule],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Editar categoría' : 'Nueva categoría de rechazo' }}</h2>
    <mat-dialog-content class="dlg-content">
      <mat-form-field appearance="outline" class="full-w">
        <mat-label>Nombre</mat-label>
        <input matInput [(ngModel)]="name" required maxlength="200" />
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-w">
        <mat-label>Descripción (opcional)</mat-label>
        <textarea matInput [(ngModel)]="description" rows="3"></textarea>
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-w">
        <mat-label>Orden de presentación</mat-label>
        <input matInput type="number" [(ngModel)]="displayOrder" />
      </mat-form-field>
      @if (data) {
        <mat-checkbox [(ngModel)]="isActive">Activa</mat-checkbox>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close(null)">Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="!name.trim()" (click)="save()">
        <mat-icon>save</mat-icon> Guardar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.dlg-content{min-width:420px;padding-top:8px;display:flex;flex-direction:column;gap:8px}.full-w{width:100%}`],
})
export class RejectionCategoryDialogComponent {
  readonly data      = inject<RejectionCategory | null>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<RejectionCategoryDialogComponent>);

  name = this.data?.name ?? '';
  description = this.data?.description ?? '';
  displayOrder = this.data?.displayOrder ?? 0;
  isActive = this.data?.isActive ?? true;

  save() {
    if (!this.name.trim()) return;
    this.dialogRef.close({
      name: this.name.trim(),
      description: this.description.trim() || undefined,
      displayOrder: this.displayOrder,
      ...(this.data ? { isActive: this.isActive } : {}),
    });
  }
}

// ─── Main Component ────────────────────────────────────────────────────────────
@Component({
  selector: 'app-rejection-categories',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatButtonModule, MatCardModule, MatChipsModule],
  template: `
    <div class="cat-page">
      <div class="cat-page__header">
        <div>
          <h1>Categorías de rechazo de proyectos</h1>
          <p class="cat-page__subtitle">
            Motivos predefinidos que la Facultad puede usar al rechazar un proyecto enviado por una empresa.
          </p>
        </div>
        <button mat-flat-button color="primary" (click)="openDialog()">
          <mat-icon>add</mat-icon> Nueva categoría
        </button>
      </div>

      <mat-card class="cat-card">
        @if (categories().length === 0) {
          <div class="empty-state">
            <mat-icon>category</mat-icon>
            <p>No hay categorías configuradas</p>
          </div>
        } @else {
          @for (cat of categories(); track cat.id) {
            <div class="cat-row" [class.cat-row--inactive]="!cat.isActive">
              <div class="cat-row__main">
                <span class="cat-row__name">{{ cat.name }}</span>
                @if (!cat.isActive) { <span class="cat-row__badge">Inactiva</span> }
                @if (cat.description) { <p class="cat-row__desc">{{ cat.description }}</p> }
              </div>
              <div class="cat-row__actions">
                <button mat-icon-button (click)="openDialog(cat)"><mat-icon>edit</mat-icon></button>
                <button mat-icon-button (click)="toggleActive(cat)">
                  <mat-icon>{{ cat.isActive ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
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
    .cat-page__subtitle { margin: 0; color: #6b7280; font-size: .875rem; }
    .cat-card { padding: 8px; }
    .cat-row { display: flex; justify-content: space-between; align-items: flex-start; padding: 14px 16px; border-bottom: 1px solid #f0f0f0; gap: 12px; }
    .cat-row:last-child { border-bottom: none; }
    .cat-row--inactive { opacity: .55; }
    .cat-row__main { flex: 1; }
    .cat-row__name { font-weight: 600; font-size: .9rem; }
    .cat-row__badge { margin-left: 8px; font-size: .7rem; background: #f3f4f6; color: #6b7280; padding: 1px 8px; border-radius: 10px; }
    .cat-row__desc { margin: 4px 0 0; font-size: .8125rem; color: #6b7280; }
    .cat-row__actions { display: flex; gap: 4px; flex-shrink: 0; }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 48px 0; color: #9ca3af; gap: 8px; }
  `],
})
export class RejectionCategoriesComponent {
  private readonly dialog = inject(MatDialog);
  private readonly adminService = inject(AdminService);

  readonly resource = httpResource<RejectionCategory[]>(
    () => ({ url: `${environment.apiUrl}/admin/rejection-categories` }),
  );

  readonly categories = computed(() => this.resource.value() ?? []);

  openDialog(category?: RejectionCategory) {
    this.dialog.open(RejectionCategoryDialogComponent, { data: category ?? null, width: '480px' })
      .afterClosed().subscribe((result) => {
        if (!result) return;
        const op$ = category
          ? this.adminService.updateRejectionCategory(category.id, result)
          : this.adminService.createRejectionCategory(result);
        op$.subscribe({ next: () => this.resource.reload() });
      });
  }

  toggleActive(category: RejectionCategory) {
    this.adminService.updateRejectionCategory(category.id, { isActive: !category.isActive })
      .subscribe({ next: () => this.resource.reload() });
  }
}
