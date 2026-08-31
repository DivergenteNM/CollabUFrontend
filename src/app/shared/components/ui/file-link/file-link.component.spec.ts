import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { of, throwError } from 'rxjs';

import { FileLinkComponent } from './file-link.component';
import {
  StorageService,
  StoredFileInfo,
  FileAccessError,
} from '../../../../core/services/storage.service';

const fileInfo: StoredFileInfo = {
  id: 'file-1',
  ownerId: 'student-1',
  originalName: 'anteproyecto-v1.pdf',
  storedName: 'stored.pdf',
  mimeType: 'application/pdf',
  fileSizeBytes: 307200,
  category: 'academic_document',
  entityType: null,
  entityId: null,
  publicUrl: null,
  isPublic: false,
  version: 1,
  createdAt: '2026-08-01T10:00:00Z',
};

describe('FileLinkComponent', () => {
  let fixture: ComponentFixture<FileLinkComponent>;
  let storage: {
    getFileInfo: ReturnType<typeof vi.fn>;
    getObjectUrl: ReturnType<typeof vi.fn>;
    saveAs: ReturnType<typeof vi.fn>;
    revokeObjectUrl: ReturnType<typeof vi.fn>;
  };

  async function setup(fileId: string | null = 'file-1') {
    fixture = TestBed.createComponent(FileLinkComponent);
    fixture.componentRef.setInput('fileId', fileId);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    storage = {
      getFileInfo: vi.fn().mockReturnValue(of(fileInfo)),
      getObjectUrl: vi.fn(),
      saveAs: vi.fn(),
      revokeObjectUrl: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [FileLinkComponent],
      providers: [provideAnimationsAsync(), { provide: StorageService, useValue: storage }],
    }).compileComponents();
  });

  it('muestra el nombre y el tamaño del archivo', async () => {
    await setup();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.file-link__name')?.textContent?.trim()).toBe('anteproyecto-v1.pdf');
    expect(el.querySelector('.file-link__meta')?.textContent).toContain('300.0 KB');
  });

  it('extrae el UUID y consulta el archivo cuando recibe una URL relativa de storage', async () => {
    await setup('/api/v1/storage/files/3fa85f64-5717-4562-b3fc-2c963f66afa6/download');
    expect(storage.getFileInfo).toHaveBeenCalledWith('3fa85f64-5717-4562-b3fc-2c963f66afa6');
  });

  it('ofrece vista previa para PDF y descarga siempre', async () => {
    await setup();
    const buttons = fixture.nativeElement.querySelectorAll('.file-link__actions button');
    expect(buttons.length).toBe(2);
  });

  it('no ofrece vista previa para formatos no visualizables', async () => {
    storage.getFileInfo.mockReturnValue(
      of({ ...fileInfo, mimeType: 'application/zip', originalName: 'entrega.zip' }),
    );
    await setup();
    const buttons = fixture.nativeElement.querySelectorAll('.file-link__actions button');
    expect(buttons.length).toBe(1);
  });

  it('distingue la falta de permiso de la ausencia de archivo', async () => {
    storage.getFileInfo.mockReturnValue(
      throwError(() => new FileAccessError('forbidden', 'No tienes permiso para ver este archivo')),
    );
    await setup();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.file-link--error')).toBeTruthy();
    expect(el.textContent).toContain('No tienes permiso');
    expect(el.querySelector('mat-icon')?.textContent?.trim()).toBe('lock');
  });

  it('informa cuando el registro existe pero el binario no está en el servidor', async () => {
    storage.getFileInfo.mockReturnValue(
      throwError(
        () => new FileAccessError('missing_on_disk', 'El archivo no está disponible en el servidor'),
      ),
    );
    await setup();
    expect(fixture.nativeElement.textContent).toContain('no está disponible en el servidor');
  });

  it('no consulta nada cuando no hay fileId', async () => {
    await setup(null);
    expect(storage.getFileInfo).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.file-link')).toBeNull();
  });

  it('descarga con el nombre original del archivo', async () => {
    storage.saveAs.mockReturnValue(of(void 0));
    await setup();

    fixture.componentInstance.download();

    expect(storage.saveAs).toHaveBeenCalledWith('file-1', 'anteproyecto-v1.pdf');
  });

  it('respeta el nombre de descarga indicado por el contenedor', async () => {
    storage.saveAs.mockReturnValue(of(void 0));
    fixture = TestBed.createComponent(FileLinkComponent);
    fixture.componentRef.setInput('fileId', 'file-1');
    fixture.componentRef.setInput('downloadName', 'Póliza estudiantil.pdf');
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.download();

    expect(storage.saveAs).toHaveBeenCalledWith('file-1', 'Póliza estudiantil.pdf');
  });

  it('libera las URLs de objeto creadas al destruirse', async () => {
    storage.getObjectUrl.mockReturnValue(of('blob:fake-url'));
    vi.spyOn(window, 'open').mockImplementation(() => null);
    await setup();

    fixture.componentInstance.preview();
    fixture.destroy();

    expect(storage.revokeObjectUrl).toHaveBeenCalledWith('blob:fake-url');
  });
});
