import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmDialogComponent, ConfirmDialogData } from './confirm-dialog.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

describe('ConfirmDialogComponent', () => {
  let fixture: ComponentFixture<ConfirmDialogComponent>;
  let component: ConfirmDialogComponent;
  let dialogRefSpy: { close: ReturnType<typeof vi.fn> };

  const mockData: ConfirmDialogData = {
    title: 'Confirmar eliminación',
    message: '¿Estás seguro de eliminar este elemento?',
    confirmText: 'Eliminar',
    cancelText: 'No',
    type: 'danger',
  };

  beforeEach(async () => {
    dialogRefSpy = { close: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
      providers: [
        provideAnimationsAsync(),
        { provide: MAT_DIALOG_DATA, useValue: mockData },
        { provide: MatDialogRef, useValue: dialogRefSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display title and message', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Confirmar eliminación');
    expect(el.textContent).toContain('¿Estás seguro de eliminar este elemento?');
  });

  it('should display custom button texts', () => {
    const el: HTMLElement = fixture.nativeElement;
    const buttons = el.querySelectorAll('button');
    const texts = Array.from(buttons).map(b => b.textContent?.trim());
    expect(texts).toContain('No');
    expect(texts).toContain('Eliminar');
  });

  it('should close with false on cancel click', () => {
    const cancelBtn = fixture.nativeElement.querySelector('button[mat-button]');
    cancelBtn.click();
    expect(dialogRefSpy.close).toHaveBeenCalledWith(false);
  });

  it('should close with true on confirm click', () => {
    const confirmBtn = fixture.nativeElement.querySelector('button[mat-flat-button]');
    confirmBtn.click();
    expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
  });

  it('should show danger icon', () => {
    const icon = fixture.nativeElement.querySelector('mat-icon');
    expect(icon?.textContent?.trim()).toBe('error');
  });
});
