import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { ApplyDialogComponent, ApplyDialogData } from './apply-dialog.component';
import { ApplicationService } from '../../../applications/services/application.service';
import { StorageService } from '../../../../core/services/storage.service';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideNativeDateAdapter } from '@angular/material/core';

describe('ApplyDialogComponent', () => {
  let fixture: ComponentFixture<ApplyDialogComponent>;
  let component: ApplyDialogComponent;

  const mockDialogData: ApplyDialogData = {
    projectId: 'proj-123',
    projectTitle: 'Desarrollo de IA para Logística',
    companyId: 'comp-456',
    companyName: 'Logistics AI SAS',
  };

  const mockDialogRef = {
    close: vi.fn(),
  };

  const mockApplicationService = {
    create: vi.fn().mockReturnValue(of({ data: { id: 'app-999' } })),
  };

  const mockStorageService = {
    upload: vi.fn().mockReturnValue(of({ data: { id: 'file-123' } })),
  };

  const mockSnackBar = {
    open: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplyDialogComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        provideNativeDateAdapter(),
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: ApplicationService, useValue: mockApplicationService },
        { provide: StorageService, useValue: mockStorageService },
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplyDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe mostrar el banner de empresa con enlace a vista pública y reseñas', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const banner = compiled.querySelector('.apply-dialog__company-banner');
    expect(banner).toBeTruthy();
    expect(banner?.textContent).toContain('Logistics AI SAS');

    const link = compiled.querySelector('.apply-dialog__company-link');
    expect(link).toBeTruthy();
    expect(link?.getAttribute('href')).toContain('/profile/company/comp-456');
  });

  it('formulario debe ser inválido si la carta de motivación tiene menos de 100 caracteres', () => {
    component.form.patchValue({ coverLetter: 'Demasiado corta' });
    expect(component.form.invalid).toBe(true);
  });
});
