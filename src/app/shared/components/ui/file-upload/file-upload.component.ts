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
  templateUrl: './file-upload.component.html',
  styleUrl: './file-upload.component.scss',
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
