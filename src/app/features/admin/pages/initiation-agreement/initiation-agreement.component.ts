import { Component, ChangeDetectionStrategy, inject, input, signal, computed } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { ApplicationService } from '../../../applications/services/application.service';

@Component({
  selector: 'app-initiation-agreement',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSnackBarModule, FormsModule],
  template: `
    <mat-card class="ia-card">
      <mat-card-header>
        <mat-card-title>Acuerdo de iniciación</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        @if (record(); as r) {
          @if (r.initiationAgreementFileId) {
            <div class="ia-done">
              <mat-icon>check_circle</mat-icon>
              <div>
                <strong>Acuerdo cargado</strong>
                <p>Inicio oficial: {{ r.officialStartDate }} · Fin esperado: {{ r.expectedEndDate }}</p>
              </div>
            </div>
          } @else {
            <div class="ia-checklist">
              <div class="ia-check-item" [class.ia-check-item--ok]="checklist()?.anteproyectoApproved">
                <mat-icon>{{ checklist()?.anteproyectoApproved ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                Anteproyecto aprobado
              </div>
              <div class="ia-check-item" [class.ia-check-item--ok]="checklist()?.mandatoryDocumentsApproved">
                <mat-icon>{{ checklist()?.mandatoryDocumentsApproved ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                Documentos obligatorios aprobados
              </div>
            </div>

            @if (checklist()?.readyForAgreement) {
              <div class="ia-upload">
                <mat-form-field appearance="outline" class="full-w">
                  <mat-label>Duración acordada (semanas)</mat-label>
                  <input matInput type="number" [(ngModel)]="durationWeeks" min="1" />
                </mat-form-field>
                <button mat-stroked-button (click)="fileInput.click()" [disabled]="uploading()">
                  <mat-icon>upload_file</mat-icon> {{ fileName() || 'Seleccionar PDF del acuerdo firmado' }}
                </button>
                <input #fileInput type="file" hidden accept=".pdf" (change)="onFileSelected($event)" />
                <button mat-flat-button color="primary" [disabled]="!selectedFile() || uploading()" (click)="upload()">
                  <mat-icon>save</mat-icon> Cargar acuerdo
                </button>
              </div>
            } @else {
              <p class="ia-hint">Aún no se cumplen las precondiciones para cargar el acuerdo.</p>
            }
          }
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .ia-card { margin-bottom: 16px; }
    .ia-done { display: flex; gap: 12px; align-items: flex-start; color: #16a34a; }
    .ia-checklist { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
    .ia-check-item { display: flex; align-items: center; gap: 8px; font-size: .875rem; color: #9ca3af; }
    .ia-check-item--ok { color: #16a34a; }
    .ia-upload { display: flex; flex-direction: column; gap: 10px; align-items: flex-start; }
    .full-w { width: 240px; }
    .ia-hint { color: #6b7280; font-size: .875rem; }
  `],
})
export class InitiationAgreementComponent {
  readonly applicationId = input.required<string>();

  private readonly applicationService = inject(ApplicationService);
  private readonly snackBar = inject(MatSnackBar);

  readonly durationWeeks = signal(16);
  readonly selectedFile = signal<File | null>(null);
  readonly fileName = signal<string | null>(null);
  readonly uploading = signal(false);

  readonly recordResource = rxResource({
    params: () => this.applicationId(),
    stream: (p) => this.applicationService.getAcademicRecord(p.params).pipe(catchError(() => of(null))),
  });

  readonly checklistResource = rxResource({
    params: () => this.applicationId(),
    stream: (p) => this.applicationService.getInitiationChecklist(p.params).pipe(catchError(() => of(null))),
  });

  readonly record = computed(() => this.recordResource.value());
  readonly checklist = computed(() => this.checklistResource.value());

  /**
   * El contenedor (`ProjectWorkspaceComponent.reloadAll()`) recarga sus propios
   * recursos al aprobar un documento o crear un entregable, pero este panel
   * maneja sus propios `rxResource` internos y no se enteraba — el checklist
   * quedaba con el snapshot del primer render aunque el estado real cambiara.
   */
  reload(): void {
    this.recordResource.reload();
    this.checklistResource.reload();
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.selectedFile.set(file);
    this.fileName.set(file.name);
  }

  upload() {
    const file = this.selectedFile();
    if (!file) return;
    this.uploading.set(true);
    this.applicationService.uploadInitiationAgreement(this.applicationId(), file, this.durationWeeks()).subscribe({
      next: () => {
        this.uploading.set(false);
        this.snackBar.open('Acuerdo de iniciación cargado', 'OK', { duration: 3000 });
        this.recordResource.reload();
      },
      error: (err) => {
        this.uploading.set(false);
        this.snackBar.open(err?.error?.message ?? 'Error al cargar el acuerdo', 'Cerrar', { duration: 4000 });
      },
    });
  }
}
