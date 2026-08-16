import { Component, ChangeDetectionStrategy, inject, computed, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { httpResource } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { AdminService, AcademicTemplate } from '../../services/admin.service';
import { StorageService } from '../../../../core/services/storage.service';

const TEMPLATE_TYPES = [
  { value: 'anteproyecto', label: 'Anteproyecto' },
  { value: 'proyecto_final', label: 'Proyecto final' },
  { value: 'informe_avance', label: 'Informe de avance' },
  { value: 'acta_inicio', label: 'Acta de inicio' },
  { value: 'otro', label: 'Otro' },
];

// ─── Dialog ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-academic-template-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule, FormsModule],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Editar plantilla' : 'Nueva plantilla' }}</h2>
    <mat-dialog-content class="dlg-content">
      <mat-form-field appearance="outline" class="full-w">
        <mat-label>Código de programa</mat-label>
        <input matInput [(ngModel)]="programCode" placeholder="Ej: SIS" required maxlength="20" />
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-w">
        <mat-label>Tipo de documento</mat-label>
        <mat-select [(ngModel)]="type">
          @for (t of types; track t.value) {
            <mat-option [value]="t.value">{{ t.label }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-w">
        <mat-label>Nombre</mat-label>
        <input matInput [(ngModel)]="name" required maxlength="200" />
      </mat-form-field>
      <div class="file-row">
        <button mat-stroked-button (click)="fileInput.click()" [disabled]="uploading()">
          <mat-icon>upload_file</mat-icon> {{ fileName() || 'Seleccionar archivo (PDF/DOCX)' }}
        </button>
        <input #fileInput type="file" hidden accept=".pdf,.doc,.docx" (change)="onFileSelected($event)" />
        @if (uploading()) { <span class="uploading">Subiendo…</span> }
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close(null)">Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="!canSave()" (click)="save()">
        <mat-icon>save</mat-icon> Guardar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dlg-content{min-width:420px;padding-top:8px;display:flex;flex-direction:column;gap:8px}
    .full-w{width:100%}
    .file-row{display:flex;align-items:center;gap:12px;margin-top:4px}
    .uploading{font-size:.8125rem;color:#6b7280}
  `],
})
export class AcademicTemplateDialogComponent {
  readonly data = inject<AcademicTemplate | null>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<AcademicTemplateDialogComponent>);
  private readonly storageService = inject(StorageService);

  readonly types = TEMPLATE_TYPES;

  programCode = this.data?.programCode ?? '';
  type = this.data?.type ?? 'anteproyecto';
  name = this.data?.name ?? '';
  fileId = signal(this.data?.fileId ?? '');
  fileName = signal<string | null>(null);
  uploading = signal(false);

  canSave(): boolean {
    return !!this.programCode.trim() && !!this.name.trim() && !!this.fileId();
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploading.set(true);
    this.storageService.upload(file, 'template').subscribe({
      next: (res) => {
        this.fileId.set(res.data?.fileId ?? '');
        this.fileName.set(file.name);
        this.uploading.set(false);
      },
      error: () => this.uploading.set(false),
    });
  }

  save() {
    if (!this.canSave()) return;
    this.dialogRef.close({
      programCode: this.programCode.trim().toUpperCase(),
      type: this.type,
      name: this.name.trim(),
      fileId: this.fileId(),
    });
  }
}

// ─── Main Component ────────────────────────────────────────────────────────────
@Component({
  selector: 'app-academic-templates',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatButtonModule, MatCardModule, MatChipsModule],
  template: `
    <div class="tpl-page">
      <div class="tpl-page__header">
        <div>
          <h1>Plantillas de documentos académicos</h1>
          <p class="tpl-page__subtitle">
            Plantillas oficiales por programa académico que los estudiantes descargan para entregar sus documentos.
          </p>
        </div>
        <button mat-flat-button color="primary" (click)="openDialog()">
          <mat-icon>add</mat-icon> Nueva plantilla
        </button>
      </div>

      <mat-card class="tpl-card">
        @if (templates().length === 0) {
          <div class="empty-state">
            <mat-icon>description</mat-icon>
            <p>No hay plantillas configuradas</p>
          </div>
        } @else {
          @for (tpl of templates(); track tpl.id) {
            <div class="tpl-row" [class.tpl-row--inactive]="!tpl.isActive">
              <div class="tpl-row__main">
                <span class="tpl-row__name">{{ tpl.name }}</span>
                @if (!tpl.isActive) { <span class="tpl-row__badge">Inactiva</span> }
                <p class="tpl-row__meta">Programa: {{ tpl.programCode }} · Tipo: {{ typeLabel(tpl.type) }}</p>
              </div>
              <div class="tpl-row__actions">
                <button mat-icon-button (click)="openDialog(tpl)"><mat-icon>edit</mat-icon></button>
                <button mat-icon-button (click)="toggleActive(tpl)">
                  <mat-icon>{{ tpl.isActive ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </div>
            </div>
          }
        }
      </mat-card>
    </div>
  `,
  styles: [`
    .tpl-page { padding: 24px; max-width: 900px; margin: 0 auto; }
    .tpl-page__header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; gap: 16px; }
    .tpl-page__header h1 { margin: 0 0 4px; font-size: 1.4rem; font-weight: 700; }
    .tpl-page__subtitle { margin: 0; color: #6b7280; font-size: .875rem; }
    .tpl-card { padding: 8px; }
    .tpl-row { display: flex; justify-content: space-between; align-items: flex-start; padding: 14px 16px; border-bottom: 1px solid #f0f0f0; gap: 12px; }
    .tpl-row:last-child { border-bottom: none; }
    .tpl-row--inactive { opacity: .55; }
    .tpl-row__main { flex: 1; }
    .tpl-row__name { font-weight: 600; font-size: .9rem; }
    .tpl-row__badge { margin-left: 8px; font-size: .7rem; background: #f3f4f6; color: #6b7280; padding: 1px 8px; border-radius: 10px; }
    .tpl-row__meta { margin: 4px 0 0; font-size: .8125rem; color: #6b7280; }
    .tpl-row__actions { display: flex; gap: 4px; flex-shrink: 0; }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 48px 0; color: #9ca3af; gap: 8px; }
  `],
})
export class AcademicTemplatesComponent {
  private readonly dialog = inject(MatDialog);
  private readonly adminService = inject(AdminService);

  readonly resource = httpResource<AcademicTemplate[]>(
    () => ({ url: `${environment.apiUrl}/admin/templates` }),
  );

  readonly templates = computed(() => this.resource.value() ?? []);

  typeLabel(type: string): string {
    return TEMPLATE_TYPES.find((t) => t.value === type)?.label ?? type;
  }

  openDialog(template?: AcademicTemplate) {
    this.dialog.open(AcademicTemplateDialogComponent, { data: template ?? null, width: '480px' })
      .afterClosed().subscribe((result) => {
        if (!result) return;
        const op$ = template
          ? this.adminService.updateTemplate(template.id, result)
          : this.adminService.createTemplate(result);
        op$.subscribe({ next: () => this.resource.reload() });
      });
  }

  toggleActive(template: AcademicTemplate) {
    this.adminService.updateTemplate(template.id, { isActive: !template.isActive })
      .subscribe({ next: () => this.resource.reload() });
  }
}
