import { Component, ChangeDetectionStrategy, inject, input, signal, computed } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DatePipe } from '@angular/common';
import { statusLabel as registryLabel } from '../../../../core/status/status-registry';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { ApplicationService, FinalDocRequirementInput } from '../../../applications/services/application.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../shared/components/ui/confirm-dialog/confirm-dialog.component';
import { StartFinalizationDialogComponent } from './start-finalization-dialog.component';

@Component({
  selector: 'app-finalization',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    MatCardModule, MatIconModule, MatButtonModule, MatCheckboxModule,
    MatFormFieldModule, MatInputModule, MatSnackBarModule, FormsModule,
    MatDialogModule, MatListModule, MatDividerModule,
  ],
  template: `
    <mat-card class="fin-card">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>flag_circle</mat-icon> Finalización del proyecto
        </mat-card-title>
      </mat-card-header>
      <mat-card-content>
        @if (record(); as r) {
          <div class="fin-summary">
            <div class="fin-summary__row">
              <span class="fin-summary__label">Estado</span>
              <span class="fin-summary__value">{{ statusLabel(r.status) }}</span>
            </div>
            @if (r.actualEndDate) {
              <div class="fin-summary__row">
                <span class="fin-summary__label">Fecha de cierre</span>
                <span class="fin-summary__value">{{ r.actualEndDate }}</span>
              </div>
            }
          </div>

          <mat-divider></mat-divider>

          <!-- Estado: active ─ iniciar finalización -->
          @if (r.status === 'active') {
            <div class="fin-action">
              <p>El proyecto está en desarrollo. Al iniciar la finalización, el estudiante y la empresa deberán subir los documentos finales.</p>
              <button mat-flat-button color="primary" [disabled]="loading()" (click)="start()">
                <mat-icon>flag</mat-icon> Iniciar finalización
              </button>
            </div>
          }

          <!-- Estado: waiting_final_docs / final_docs_review ─ verificar + docs pendientes -->
          @if (r.status === 'waiting_final_docs' || r.status === 'final_docs_review') {
            <div class="fin-action">
              @if (pendingDocs().length > 0) {
                <div class="fin-pending">
                  <h4><mat-icon>warning</mat-icon> Documentos obligatorios pendientes</h4>
                  <ul>
                    @for (d of pendingDocs(); track d.id) {
                      <li>{{ d.name }}</li>
                    }
                  </ul>
                </div>
              } @else if (r.status === 'final_docs_review') {
                <p class="fin-hint">Todos los documentos fueron aprobados. Puedes avanzar el estado.</p>
              } @else {
                <p class="fin-hint">Esperando la subida de documentos finales.</p>
              }
              <button mat-stroked-button [disabled]="loading()" (click)="advance()">
                <mat-icon>refresh</mat-icon> Verificar documentos y avanzar
              </button>
            </div>
          }

          <!-- Estado: finalizing ─ subir acta + nota numérica opcional -->
          @if (r.status === 'finalizing') {
            <div class="fin-action">
              <div class="fin-row">
                <button mat-stroked-button (click)="fileInput.click()" [disabled]="loading()">
                  <mat-icon>upload_file</mat-icon>
                  {{ fileName() || 'Seleccionar acta / documento de nota final' }}
                </button>
                <input #fileInput type="file" hidden accept=".pdf" (change)="onFileSelected($event)" />
              </div>
              <div class="fin-row">
                <mat-form-field appearance="outline">
                  <mat-label>Nota numérica (opcional, 0-5)</mat-label>
                  <input matInput type="number" min="0" max="5" step="0.1" [(ngModel)]="gradeValue" />
                </mat-form-field>
                <mat-checkbox [(ngModel)]="notifyByEmail">Enviar correo al estudiante</mat-checkbox>
              </div>
              <button mat-flat-button color="primary" [disabled]="!selectedFile() || loading()" (click)="uploadGrade()">
                <mat-icon>save</mat-icon> Cargar nota y completar
              </button>
            </div>
          }

          @if (r.status === 'completed') {
            <div class="fin-done">
              <mat-icon>check_circle</mat-icon>
              <div>
                <strong>Proyecto completado el {{ r.actualEndDate }}</strong>
                @if (r.finalGradeValue) {
                  <p>Nota final: {{ r.finalGradeValue }}/5</p>
                }
              </div>
            </div>
          }

          @if (r.status === 'cancelled') {
            <div class="fin-cancelled">
              <mat-icon>cancel</mat-icon>
              <div>
                <strong>Proyecto cancelado</strong>
                @if (r.cancellationReason) { <p>{{ r.cancellationReason }}</p> }
              </div>
            </div>
          }

          <!-- Cancelar (disponible mientras no esté completado ni cancelado) -->
          @if (r.status !== 'completed' && r.status !== 'cancelled') {
            <mat-divider></mat-divider>
            <div class="fin-danger">
              <button mat-stroked-button color="warn" [disabled]="loading()" (click)="cancelProject()">
                <mat-icon>cancel</mat-icon> Cancelar proyecto
              </button>
            </div>
          }
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .fin-card { margin-bottom: 16px; }
    mat-card-title mat-icon { vertical-align: middle; margin-right: 8px; }

    .fin-summary { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
    .fin-summary__row {
      display: flex; align-items: center; gap: 8px;
      font-size: 0.875rem;
    }
    .fin-summary__label {
      color: var(--mat-sys-on-surface-variant);
      font-weight: 500; min-width: 180px;
    }
    .fin-summary__value {
      display: inline-flex; align-items: center; gap: 6px; font-weight: 500;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }

    .fin-action { display: flex; flex-direction: column; gap: 12px; margin-top: 12px; }
    .fin-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .fin-hint { margin: 0; color: var(--mat-sys-on-surface-variant); font-size: 0.875rem; }

    .fin-pending {
      padding: 12px;
      background: var(--mat-sys-error-container);
      color: var(--mat-sys-on-error-container);
      border-radius: 8px;
      h4 { display: flex; align-items: center; gap: 6px; margin: 0 0 6px; font-size: 0.875rem; }
      ul { margin: 0; padding-left: 20px; font-size: 0.875rem; }
    }

    .fin-done, .fin-cancelled {
      display: flex; gap: 12px; align-items: center;
      padding: 12px;
      border-radius: 8px;
    }
    .fin-done {
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
    }
    .fin-cancelled {
      background: var(--mat-sys-error-container);
      color: var(--mat-sys-on-error-container);
    }
    .fin-done p, .fin-cancelled p { margin: 4px 0 0; font-size: 0.875rem; }

    .fin-danger { margin-top: 16px; }
  `],
})
export class FinalizationComponent {
  readonly applicationId = input.required<string>();

