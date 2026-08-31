import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { rxResource } from '@angular/core/rxjs-interop';
import { Observable, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

import { AdminService, DocumentRequirement } from '../../../../features/admin/services/admin.service';
import { StorageService } from '../../../../core/services/storage.service';
import { ApiResponse } from '../../../../core/models';

const ACTOR_LABELS: Record<string, string> = { student: 'Estudiante', company: 'Empresa' };

/**
 * El admin elige, para ESTE proyecto, cuáles documentos del catálogo global
 * (admin-service) va a solicitar — o crea uno nuevo (que queda guardado en el
 * catálogo, reutilizable después en otros proyectos). Antes de esto, TODOS
 * los `document_requirements` con `requiredAtStage=pre_initiation` aplicaban
 * a todos los proyectos por igual, sin selección real.
 */
@Component({
  selector: 'app-select-document-requirements-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule, MatDialogModule, MatIconModule, MatButtonModule, MatCheckboxModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressSpinnerModule, MatSnackBarModule,
  ],
  template: `
    <h2 mat-dialog-title>Documentos requeridos para este proyecto</h2>
    <mat-dialog-content class="sdr">
      <p class="sdr__hint">Selecciona del catálogo existente o crea uno nuevo. Se pedirán a estudiante/empresa según el actor.</p>

      @if (catalogResource.isLoading()) {
        <div class="sdr__loading"><mat-spinner diameter="24" /></div>
      } @else {
        @for (actor of ['student', 'company']; track actor) {
          <div class="sdr__group">
            <span class="sdr__group-title">{{ actorLabel(actor) }}</span>
            @for (item of catalogByActor(actor); track item.id) {
              <label class="sdr__item">
                <mat-checkbox [checked]="selected().has(item.id)" (change)="toggle(item.id)">
                  {{ item.name }}
                  @if (item.isMandatory) { <span class="sdr__badge">Obligatorio</span> }
                </mat-checkbox>
              </label>
            }
            @if (catalogByActor(actor).length === 0) {
              <p class="sdr__empty">Sin documentos en el catálogo todavía para este actor.</p>
            }
          </div>
        }
      }

      <div class="sdr__new">
        @if (!showNewForm()) {
          <button mat-button type="button" (click)="showNewForm.set(true)">
            <mat-icon>add</mat-icon> Crear nuevo documento
          </button>
        } @else {
          <div class="sdr__new-form">
            <mat-form-field appearance="outline">
              <mat-label>Nombre</mat-label>
              <input matInput [(ngModel)]="newName" placeholder="Ej. Certificado de matrícula" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Descripción (opcional)</mat-label>
              <textarea matInput rows="2" [(ngModel)]="newDescription"></textarea>
            </mat-form-field>
            <div class="sdr__new-row">
              <mat-form-field appearance="outline" class="sdr__new-field">
                <mat-label>Lo sube</mat-label>
                <mat-select [(ngModel)]="newActorType">
                  <mat-option value="student">Estudiante</mat-option>
                  <mat-option value="company">Empresa</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-checkbox [(ngModel)]="newIsMandatory">Obligatorio</mat-checkbox>
            </div>
            <div class="sdr__new-row">
              @if (newTemplateFile(); as f) {
                <span class="sdr__template-name"><mat-icon>description</mat-icon> {{ f.name }}</span>
                <button mat-icon-button type="button" (click)="newTemplateFile.set(null)"><mat-icon>close</mat-icon></button>
              } @else {
                <button mat-button type="button" (click)="templateFileInput.click()">
                  <mat-icon>attach_file</mat-icon> Adjuntar plantilla (opcional)
                </button>
              }
              <input #templateFileInput type="file" hidden (change)="onTemplateFileSelected($event)" />
            </div>
            <div class="sdr__new-actions">
              <button mat-button type="button" (click)="showNewForm.set(false)">Cancelar</button>
              <button mat-flat-button color="primary" type="button"
                [disabled]="!newName.trim() || creating()"
                (click)="createRequirement()">
                @if (creating()) { <mat-spinner diameter="16" /> } @else { Crear y agregar }
              </button>
            </div>
          </div>
        }
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="selected().size === 0" (click)="confirm()">
        Confirmar ({{ selected().size }})
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .sdr { min-width: 480px; max-width: 560px; }
    .sdr__hint { font-size: .8125rem; color: var(--text-secondary); margin: 0 0 12px; }
    .sdr__loading { display: flex; justify-content: center; padding: 24px 0; }
    .sdr__group { margin-bottom: 14px; }
    .sdr__group-title { display: block; font-size: .75rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: .03em; color: var(--text-secondary); margin-bottom: 6px; }
    .sdr__item { display: block; margin-bottom: 4px; }
    .sdr__badge { font-size: .625rem; background: color-mix(in srgb, var(--color-error) 10%, transparent);
      color: var(--color-error); padding: 1px 6px; border-radius: 8px; margin-left: 6px; }
    .sdr__empty { font-size: .75rem; color: var(--text-secondary); font-style: italic; margin: 0; }
    .sdr__new { margin-top: 12px; border-top: 1px solid var(--border-color); padding-top: 12px; }
    .sdr__new-form { display: flex; flex-direction: column; gap: 8px; }
    .sdr__new-row { display: flex; align-items: center; gap: 8px; }
    .sdr__new-field { flex: 1; }
    .sdr__template-name { display: flex; align-items: center; gap: 4px; font-size: .8125rem; }
    .sdr__new-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px; }
  `],
})
export class SelectDocumentRequirementsDialogComponent {
  private readonly ref = inject(MatDialogRef<SelectDocumentRequirementsDialogComponent>);
  private readonly adminService = inject(AdminService);
  private readonly storageService = inject(StorageService);
  private readonly snackBar = inject(MatSnackBar);

