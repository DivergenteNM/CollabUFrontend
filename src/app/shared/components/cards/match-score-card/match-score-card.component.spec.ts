import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatchScoreCardComponent } from './match-score-card.component';
import { MatResultBreakdown } from '../../../../core/models';

describe('MatchScoreCardComponent', () => {
  let fixture: ComponentFixture<MatchScoreCardComponent>;
  let component: MatchScoreCardComponent;

  const mockBreakdown: MatResultBreakdown = {
    skillsScore: 85,
    proficiencyScore: 90,
    programScore: 100,
    semesterScore: 80,
    availabilityScore: 95,
    languageScore: 70,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatchScoreCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MatchScoreCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('totalScore', 88);
    fixture.componentRef.setInput('breakdown', mockBreakdown);
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe incluir "Idioma extranjero" en los breakdownItems', () => {
    const items = component.breakdownItems();
    const languageItem = items.find((item) => item.label === 'Idioma extranjero');
    expect(languageItem).toBeDefined();
    expect(languageItem?.score).toBe(70);
  });

  it('debe renderizar la etiqueta "Idioma extranjero" en el DOM', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Idioma extranjero');
  });
});
