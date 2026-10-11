import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TermsPolicyDialogComponent, TermsPolicyDialogData } from './terms-policy-dialog.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

describe('TermsPolicyDialogComponent', () => {
  let fixture: ComponentFixture<TermsPolicyDialogComponent>;
  let component: TermsPolicyDialogComponent;
  let dialogRefSpy: { close: ReturnType<typeof vi.fn> };

  const mockData: TermsPolicyDialogData = {
    defaultTab: 1,
  };

  beforeEach(async () => {
    dialogRefSpy = { close: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [TermsPolicyDialogComponent],
      providers: [
        provideAnimationsAsync(),
        { provide: MAT_DIALOG_DATA, useValue: mockData },
        { provide: MatDialogRef, useValue: dialogRefSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TermsPolicyDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with defaultTab from data', () => {
    expect(component.selectedTab()).toBe(1);
  });

  it('should display title and dialog header info', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Términos, Condiciones y Privacidad');
    expect(el.textContent).toContain('Universidad de Nariño');
  });

  it('should display static privacy policy content when tab 1 is active', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Marco Legal');
    expect(el.textContent).toContain('Ley 1581 de 2012');
    expect(el.textContent).toContain('Finalidades');
    expect(el.textContent).toContain('Derechos del Titular');
  });

  it('should close dialog when clicking Entendido / Cerrar', () => {
    const confirmBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.terms-dialog__confirm-btn');
    confirmBtn.click();
    expect(dialogRefSpy.close).toHaveBeenCalled();
  });

  it('should close dialog when clicking close button header', () => {
    const closeBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.terms-dialog__close-btn');
    closeBtn.click();
    expect(dialogRefSpy.close).toHaveBeenCalled();
  });
});

describe('TermsPolicyDialogComponent default tab 0', () => {
  let fixture: ComponentFixture<TermsPolicyDialogComponent>;
  let component: TermsPolicyDialogComponent;
  let dialogRefSpy: { close: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    dialogRefSpy = { close: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [TermsPolicyDialogComponent],
      providers: [
        provideAnimationsAsync(),
        { provide: MAT_DIALOG_DATA, useValue: { defaultTab: 0 } },
        { provide: MatDialogRef, useValue: dialogRefSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TermsPolicyDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should default to tab 0 and display terms content', () => {
    expect(component.selectedTab()).toBe(0);
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Propósito Institucional');
    expect(el.textContent).toContain('Veracidad de la Información');
    expect(el.textContent).toContain('Uso de la Plataforma');
    expect(el.textContent).toContain('Alcance');
  });
});
