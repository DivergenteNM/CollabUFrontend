import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { ApplicationService } from './application.service';
import { StorageService } from '../../../core/services/storage.service';
import { ApplicationStatus } from '../../../core/enums';
import { environment } from '../../../../environments/environment';

describe('ApplicationService', () => {
  let service: ApplicationService;
  let httpTesting: HttpTestingController;
  let storageMock: { upload: ReturnType<typeof vi.fn> };
  const baseUrl = `${environment.apiUrl}/applications`;

  beforeEach(() => {
    storageMock = { upload: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: StorageService, useValue: storageMock },
      ],
    });
    service = TestBed.inject(ApplicationService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('create hace POST a /applications con projectId y coverLetter (postulación)', () => {
    const dto = { projectId: 'project-1', coverLetter: 'Estoy interesado en este proyecto' };
    service.create(dto).subscribe((res) => {
      expect(res.data.id).toBe('app-1');
    });

    const req = httpTesting.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush({ data: { id: 'app-1', status: ApplicationStatus.PENDING } });
  });

  it('getContext hace GET a /applications/:id/context (usado por los guards de etapa)', () => {
    service.getContext('app-1').subscribe((ctx) => {
      expect(ctx.stage.current).toBe('application');
    });

    const req = httpTesting.expectOne(`${baseUrl}/app-1/context`);
    expect(req.request.method).toBe('GET');
    req.flush({ stage: { current: 'application', completed: [], waitingOn: null } });
  });

  it('changeStatus hace PATCH a /applications/:id/status con status y notes opcionales', () => {
    service.changeStatus('app-1', ApplicationStatus.SHORTLISTED, 'Buen perfil').subscribe();

    const req = httpTesting.expectOne(`${baseUrl}/app-1/status`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: ApplicationStatus.SHORTLISTED, notes: 'Buen perfil' });
    req.flush({ data: { id: 'app-1' } });
  });

  it('withdraw hace PATCH a /applications/:id/withdraw sin body', () => {
    service.withdraw('app-1').subscribe();

    const req = httpTesting.expectOne(`${baseUrl}/app-1/withdraw`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({});
    req.flush(null);
  });

  describe('submitAnteproyecto', () => {
    it('sube el archivo como academic_document y luego POSTea el fileId', () => {
      const file = new File(['contenido'], 'anteproyecto.pdf', { type: 'application/pdf' });
      storageMock.upload.mockReturnValue(of({ data: { fileId: 'file-1', url: 'https://x/file-1' } }));

      service.submitAnteproyecto('app-1', file).subscribe((sub) => {
        expect(sub.status).toBe('submitted');
      });

      expect(storageMock.upload).toHaveBeenCalledWith(file, 'academic_document');
      const req = httpTesting.expectOne(`${baseUrl}/app-1/anteproyecto`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ fileId: 'file-1' });
      req.flush({ id: 'sub-1', status: 'submitted' });
    });
  });

  describe('reviewAnteproyecto', () => {
    it('approve sin archivo — no llama a storage.upload, envía fileId undefined', () => {
      service.reviewAnteproyecto('app-1', 'approve').subscribe((sub) => {
        expect(sub.status).toBe('approved');
      });

      expect(storageMock.upload).not.toHaveBeenCalled();
      const req = httpTesting.expectOne(`${baseUrl}/app-1/anteproyecto/review`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ action: 'approve', comment: undefined, fileId: undefined });
      req.flush({ id: 'sub-1', status: 'approved' });
    });

    it('reject con comentario obligatorio', () => {
      service.reviewAnteproyecto('app-1', 'reject', 'No cumple los objetivos').subscribe((sub) => {
        expect(sub.status).toBe('rejected');
      });

      const req = httpTesting.expectOne(`${baseUrl}/app-1/anteproyecto/review`);
      expect(req.request.body).toEqual({ action: 'reject', comment: 'No cumple los objetivos', fileId: undefined });
      req.flush({ id: 'sub-1', status: 'rejected' });
    });

    it('correction con archivo de soporte — sube primero, luego PATCHea con el fileId resultante', () => {
      const file = new File(['contenido'], 'observaciones.pdf', { type: 'application/pdf' });
      storageMock.upload.mockReturnValue(of({ data: { fileId: 'file-2', url: 'https://x/file-2' } }));

      service.reviewAnteproyecto('app-1', 'correction', 'Corrige la metodología', file).subscribe((sub) => {
        expect(sub.status).toBe('needs_revision');
      });

      expect(storageMock.upload).toHaveBeenCalledWith(file, 'academic_document');
      const req = httpTesting.expectOne(`${baseUrl}/app-1/anteproyecto/review`);
      expect(req.request.body).toEqual({ action: 'correction', comment: 'Corrige la metodología', fileId: 'file-2' });
      req.flush({ id: 'sub-1', status: 'needs_revision' });
    });
  });
});
