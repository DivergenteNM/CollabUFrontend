import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { of } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

import { DeliverableCardComponent } from './deliverable-card.component';
import { Deliverable } from '../../../../core/models';
import { StorageService } from '../../../../core/services/storage.service';

const mockDeliverable: Deliverable = {
  id: 'del-uuid-1',
  applicationId: 'app-uuid-1',
  title: 'Informe de análisis de rendimiento',
  description: 'Diagnóstico de cuellos de botella',
  dueDate: '2026-08-25T00:00:00Z',
  submittedAt: '2026-08-23T15:00:00Z',
  fileUrl: '/api/v1/storage/files/3fa85f64-5717-4562-b3fc-2c963f66afa6/download',
  status: 'submitted',
  grade: 3,
};

describe('DeliverableCardComponent', () => {
  let fixture: ComponentFixture<DeliverableCardComponent>;
  let component: DeliverableCardComponent;
  let storageMock: any;
  let snackBarMock: { open: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    storageMock = {
      getFileInfo: vi.fn().mockReturnValue(of({
        id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        originalName: 'informe.pdf',
        fileSizeBytes: 102400,
        mimeType: 'application/pdf',
      })),
      getObjectUrl: vi.fn(),
      saveAs: vi.fn(),
      revokeObjectUrl: vi.fn(),
    };
    snackBarMock = {
      open: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [DeliverableCardComponent],
      providers: [
        provideAnimationsAsync(),
        { provide: StorageService, useValue: storageMock },
      ],
    })
      // `providedIn: 'root'` en MatSnackBar no se sobreescribe de forma fiable
      // vía `providers` en configureTestingModule bajo el unit-test builder de
      // Angular 21 + Vitest (el componente sigue resolviendo la instancia real) —
      // overrideProvider sí fuerza el reemplazo en el injector raíz de TestBed.
      .overrideProvider(MatSnackBar, { useValue: snackBarMock })
      .compileComponents();

    fixture = TestBed.createComponent(DeliverableCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('deliverable', mockDeliverable);
    fixture.componentRef.setInput('canReview', true);
    fixture.detectChanges();
  });

  it('renderiza el título y la descripción del entregable', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.dc__title')?.textContent?.trim()).toBe('Informe de análisis de rendimiento');
    expect(el.querySelector('.dc__desc')?.textContent?.trim()).toBe('Diagnóstico de cuellos de botella');
  });

  it('renderiza app-file-link cuando fileUrl está presente', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-file-link')).toBeTruthy();
  });

  it('abre el formulario de revisión al hacer clic en Revisar', () => {
    component.openReviewForm();
    fixture.detectChanges();

    expect(component.showReviewForm()).toBe(true);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.dc__review-form')).toBeTruthy();
  });

  it('emite el evento de aprobación sin obligatoriedad de comentario', () => {
    component.openReviewForm();
    fixture.detectChanges();

    const spy = vi.fn();
    component.reviewed.subscribe(spy);

    component.emitReview('approved');

    expect(spy).toHaveBeenCalledWith({
      deliverableId: 'del-uuid-1',
      action: 'approved',
      grade: 3,
      feedback: undefined,
    });
    expect(component.showReviewForm()).toBe(false);
  });

  it('bloquea el rechazo y activa rejectCommentError cuando la retroalimentación está vacía', () => {
    component.openReviewForm();
    component.reviewFeedback = '   ';
    fixture.detectChanges();

    const spy = vi.fn();
    component.reviewed.subscribe(spy);

    component.emitReview('rejected');

    expect(spy).not.toHaveBeenCalled();
    expect(component.rejectCommentError()).toBe(true);
    expect(snackBarMock.open).toHaveBeenCalledWith(
      expect.stringContaining('Debes ingresar un comentario'),
      'Cerrar',
      expect.any(Object),
    );
    expect(component.showReviewForm()).toBe(true);
  });

  it('emite el evento de rechazo cuando se ingresa un comentario', () => {
    component.openReviewForm();
    component.reviewFeedback = 'No cumple con las especificaciones técnicas requeridas';
    fixture.detectChanges();

    const spy = vi.fn();
    component.reviewed.subscribe(spy);

    component.emitReview('rejected');

    expect(spy).toHaveBeenCalledWith({
      deliverableId: 'del-uuid-1',
      action: 'rejected',
      grade: 3,
      feedback: 'No cumple con las especificaciones técnicas requeridas',
    });
    expect(component.rejectCommentError()).toBe(false);
    expect(component.showReviewForm()).toBe(false);
  });

  it('limpia el estado y cierra el formulario al cancelar', () => {
    component.openReviewForm();
    component.reviewFeedback = 'Texto temporal';
    component.rejectCommentError.set(true);

    component.cancelReview();

    expect(component.showReviewForm()).toBe(false);
    expect(component.rejectCommentError()).toBe(false);
    expect(component.reviewFeedback).toBe('');
  });

  it('muestra el badge de revisor y el autor en la retroalimentación cuando fue revisado por una Empresa', () => {
    fixture.componentRef.setInput('deliverable', {
      ...mockDeliverable,
      status: 'approved',
      feedback: 'Muy buen entregable',
      reviewerRole: 'company',
      reviewerName: 'TechCorp Latam',
      reviewedAt: '2026-08-23T18:00:00Z',
    });
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.dc__review-badge')?.textContent).toContain('Aprobado');
    expect(el.querySelector('.dc__review-badge')?.textContent).toContain('TechCorp Latam (Empresa)');
    expect(el.querySelector('.dc__feedback-author')?.textContent).toContain('TechCorp Latam (Empresa)');
    expect(el.querySelector('.dc__feedback-text')?.textContent?.trim()).toBe('Muy buen entregable');
  });

  it('muestra el badge de revisor cuando fue rechazado por un Asesor', () => {
    fixture.componentRef.setInput('deliverable', {
      ...mockDeliverable,
      status: 'rejected',
      feedback: 'Falta incluir los diagramas de arquitectura',
      reviewerRole: 'faculty',
      reviewerName: 'Dr. Roberto Mendoza',
      reviewedAt: '2026-08-23T19:30:00Z',
    });
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.dc__review-badge')?.textContent).toContain('Rechazado');
    expect(el.querySelector('.dc__review-badge')?.textContent).toContain('Dr. Roberto Mendoza (Asesor)');
    expect(el.querySelector('.dc__feedback-author')?.textContent).toContain('Dr. Roberto Mendoza (Asesor)');
    expect(el.querySelector('.dc__feedback-text')?.textContent?.trim()).toBe('Falta incluir los diagramas de arquitectura');
  });
});
