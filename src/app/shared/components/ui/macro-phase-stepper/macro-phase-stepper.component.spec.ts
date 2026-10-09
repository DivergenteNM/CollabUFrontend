import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { MacroPhaseStepperComponent } from './macro-phase-stepper.component';
import { ApplicationStatus } from '../../../../core/enums';

describe('MacroPhaseStepperComponent', () => {
  let component: MacroPhaseStepperComponent;
  let fixture: ComponentFixture<MacroPhaseStepperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MacroPhaseStepperComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MacroPhaseStepperComponent);
    component = fixture.componentInstance;
  });

  it('debe crearse correctamente', () => {
    fixture.componentRef.setInput('status', ApplicationStatus.PENDING);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('debe renderizar 3 macro-pills', () => {
    fixture.componentRef.setInput('status', ApplicationStatus.PENDING);
    fixture.detectChanges();

    const pills = fixture.nativeElement.querySelectorAll('.macro-pill');
    expect(pills.length).toBe(3);
    expect(pills[0].textContent).toContain('Selección');
    expect(pills[1].textContent).toContain('Académico');
    expect(pills[2].textContent).toContain('Workspace');
  });

  it('debe marcar la fase de Reclutamiento como activa para status PENDING', () => {
    fixture.componentRef.setInput('status', ApplicationStatus.PENDING);
    fixture.detectChanges();

    expect(component.resolution().currentPhase.id).toBe('RECRUITMENT');
    const pills = fixture.nativeElement.querySelectorAll('.macro-pill');
    expect(pills[0].classList).toContain('macro-pill--current');
  });

  it('debe marcar Reclutamiento como completada y Académico como activa para status ACCEPTED', () => {
    fixture.componentRef.setInput('status', ApplicationStatus.ACCEPTED);
    fixture.detectChanges();

    expect(component.resolution().currentPhase.id).toBe('ACADEMIC');
    const pills = fixture.nativeElement.querySelectorAll('.macro-pill');
    expect(pills[0].classList).toContain('macro-pill--completed');
    expect(pills[1].classList).toContain('macro-pill--current');
  });

  it('debe mostrar banner terminal y no mostrar micro-timeline para status REJECTED', () => {
    fixture.componentRef.setInput('status', ApplicationStatus.REJECTED);
    fixture.detectChanges();

    expect(component.isTerminal()).toBe(true);
    const terminalBox = fixture.nativeElement.querySelector('.macro-stepper__terminal-box');
    expect(terminalBox).toBeTruthy();
    expect(terminalBox.textContent).toContain('Postulación no seleccionada');

    const microTimeline = fixture.nativeElement.querySelector('.micro-timeline');
    expect(microTimeline).toBeNull();
  });

  it('debe permitir inspeccionar una fase pasada completada al hacer clic', () => {
    fixture.componentRef.setInput('status', ApplicationStatus.IN_PROGRESS); // Workspace activa
    fixture.detectChanges();

    const pills = fixture.nativeElement.querySelectorAll('.macro-pill');
    // Clic en la fase 1 (Selección)
    pills[0].click();
    fixture.detectChanges();

    expect(component.isViewingHistory()).toBe(true);
    expect(component.activePhase().id).toBe('RECRUITMENT');

    const historyBanner = fixture.nativeElement.querySelector('.macro-stepper__history-banner');
    expect(historyBanner).toBeTruthy();

    // Resetear
    component.resetToActive();
    fixture.detectChanges();
    expect(component.isViewingHistory()).toBe(false);
    expect(component.activePhase().id).toBe('WORKSPACE');
  });
});
