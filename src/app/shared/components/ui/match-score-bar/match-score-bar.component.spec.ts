import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatchScoreBarComponent } from './match-score-bar.component';

describe('MatchScoreBarComponent', () => {
  let fixture: ComponentFixture<MatchScoreBarComponent>;
  let component: MatchScoreBarComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatchScoreBarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MatchScoreBarComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('score', 75);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should clamp score between 0 and 100', () => {
    fixture.componentRef.setInput('score', 150);
    fixture.detectChanges();
    expect(component.clampedScore()).toBe(100);

    fixture.componentRef.setInput('score', -20);
    fixture.detectChanges();
    expect(component.clampedScore()).toBe(0);
  });

  it('should set bar width to clamped percentage', () => {
    const fill: HTMLElement = fixture.nativeElement.querySelector('.match-score-bar__fill');
    expect(fill.style.width).toBe('75%');
  });

  it('should show percentage text by default', () => {
    const percent = fixture.nativeElement.querySelector('.match-score-bar__percent');
    expect(percent?.textContent?.trim()).toContain('75');
  });

  it('should hide percentage when showPercentage is false', () => {
    fixture.componentRef.setInput('showPercentage', false);
    fixture.detectChanges();
    const percent = fixture.nativeElement.querySelector('.match-score-bar__percent');
    expect(percent).toBeNull();
  });

  it('should return green for score >= 90', () => {
    fixture.componentRef.setInput('score', 95);
    fixture.detectChanges();
    expect(component.barColor()).toBe('#4caf50');
  });

  it('should return blue for score >= 70', () => {
    fixture.componentRef.setInput('score', 75);
    fixture.detectChanges();
    expect(component.barColor()).toBe('#2196f3');
  });

  it('should return orange for score >= 50', () => {
    fixture.componentRef.setInput('score', 55);
    fixture.detectChanges();
    expect(component.barColor()).toBe('#ff9800');
  });

  it('should return red for score < 50', () => {
    fixture.componentRef.setInput('score', 30);
    fixture.detectChanges();
    expect(component.barColor()).toBe('#f44336');
  });

  it('should display label when provided', () => {
    fixture.componentRef.setInput('label', 'Compatibilidad');
    fixture.detectChanges();
    const labelEl = fixture.nativeElement.querySelector('.match-score-bar__label');
    expect(labelEl?.textContent?.trim()).toBe('Compatibilidad');
  });

  it('should have correct aria attributes', () => {
    const hostEl: HTMLElement = fixture.nativeElement;
    expect(hostEl.getAttribute('role')).toBe('meter');
    expect(hostEl.getAttribute('aria-valuenow')).toBe('75');
    expect(hostEl.getAttribute('aria-valuemin')).toBe('0');
    expect(hostEl.getAttribute('aria-valuemax')).toBe('100');
  });
});
