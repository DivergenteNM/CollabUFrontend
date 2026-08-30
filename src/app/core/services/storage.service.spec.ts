import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpErrorResponse } from '@angular/common/http';

import { StorageService, FileAccessError } from './storage.service';
import { environment } from '../../../environments/environment';

describe('StorageService', () => {
  let service: StorageService;
  let httpTesting: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/storage`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(StorageService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('upload', () => {
    it('usa publicUrl cuando el backend la devuelve (archivo público)', () => {
      const file = new File(['contenido'], 'foto.png', { type: 'image/png' });
      service.upload(file, 'avatar', true).subscribe((res) => {
        expect(res.data.fileId).toBe('file-1');
        expect(res.data.url).toBe('https://cdn.example.com/foto.png');
      });

      const req = httpTesting.expectOne(`${baseUrl}/upload`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBe(true);
      req.flush({ data: { id: 'file-1', publicUrl: 'https://cdn.example.com/foto.png' } });
    });

    it('construye la URL del endpoint autenticado cuando el archivo es privado (sin publicUrl)', () => {
      const file = new File(['contenido'], 'informe.pdf', { type: 'application/pdf' });
      service.upload(file, 'project_document').subscribe((res) => {
        expect(res.data.fileId).toBe('file-2');
        expect(res.data.url).toBe(`${baseUrl}/files/file-2/download`);
      });

      const req = httpTesting.expectOne(`${baseUrl}/upload`);
      req.flush({ data: { id: 'file-2' } });
    });
  });

  describe('getFileInfo', () => {
    it('desenvuelve el payload cuando viene bajo `data`', () => {
      service.getFileInfo('file-1').subscribe((info) => {
        expect(info.id).toBe('file-1');
        expect(info.originalName).toBe('informe.pdf');
      });

      const req = httpTesting.expectOne(`${baseUrl}/files/file-1`);
      req.flush({ data: { id: 'file-1', originalName: 'informe.pdf' } });
    });

    it('traduce 403 a FileAccessError con reason forbidden', () => {
      service.getFileInfo('file-1').subscribe({
        error: (err: FileAccessError) => {
          expect(err).toBeInstanceOf(FileAccessError);
          expect(err.reason).toBe('forbidden');
        },
      });

      const req = httpTesting.expectOne(`${baseUrl}/files/file-1`);
      req.flush({ message: 'forbidden' }, { status: 403, statusText: 'Forbidden' });
    });

    it('traduce 404 con mensaje "físico" a reason missing_on_disk', () => {
      service.getFileInfo('file-1').subscribe({
        error: (err: FileAccessError) => {
          expect(err.reason).toBe('missing_on_disk');
        },
      });

      const req = httpTesting.expectOne(`${baseUrl}/files/file-1`);
      req.flush({ message: 'El archivo físico no está disponible' }, { status: 404, statusText: 'Not Found' });
    });

    it('traduce 404 sin mensaje "físico" a reason not_found', () => {
      service.getFileInfo('file-1').subscribe({
        error: (err: FileAccessError) => {
          expect(err.reason).toBe('not_found');
        },
      });

      const req = httpTesting.expectOne(`${baseUrl}/files/file-1`);
      req.flush({ message: 'no existe' }, { status: 404, statusText: 'Not Found' });
    });

    it('traduce cualquier otro código a reason unknown', () => {
      service.getFileInfo('file-1').subscribe({
        error: (err: FileAccessError) => {
          expect(err.reason).toBe('unknown');
        },
      });

      const req = httpTesting.expectOne(`${baseUrl}/files/file-1`);
      req.flush({}, { status: 500, statusText: 'Server Error' });
    });
  });

  describe('deleteFile', () => {
    it('hace DELETE al archivo por id', () => {
      service.deleteFile('file-1').subscribe();

      const req = httpTesting.expectOne(`${baseUrl}/file-1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('getQuota', () => {
    it('obtiene el uso de cuota de almacenamiento', () => {
      service.getQuota().subscribe((res) => {
        expect(res.data.usedBytes).toBe(1024);
      });

      const req = httpTesting.expectOne(`${baseUrl}/quota`);
      expect(req.request.method).toBe('GET');
      req.flush({ data: { usedBytes: 1024, totalBytes: 2048, percentage: 50 } });
    });
  });
});