  readonly selected = signal<Set<string>>(new Set());
  readonly showNewForm = signal(false);
  readonly creating = signal(false);

  newName = '';
  newDescription = '';
  newActorType: 'student' | 'company' = 'student';
  newIsMandatory = true;
  readonly newTemplateFile = signal<File | null>(null);

  readonly catalogResource = rxResource({
    params: () => ({}),
    stream: () => this.adminService
      .getDocumentRequirements({ requiredAtStage: 'pre_initiation', onlyActive: true })
      .pipe(catchError(() => of([] as DocumentRequirement[]))),
  });

  readonly catalog = computed(() => this.catalogResource.value() ?? []);

  catalogByActor(actor: string): DocumentRequirement[] {
    return this.catalog().filter((c) => c.actorType === actor);
  }

  actorLabel(actor: string): string {
    return ACTOR_LABELS[actor] ?? actor;
  }

  toggle(id: string): void {
    const next = new Set(this.selected());
    if (next.has(id)) next.delete(id); else next.add(id);
    this.selected.set(next);
  }

  onTemplateFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.newTemplateFile.set(file);
  }

  createRequirement(): void {
    const name = this.newName.trim();
    if (!name || this.creating()) return;
    this.creating.set(true);

    const file = this.newTemplateFile();
    // Público: es una plantilla/formato genérico sin datos privados, y debe
    // poder verla cualquier actor del proyecto aunque application-service no
    // sepa resolver el acceso a un archivo que vive en el catálogo de admin-service.
    const upload$: Observable<ApiResponse<{ fileId: string; url: string }> | null> = file
      ? this.storageService.upload(file, 'academic_document', true)
      : of(null);

    upload$.pipe(
      switchMap((res) => this.adminService.createDocumentRequirement({
        name,
        description: this.newDescription.trim() || undefined,
        actorType: this.newActorType,
        requiredAtStage: 'pre_initiation',
        isMandatory: this.newIsMandatory,
        templateFileId: res?.data?.fileId,
      } as Partial<DocumentRequirement>)),
    ).subscribe({
      next: (created) => {
        this.creating.set(false);
        this.catalogResource.reload();
        const next = new Set(this.selected());
        next.add(created.id);
        this.selected.set(next);
        this.showNewForm.set(false);
        this.newName = '';
        this.newDescription = '';
        this.newTemplateFile.set(null);
        this.snackBar.open('Documento creado y agregado', 'OK', { duration: 2500 });
      },
      error: () => {
        this.creating.set(false);
        this.snackBar.open('No se pudo crear el documento', 'Cerrar', { duration: 4000 });
      },
    });
  }

  confirm(): void {
    this.ref.close([...this.selected()]);
  }
}
