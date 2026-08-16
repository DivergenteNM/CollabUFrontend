import {
  Component,
  ChangeDetectionStrategy,
  inject,
  input,
  signal,
  computed,
  OnDestroy,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import {
  StorageService,
  StoredFileInfo,
  FileAccessError,
} from '../../../../core/services/storage.service';

const PREVIEWABLE_MIME_PREFIXES = ['application/pdf', 'image/', 'text/plain'];

const ICON_BY_MIME: { match: (mime: string) => boolean; icon: string }[] = [
  { match: (m) => m === 'application/pdf', icon: 'picture_as_pdf' },
  { match: (m) => m.startsWith('image/'), icon: 'image' },
  { match: (m) => m.includes('word') || m.includes('document'), icon: 'description' },
  { match: (m) => m.includes('sheet') || m.includes('excel'), icon: 'table_chart' },
  { match: (m) => m.includes('presentation') || m.includes('powerpoint'), icon: 'slideshow' },
  { match: (m) => m.includes('zip') || m.includes('rar') || m.includes('gzip'), icon: 'folder_zip' },
];

/**
 * Punto único del frontend para mostrar un archivo de Storage Service.
 *
 * Antes ningún componente del flujo académico renderizaba los archivos: el
 * anteproyecto guardaba `currentFileId` y nunca se mostraba, y los documentos
 * requeridos solo ofrecían subir. Quien tenía que revisar no podía leer nada.
 *
 * Distingue los cuatro fallos posibles — no existe, sin permiso, ausente en
 * disco, error de red — porque cada uno significa algo distinto para el usuario.
 */
@Component({
  selector: 'app-file-link',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatButtonModule, MatTooltipModule, MatProgressSpinnerModule],
  template: `
    @if (resource.isLoading()) {
      <div class="file-link file-link--loading">
        <mat-spinner diameter="18" />
        <span class="file-link__name">Cargando archivo…</span>
      </div>
    } @else if (errorMessage(); as message) {
      <div class="file-link file-link--error">
        <mat-icon>{{ errorIcon() }}</mat-icon>
        <span class="file-link__name">{{ message }}</span>
      </div>
    } @else if (info(); as file) {
      <div class="file-link">
        <mat-icon class="file-link__icon">{{ iconFor(file.mimeType) }}</mat-icon>
        <div class="file-link__body">
          <span class="file-link__name" [title]="file.originalName">{{ file.originalName }}</span>
          <span class="file-link__meta">
            {{ formatSize(file.fileSizeBytes) }}
            @if (file.version > 1) { · v{{ file.version }} }
          </span>
        </div>
        <div class="file-link__actions">
          @if (busy()) {
            <mat-spinner diameter="18" />
          } @else {
            @if (canPreview(file.mimeType)) {
              <button
                mat-icon-button
                type="button"
                matTooltip="Ver"
                aria-label="Ver el archivo"
                (click)="preview()">
                <mat-icon>visibility</mat-icon>
              </button>
            }
            <button
              mat-icon-button
              type="button"
              matTooltip="Descargar"
              aria-label="Descargar el archivo"
              (click)="download()">
              <mat-icon>download</mat-icon>
            </button>
          }
        </div>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .file-link {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-2) var(--space-3);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius-md);
        background: var(--bg-card);
        min-width: 0;
      }
      .file-link--loading,
      .file-link--error {
        color: var(--text-secondary);
        font-size: 0.8125rem;
      }
      .file-link--error {
        border-style: dashed;
        color: var(--color-warn);
      }
      .file-link__icon {
        flex-shrink: 0;
        color: var(--color-accent);
      }
      .file-link__body {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
      }
      .file-link__name {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .file-link--error .file-link__name {
        color: inherit;
        font-weight: 400;
      }
      .file-link__meta {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }
      .file-link__actions {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        gap: var(--space-1);
      }
    `,
  ],
})
export class FileLinkComponent implements OnDestroy {
  /** Identificador en Storage Service. Si es `null`, el componente no pinta nada. */
  readonly fileId = input.required<string | null>();
  /** Nombre a usar al guardar; por defecto, el nombre original del archivo. */
  readonly downloadName = input<string | null>(null);

  private readonly storage = inject(StorageService);
  private readonly snackBar = inject(MatSnackBar);

  readonly busy = signal(false);
  private objectUrls: string[] = [];

  readonly resource = rxResource({
    params: () => this.fileId(),
    stream: ({ params: id }) => {
      // Storage exige UUID v4; si nos llega una URL o valor no-UUID (datos
      // legacy/seed), fallaría con 404 en /storage/files/<url>. Se corta
      // antes de la llamada y el template renderiza fallback silencioso.
      if (!id) return of(null);
      const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRe.test(id)) return of(null);
      return this.storage.getFileInfo(id);
    },
  });

  readonly info = computed(() => this.resource.value() ?? null);

  readonly errorMessage = computed(() => {
    const error = this.resource.error();
    if (!error) return null;
    return error instanceof FileAccessError ? error.message : 'No se pudo obtener el archivo';
  });

  readonly errorIcon = computed(() => {
    const error = this.resource.error();
    if (error instanceof FileAccessError && error.reason === 'forbidden') return 'lock';
    return 'error_outline';
  });

  ngOnDestroy(): void {
    this.objectUrls.forEach((url) => this.storage.revokeObjectUrl(url));
    this.objectUrls = [];
  }

  iconFor(mimeType: string): string {
    return ICON_BY_MIME.find((entry) => entry.match(mimeType))?.icon ?? 'insert_drive_file';
  }

  canPreview(mimeType: string): boolean {
    return PREVIEWABLE_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix));
  }

  formatSize(bytes: number | string | null | undefined): string {
    // Storage devuelve fileSizeBytes como bigint → string en algunos flujos;
    // hay que coaccionar antes de operar aritméticamente para evitar
    // TypeError: value.toFixed is not a function.
    const n = typeof bytes === 'number' ? bytes : Number(bytes);
    if (!n || Number.isNaN(n)) return '—';
    const units = ['B', 'KB', 'MB', 'GB'];
    let value = n;
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) {
      value /= 1024;
      unit++;
    }
    return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
  }

  preview(): void {
    const id = this.fileId();
    if (!id || this.busy()) return;
    this.busy.set(true);

    this.storage.getObjectUrl(id).subscribe({
      next: (url) => {
        this.busy.set(false);
        this.objectUrls.push(url);
        window.open(url, '_blank', 'noopener');
      },
      error: (err) => {
        this.busy.set(false);
        this.notifyFailure(err);
      },
    });
  }

  download(): void {
    const id = this.fileId();
    const file = this.info();
    if (!id || this.busy()) return;
    this.busy.set(true);

    const name = this.downloadName() ?? file?.originalName ?? 'archivo';
    this.storage.saveAs(id, name).subscribe({
      next: () => this.busy.set(false),
      error: (err) => {
        this.busy.set(false);
        this.notifyFailure(err);
      },
    });
  }

  private notifyFailure(err: unknown): void {
    const message =
      err instanceof FileAccessError ? err.message : 'No se pudo descargar el archivo';
    this.snackBar.open(message, 'Cerrar', { duration: 4000 });
  }
}
