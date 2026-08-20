import { Component, ChangeDetectionStrategy, inject, computed, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { httpResource } from '@angular/common/http';
import { switchMap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { AdminService, DocumentRequirement } from '../../services/admin.service';
import { StorageService } from '../../../../core/services/storage.service';
import { FileLinkComponent } from '../../../../shared/components/ui/file-link/file-link.component';
import { ApiResponse } from '../../../../core/models';

const ACTOR_TYPES = [
  { value: 'student', label: 'Estudiante' },
  { value: 'company', label: 'Empresa' },
];

const STAGES = [
  { value: 'pre_initiation', label: 'Antes del inicio' },
  { value: 'post_initiation', label: 'Después del inicio' },
  { value: 'finalization', label: 'Finalización' },
];

// ─── Dialog ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-document-requirement-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatCheckboxModule, MatIconModule, MatProgressSpinnerModule, FormsModule, FileLinkComponent,
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Editar documento requerido' : 'Nuevo documento requerido' }}</h2>
    <mat-dialog-content class="dlg-content">
      <mat-form-field appearance="outline" class="full-w">
        <mat-label>Nombre</mat-label>
        <input matInput [(ngModel)]="name" required maxlength="200" />
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-w">
        <mat-label>Descripción (opcional)</mat-label>
        <textarea matInput [(ngModel)]="description" rows="2"></textarea>
      </mat-form-field>
      @if (!data) {
        <mat-form-field appearance="outline" class="full-w">
          <mat-label>Actor</mat-label>
          <mat-select [(ngModel)]="actorType">
            @for (a of actorTypes; track a.value) { <mat-option [value]="a.value">{{ a.label }}</mat-option> }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-w">
          <mat-label>Etapa</mat-label>
          <mat-select [(ngModel)]="requiredAtStage">
            @for (s of stages; track s.value) { <mat-option [value]="s.value">{{ s.label }}</mat-option> }
          </mat-select>
        </mat-form-field>
      }
      <mat-checkbox [(ngModel)]="isMandatory">Obligatorio</mat-checkbox>
      @if (data) {
        <mat-checkbox [(ngModel)]="isActive">Activo</mat-checkbox>
      }

      <div class="dlg-template">
        <span class="dlg-template__label">Plantilla / formato (opcional)</span>
        @if (data?.templateFileId && !templateFile()) {
          <app-file-link [fileId]="data!.templateFileId!" />
          <button mat-button type="button" (click)="templateInput.click()">
            <mat-icon>swap_horiz</mat-icon> Reemplazar
          </button>
        } @else if (templateFile(); as f) {
          <span class="dlg-template__file"><mat-icon>description</mat-icon> {{ f.name }}</span>
          <button mat-icon-button type="button" (click)="templateFile.set(null)"><mat-icon>close</mat-icon></button>
        } @else {
          <button mat-button type="button" (click)="templateInput.click()">
            <mat-icon>attach_file</mat-icon> Adjuntar plantilla
          </button>
        }
        <input #templateInput type="file" hidden (change)="onTemplateFileSelected($event)" />
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close(null)">Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="!name.trim() || saving()" (click)="save()">
        @if (saving()) { <mat-spinner diameter="16" /> } @else { <mat-icon>save</mat-icon> Guardar }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dlg-content{min-width:420px;padding-top:8px;display:flex;flex-direction:column;gap:8px}
    .full-w{width:100%}
    .dlg-template{display:flex;align-items:center;gap:8px;margin-top:4px;flex-wrap:wrap}
    .dlg-template__label{font-size:.75rem;color:var(--text-secondary);width:100%}
    .dlg-template__file{display:flex;align-items:center;gap:4px;font-size:.8125rem}
  `],
})
export class DocumentRequirementDialogComponent {
  readonly data = inject<DocumentRequirement | null>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<DocumentRequirementDialogComponent>);
  private readonly storageService = inject(StorageService);

  readonly actorTypes = ACTOR_TYPES;
  readonly stages = STAGES;

  name = this.data?.name ?? '';
  description = this.data?.description ?? '';
  actorType = this.data?.actorType ?? 'student';
  requiredAtStage = this.data?.requiredAtStage ?? 'pre_initiation';
  isMandatory = this.data?.isMandatory ?? true;
  isActive = this.data?.isActive ?? true;

  readonly templateFile = signal<File | null>(null);
  readonly saving = signal(false);

  onTemplateFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.templateFile.set(file);
  }

  save() {
    if (!this.name.trim() || this.saving()) return;
    this.saving.set(true);

    const file = this.templateFile();
    // Público: plantilla genérica del catálogo, no un documento del estudiante —
    // debe poder verla cualquier actor sin depender de que application-service
    // sepa resolver un archivo que en realidad vive en admin-service.
    const upload$: Observable<ApiResponse<{ fileId: string; url: string }> | null> = file
      ? this.storageService.upload(file, 'academic_document', true)
      : of(null);

    upload$.pipe(
      switchMap((res) => {
        const payload: Partial<DocumentRequirement> & Record<string, unknown> = {
          name: this.name.trim(),
          description: this.description.trim() || undefined,
          isMandatory: this.isMandatory,
          ...(this.data ? { isActive: this.isActive } : { actorType: this.actorType, requiredAtStage: this.requiredAtStage }),
        };
        if (res?.data?.fileId) payload['templateFileId'] = res.data.fileId;
        return of(payload);
      }),
    ).subscribe((payload) => {
      this.saving.set(false);
      this.dialogRef.close(payload);
    });
  }
}

// ─── Main Component ────────────────────────────────────────────────────────────
@Component({
  selector: 'app-document-requirements',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatButtonModule, MatCardModule, MatChipsModule],
  template: `
    <div class="req-page">
      <div class="req-page__header">
        <div>
          <h1>Documentos requeridos</h1>
          <p class="req-page__subtitle">
            Documentos que la Facultad exige a estudiantes y empresas en cada etapa del proceso académico.
          </p>
        </div>
        <button mat-flat-button color="primary" (click)="openDialog()">
          <mat-icon>add</mat-icon> Nuevo documento
        </button>
      </div>

      <mat-card class="req-card">
        @if (requirements().length === 0) {
          <div class="empty-state">
            <mat-icon>rule_folder</mat-icon>
            <p>No hay documentos requeridos configurados</p>
          </div>
        } @else {
          @for (req of requirements(); track req.id) {
            <div class="req-row" [class.req-row--inactive]="!req.isActive">
              <div class="req-row__main">
                <span class="req-row__name">{{ req.name }}</span>
                @if (!req.isActive) { <span class="req-row__badge">Inactivo</span> }
                @if (!req.isMandatory) { <span class="req-row__badge req-row__badge--soft">Opcional</span> }
                <p class="req-row__meta">
                  {{ actorLabel(req.actorType) }} · {{ stageLabel(req.requiredAtStage) }}
                </p>
                @if (req.description) { <p class="req-row__desc">{{ req.description }}</p> }
              </div>
              <div class="req-row__actions">
                <button mat-icon-button (click)="openDialog(req)"><mat-icon>edit</mat-icon></button>
                <button mat-icon-button (click)="toggleActive(req)">
                  <mat-icon>{{ req.isActive ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </div>
            </div>
          }
        }
      </mat-card>
    </div>
  `,
  styles: [`
    .req-page { padding: 24px; max-width: 900px; margin: 0 auto; }
    .req-page__header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; gap: 16px; }
    .req-page__header h1 { margin: 0 0 4px; font-size: 1.4rem; font-weight: 700; }
    .req-page__subtitle { margin: 0; color: #6b7280; font-size: .875rem; }
    .req-card { padding: 8px; }
    .req-row { display: flex; justify-content: space-between; align-items: flex-start; padding: 14px 16px; border-bottom: 1px solid #f0f0f0; gap: 12px; }
    .req-row:last-child { border-bottom: none; }
    .req-row--inactive { opacity: .55; }
    .req-row__main { flex: 1; }
    .req-row__name { font-weight: 600; font-size: .9rem; }
    .req-row__badge { margin-left: 8px; font-size: .7rem; background: #f3f4f6; color: #6b7280; padding: 1px 8px; border-radius: 10px; }
    .req-row__badge--soft { background: #eef2ff; color: #4338ca; }
    .req-row__meta { margin: 4px 0 0; font-size: .8125rem; color: #6b7280; }
    .req-row__desc { margin: 4px 0 0; font-size: .8125rem; color: #6b7280; }
    .req-row__actions { display: flex; gap: 4px; flex-shrink: 0; }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 48px 0; color: #9ca3af; gap: 8px; }
  `],
})
export class DocumentRequirementsComponent {
  private readonly dialog = inject(MatDialog);
  private readonly adminService = inject(AdminService);

  readonly resource = httpResource<DocumentRequirement[]>(
    () => ({ url: `${environment.apiUrl}/admin/document-requirements` }),
  );

  readonly requirements = computed(() => this.resource.value() ?? []);

  actorLabel(v: string): string {
    return ACTOR_TYPES.find((a) => a.value === v)?.label ?? v;
  }

  stageLabel(v: string): string {
    return STAGES.find((s) => s.value === v)?.label ?? v;
  }

  openDialog(requirement?: DocumentRequirement) {
    this.dialog.open(DocumentRequirementDialogComponent, { data: requirement ?? null, width: '480px' })
      .afterClosed().subscribe((result) => {
        if (!result) return;
        const op$ = requirement
          ? this.adminService.updateDocumentRequirement(requirement.id, result)
          : this.adminService.createDocumentRequirement(result);
        op$.subscribe({ next: () => this.resource.reload() });
      });
  }

  toggleActive(requirement: DocumentRequirement) {
    this.adminService.updateDocumentRequirement(requirement.id, { isActive: !requirement.isActive })
      .subscribe({ next: () => this.resource.reload() });
  }
}
