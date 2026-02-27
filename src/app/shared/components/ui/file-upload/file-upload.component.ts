import { Component, ChangeDetectionStrategy, input, output, signal, computed, ElementRef, viewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-file-upload',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatButtonModule, MatProgressBarModule],
  host: {
    'class': 'file-upload',
    '(dragover)': 'onDragOver($event)',
    '(dragleave)': 'onDragLeave($event)',
    '(drop)': 'onDrop($event)',
  },
  template: `
    <div
      class="file-upload__zone"
      [class.dragging]="isDragging()"
      [class.has-files]="selectedFiles().length > 0"
      (click)="openFilePicker()">

      <input
        #fileInputEl
        type="file"
        hidden
        [accept]="accept()"
        [multiple]="multiple()"
        (change)="onFileChange($event)" />

      @if (selectedFiles().length === 0) {
        <mat-icon class="file-upload__icon">cloud_upload</mat-icon>
        <p class="file-upload__label">{{ label() }}</p>
        <p class="file-upload__hint">
          {{ accept() }} · Máx {{ maxSizeMB() }}MB
        </p>
      } @else {
        <div class="file-upload__files">
          @for (file of selectedFiles(); track file.name) {
            <div class="file-upload__file">
              <mat-icon>description</mat-icon>
              <span class="file-upload__filename">{{ file.name }}</span>
              <span class="file-upload__filesize">{{ formatSize(file.size) }}</span>
              <button mat-icon-button (click)="removeFile(file, $event)" aria-label="Eliminar archivo">
                <mat-icon>close</mat-icon>
              </button>
            </div>
          }
        </div>
      }
    </div>

    @if (uploadProgress() !== undefined && uploadProgress()! >= 0) {
      <mat-progress-bar mode="determinate" [value]="uploadProgress()!" />
    }

    @if (error()) {
      <p class="file-upload__error">{{ error() }}</p>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .file-upload__zone {
      border: 2px dashed var(--mat-sys-outline-variant);
      border-radius: 12px;
      padding: 32px;
      text-align: center;
      cursor: pointer;
      transition: border-color 200ms, background-color 200ms;

      &:hover,
      &.dragging {
        border-color: var(--mat-sys-primary);
        background-color: color-mix(in srgb, var(--mat-sys-primary) 5%, transparent);
      }

      &.has-files {
        padding: 16px;
        text-align: left;
      }
    }

    .file-upload__icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: var(--mat-sys-primary);
      margin-bottom: 8px;
    }

    .file-upload__label {
      font-size: 0.9375rem;
      color: var(--mat-sys-on-surface);
      margin: 4px 0;
    }

    .file-upload__hint {
      font-size: 0.8125rem;
      color: var(--mat-sys-on-surface-variant);
      margin: 0;
    }

    .file-upload__files {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .file-upload__file {
      display: flex;
      align-items: center;
      gap: 8px;

      mat-icon:first-child {
        color: var(--mat-sys-primary);
      }
    }

    .file-upload__filename {
      flex: 1;
      font-size: 0.875rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .file-upload__filesize {
      font-size: 0.75rem;
      color: var(--mat-sys-on-surface-variant);
    }

    mat-progress-bar {
      margin-top: 8px;
    }

    .file-upload__error {
      color: var(--mat-sys-error);
      font-size: 0.8125rem;
      margin: 8px 0 0;
    }
  `,
})
export class FileUploadComponent {
  readonly accept = input<string>('.pdf,.doc,.docx');
  readonly maxSizeMB = input<number>(5);
  readonly multiple = input<boolean>(false);
  readonly label = input<string>('Arrastra archivos aquí o haz clic');
  readonly fileSelected = output<File[]>();
  readonly uploadProgress = input<number>();

  readonly fileInputRef = viewChild.required<ElementRef<HTMLInputElement>>('fileInputEl');

  protected readonly isDragging = signal(false);
  protected readonly selectedFiles = signal<File[]>([]);
  protected readonly error = signal<string>('');

  openFilePicker(): void {
    this.fileInputRef().nativeElement.click();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
    const files = event.dataTransfer?.files;
    if (files) {
      this.processFiles(Array.from(files));
    }
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.processFiles(Array.from(input.files));
      input.value = '';
    }
  }

  removeFile(file: File, event: Event): void {
    event.stopPropagation();
    this.selectedFiles.update((files) => files.filter((f) => f !== file));
    this.fileSelected.emit(this.selectedFiles());
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  private processFiles(files: File[]): void {
    this.error.set('');
    const maxBytes = this.maxSizeMB() * 1024 * 1024;
    const acceptedTypes = this.accept()
      .split(',')
      .map((t) => t.trim().toLowerCase());

    const valid: File[] = [];
    for (const file of files) {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!acceptedTypes.some((t) => t === ext || file.type.includes(t.replace('.', '')))) {
        this.error.set(`Tipo no permitido: ${file.name}`);
        return;
      }
      if (file.size > maxBytes) {
        this.error.set(`Archivo muy grande: ${file.name} (${this.formatSize(file.size)})`);
        return;
      }
      valid.push(file);
    }

    if (this.multiple()) {
      this.selectedFiles.update((prev) => [...prev, ...valid]);
    } else {
      this.selectedFiles.set(valid.slice(0, 1));
    }

    this.fileSelected.emit(this.selectedFiles());
  }
}
