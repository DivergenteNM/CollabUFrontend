import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { FinalDocRequirementInput, FinalDocActor } from '../../../applications/services/application.service';

interface DraftItem {
  name: string;
  description: string;
  actorType: FinalDocActor;
  isMandatory: boolean;
}

/**
 * Diálogo obligatorio antes de iniciar la finalización de un proyecto.
 * El admin define ad-hoc qué documentos se requerirán para cerrar el
 * proceso académico y a quién le corresponde subir cada uno.
 */
@Component({
  selector: 'app-start-finalization-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule, MatDialogModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatCheckboxModule, MatCardModule, MatDividerModule,
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>flag_circle</mat-icon>
      Iniciar finalización del proyecto
    </h2>

    <mat-dialog-content class="dialog-content">
      <p class="dialog-hint">
        Define los documentos que deberán entregar el estudiante, la empresa o el asesor
        para cerrar académicamente el proyecto. Solo los marcados como <strong>obligatorios</strong>
        bloquean el avance al siguiente paso.
      </p>

      <div class="items">
        @for (item of items(); track $index; let i = $index) {
          <mat-card class="item">
            <mat-card-content>
              <div class="item__row">
                <mat-form-field appearance="outline" class="item__name">
                  <mat-label>Nombre del documento</mat-label>
                  <input matInput [(ngModel)]="item.name" maxlength="200" required />
                </mat-form-field>

                <mat-form-field appearance="outline" class="item__actor">
                  <mat-label>Quién lo sube</mat-label>
                  <mat-select [(ngModel)]="item.actorType">
                    <mat-option value="student">Estudiante</mat-option>
                    <mat-option value="company">Empresa</mat-option>
                    <mat-option value="asesor">Asesor</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline" class="item__desc">
                <mat-label>Descripción / instrucciones (opcional)</mat-label>
                <textarea matInput [(ngModel)]="item.description" rows="2" maxlength="1000"></textarea>
              </mat-form-field>

              <div class="item__footer">
                <mat-checkbox [(ngModel)]="item.isMandatory">Obligatorio</mat-checkbox>
                <button mat-icon-button color="warn" aria-label="Eliminar" (click)="remove(i)">
                  <mat-icon>delete_outline</mat-icon>
                </button>
              </div>
            </mat-card-content>
          </mat-card>
        }
      </div>

      <button mat-stroked-button class="add-btn" (click)="add()">
        <mat-icon>add</mat-icon> Agregar documento
      </button>

      @if (validationError()) {
        <p class="dialog-error">{{ validationError() }}</p>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="!isValid()" (click)="confirm()">
        <mat-icon>flag</mat-icon> Iniciar finalización
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2[mat-dialog-title] { display: flex; align-items: center; gap: 8px; margin: 0; }
    .dialog-content { min-width: 480px; max-width: 720px; }
    .dialog-hint { font-size: 0.875rem; color: var(--mat-sys-on-surface-variant); margin: 0 0 16px; }
    .dialog-error { color: var(--mat-sys-error); font-size: 0.875rem; margin: 8px 0 0; }

    .items { display: flex; flex-direction: column; gap: 12px; }
    .item { border-left: 3px solid var(--mat-sys-primary); }
    .item__row { display: flex; gap: 12px; flex-wrap: wrap; }
    .item__name { flex: 1; min-width: 200px; }
    .item__actor { min-width: 160px; }
    .item__desc { width: 100%; }
    .item__footer { display: flex; align-items: center; justify-content: space-between; }
    .add-btn { margin-top: 12px; }
  `],
})
export class StartFinalizationDialogComponent {
  private readonly ref = inject(MatDialogRef<StartFinalizationDialogComponent, FinalDocRequirementInput[]>);

  readonly items = signal<DraftItem[]>([
    { name: '', description: '', actorType: 'student', isMandatory: true },
  ]);

  // Métodos (no `computed`) porque los items se mutan por ngModel sin cambiar
  // la referencia del array; con OnPush Angular re-invoca métodos en cada CD
  // disparado por el propio ngModel.
  validationError(): string | null {
    const list = this.items();
    if (list.length === 0) return 'Debes definir al menos un documento requerido';
    const invalid = list.find((i) => !i.name || i.name.trim().length < 3);
    if (invalid) return 'Cada documento debe tener un nombre de al menos 3 caracteres';
    return null;
  }

  isValid(): boolean {
    return this.validationError() === null;
  }

  add(): void {
    this.items.update((list) => [
      ...list,
      { name: '', description: '', actorType: 'student', isMandatory: true },
    ]);
  }

  remove(index: number): void {
    this.items.update((list) => list.filter((_, i) => i !== index));
  }

  confirm(): void {
    if (!this.isValid()) return;
    const payload: FinalDocRequirementInput[] = this.items().map((i) => ({
      name: i.name.trim(),
      description: i.description.trim() || undefined,
      actorType: i.actorType,
      isMandatory: i.isMandatory,
    }));
    this.ref.close(payload);
  }

  cancel(): void {
    this.ref.close();
  }
}