  private readonly applicationService = inject(ApplicationService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  readonly loading = signal(false);
  readonly selectedFile = signal<File | null>(null);
  readonly fileName = signal<string | null>(null);
  readonly pendingDocs = signal<{ id: string; name: string }[]>([]);
  gradeValue: number | null = null;
  notifyByEmail = true;

  readonly recordResource = rxResource({
    params: () => this.applicationId(),
    stream: (p) => this.applicationService.getAcademicRecord(p.params).pipe(catchError(() => of(null))),
  });

  readonly record = computed(() => this.recordResource.value());

  statusLabel(status: string): string {
    return registryLabel('academicRecord', status);
  }

  private reload() {
    this.loading.set(false);
    this.recordResource.reload();
  }

  start() {
    // Abre el diálogo obligatorio para definir los documentos finales
    // ad-hoc antes de disparar el cambio de estado.
    const ref = this.dialog.open(StartFinalizationDialogComponent, {
      width: '720px',
      disableClose: true,
    });
    ref.afterClosed().subscribe((finalDocs: FinalDocRequirementInput[] | undefined) => {
      if (!finalDocs || finalDocs.length === 0) return;
      this.loading.set(true);
      this.applicationService.startFinalization(this.applicationId(), finalDocs).subscribe({
        next: () => { this.reload(); this.snackBar.open(`Finalización iniciada — ${finalDocs.length} documento(s) requerido(s)`, 'OK', { duration: 3500 }); },
        error: (e) => { this.loading.set(false); this.snackBar.open(this.errMsg(e, 'Error al iniciar finalización'), 'Cerrar', { duration: 4000 }); },
      });
    });
  }

  advance() {
    this.loading.set(true);
    this.applicationService.advanceFinalization(this.applicationId()).subscribe({
      next: (resp) => {
        this.pendingDocs.set(resp.pendingDocs ?? []);
        this.reload();
        if (resp.pendingDocs?.length) {
          this.snackBar.open(`Faltan ${resp.pendingDocs.length} documento(s) obligatorio(s)`, 'Cerrar', { duration: 5000 });
        } else {
          this.snackBar.open('Estado actualizado', 'OK', { duration: 3000 });
        }
      },
      error: (e) => { this.loading.set(false); this.snackBar.open(this.errMsg(e, 'Error al avanzar'), 'Cerrar', { duration: 4000 }); },
    });
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.selectedFile.set(file);
    this.fileName.set(file.name);
  }

  uploadGrade() {
    const file = this.selectedFile();
    if (!file) return;
    this.loading.set(true);
    this.applicationService.uploadFinalGrade(
      this.applicationId(),
      file,
      this.gradeValue ?? undefined,
      this.notifyByEmail,
    ).subscribe({
      next: () => { this.reload(); this.snackBar.open('Nota final cargada — proyecto completado', 'OK', { duration: 3000 }); },
      error: (e) => { this.loading.set(false); this.snackBar.open(this.errMsg(e, 'Error al cargar nota final'), 'Cerrar', { duration: 4000 }); },
    });
  }

  cancelProject() {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Cancelar proyecto',
        message: '¿Cancelar el proyecto? Esta acción cierra el proceso académico sin evaluación. No se puede deshacer.',
        confirmText: 'Cancelar proyecto',
        type: 'danger',
        consequences: [
          'La postulación queda marcada como rechazada.',
          'El estudiante, la empresa y el asesor recibirán una notificación.',
          'No se generarán evaluaciones ni acta final.',
        ],
      } satisfies ConfirmDialogData,
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.loading.set(true);
      this.applicationService.cancelFinalization(this.applicationId()).subscribe({
        next: () => { this.reload(); this.snackBar.open('Proyecto cancelado', 'OK', { duration: 3000 }); },
        error: (e) => { this.loading.set(false); this.snackBar.open(this.errMsg(e, 'Error al cancelar'), 'Cerrar', { duration: 4000 }); },
      });
    });
  }

  private errMsg(err: any, fallback: string): string {
    const msg = err?.error?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    return msg ?? fallback;
  }
}
