import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatCardComponent } from './stat-card.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

describe('StatCardComponent', () => {
  let fixture: ComponentFixture<StatCardComponent>;
  let component: StatCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatCardComponent],
      providers: [provideAnimationsAsync()],
    }).compileComponents();

    fixture = TestBed.createComponent(StatCardComponent);
    component = fixture.componentInstance;
    // Set required inputs
    fixture.componentRef.setInput('icon', 'people');
    fixture.componentRef.setInput('value', '42');
    fixture.componentRef.setInput('label', 'Estudiantes');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render icon, value, and label', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.stat-card__icon mat-icon')?.textContent?.trim()).toBe('people');
    expect(el.querySelector('.stat-card__value')?.textContent?.trim()).toBe('42');
    expect(el.querySelector('.stat-card__label')?.textContent?.trim()).toBe('Estudiantes');
  });

  it('should default color to primary', () => {
    const iconEl = fixture.nativeElement.querySelector('.stat-card__icon');
    expect(iconEl.classList).toContain('stat-card__icon--primary');
  });

  it('should show trend when provided', () => {
    fixture.componentRef.setInput('trend', 15);
    fixture.detectChanges();
    const trendEl = fixture.nativeElement.querySelector('.stat-card__trend');
    expect(trendEl).toBeTruthy();
    expect(trendEl.classList).toContain('positive');
    expect(trendEl.textContent).toContain('+');
  });

  it('should show negative trend', () => {
    fixture.componentRef.setInput('trend', -5);
    fixture.detectChanges();
    const trendEl = fixture.nativeElement.querySelector('.stat-card__trend');
    expect(trendEl).toBeTruthy();
    expect(trendEl.classList).toContain('negative');
  });

  it('should not emit clicked if not clickable', () => {
    const spy = vi.fn();
    component.clicked.subscribe(spy);
    component.handleClick();
    expect(spy).not.toHaveBeenCalled();
  });

  it('should emit clicked when clickable', () => {
    fixture.componentRef.setInput('clickable', true);
    fixture.detectChanges();
    const spy = vi.fn();
    component.clicked.subscribe(spy);
    component.handleClick();
    expect(spy).toHaveBeenCalledOnce();
  });

  it('should have correct host attributes when clickable', () => {
    fixture.componentRef.setInput('clickable', true);
    fixture.detectChanges();
    const hostEl: HTMLElement = fixture.nativeElement;
    expect(hostEl.getAttribute('tabindex')).toBe('0');
    expect(hostEl.getAttribute('role')).toBe('button');
  });
});
