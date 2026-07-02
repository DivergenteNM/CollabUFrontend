import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StarRatingComponent } from './star-rating.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

describe('StarRatingComponent', () => {
  let fixture: ComponentFixture<StarRatingComponent>;
  let component: StarRatingComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StarRatingComponent],
      providers: [provideAnimationsAsync()],
    }).compileComponents();

    fixture = TestBed.createComponent(StarRatingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default to 5 stars', () => {
    expect(component.maxStars()).toBe(5);
    expect(component.starsArray().length).toBe(5);
  });

  it('should default value to 0', () => {
    expect(component.value()).toBe(0);
  });

  it('should render 5 star icons', () => {
    const stars = fixture.nativeElement.querySelectorAll('.star-rating__star');
    expect(stars.length).toBe(5);
  });

  it('should update value on select', () => {
    component.onSelect(3);
    expect(component.value()).toBe(3);
  });

  it('should not update value when readonly', () => {
    fixture.componentRef.setInput('readonly', true);
    fixture.detectChanges();
    component.onSelect(3);
    expect(component.value()).toBe(0);
  });

  it('should increment on increment()', () => {
    component.onSelect(2);
    component.increment();
    expect(component.value()).toBe(3);
  });

  it('should not increment past maxStars', () => {
    component.onSelect(5);
    component.increment();
    expect(component.value()).toBe(5);
  });

  it('should decrement on decrement()', () => {
    component.onSelect(3);
    component.decrement();
    expect(component.value()).toBe(2);
  });

  it('should not decrement below 0', () => {
    component.decrement();
    expect(component.value()).toBe(0);
  });

  it('should show hover value when not readonly', () => {
    component.onHover(4);
    expect(component.displayValue()).toBe(4);
  });

  it('should clear hover value on leave', () => {
    component.onHover(4);
    component.onLeave();
    expect(component.displayValue()).toBe(0);
  });

  it('should have correct aria attributes', () => {
    const hostEl: HTMLElement = fixture.nativeElement;
    expect(hostEl.getAttribute('role')).toBe('slider');
    expect(hostEl.getAttribute('aria-valuemin')).toBe('0');
    expect(hostEl.getAttribute('aria-valuemax')).toBe('5');
  });
});
