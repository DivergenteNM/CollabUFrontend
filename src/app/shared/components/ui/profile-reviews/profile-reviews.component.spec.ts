import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ProfileReviewsComponent } from './profile-reviews.component';
import { Evaluation } from '../../../../core/models';

describe('ProfileReviewsComponent', () => {
  let fixture: ComponentFixture<ProfileReviewsComponent>;
  let component: ProfileReviewsComponent;

  const mockEvaluation: Evaluation = {
    id: 'eval-1',
    applicationId: 'app-1',
    projectId: 'proj-1',
    evaluatorId: 'user-1',
    evaluatedId: 'company-1',
    evaluationType: 'student_evaluates_company',
    status: 'completed',
    overallScore: 90,
    overallComment: 'Excelente ambiente de trabajo y tutoría constante.',
    strengths: 'Gran equipo y tecnología moderna',
    areasForImprovement: 'Mayor documentación técnica',
    isAnonymous: false,
    dueDate: null,
    completedAt: '2025-08-15T10:00:00Z',
    templateId: null,
    createdAt: '2025-08-10T10:00:00Z',
    updatedAt: '2025-08-15T10:00:00Z',
    ratings: [],
    evaluatorName: 'Carlos Mendoza',
    projectTitle: 'Plataforma IoT',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileReviewsComponent],
      providers: [provideAnimationsAsync()],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileReviewsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show empty state when no evaluations are provided', () => {
    const emptyEl = fixture.nativeElement.querySelector('.reviews-empty');
    expect(emptyEl).toBeTruthy();
    expect(emptyEl.textContent).toContain('Sin reseñas todavía');
  });

  it('should render rating overview and review item when evaluations exist', () => {
    fixture.componentRef.setInput('evaluations', [mockEvaluation]);
    fixture.componentRef.setInput('stats', {
      averageRating: 4.5,
      totalReviews: 1,
      distribution: { 5: 1, 4: 0, 3: 0, 2: 0, 1: 0 },
    });
    fixture.detectChanges();

    const overviewEl = fixture.nativeElement.querySelector('.rating-overview');
    expect(overviewEl).toBeTruthy();
    expect(overviewEl.textContent).toContain('4.5');

    const reviewItems = fixture.nativeElement.querySelectorAll('.review-item');
    expect(reviewItems.length).toBe(1);
    expect(reviewItems[0].textContent).toContain('Carlos Mendoza');
    expect(reviewItems[0].textContent).toContain('Plataforma IoT');
    expect(reviewItems[0].textContent).toContain('Excelente ambiente de trabajo');
  });

  it('should handle anonymous evaluation correctly', () => {
    const anonymousEval = { ...mockEvaluation, isAnonymous: true, evaluatorName: null };
    fixture.componentRef.setInput('evaluations', [anonymousEval]);
    fixture.detectChanges();

    const nameEl = fixture.nativeElement.querySelector('.review-item__name');
    expect(nameEl.textContent).toContain('Estudiante Collab-U');

    const anonChip = fixture.nativeElement.querySelector('.anon-chip');
    expect(anonChip).toBeTruthy();
  });

  it('should correctly calculate score stars from 0-100 scale', () => {
    expect(component.getScoreStars(90)).toBe(4.5);
    expect(component.getScoreStars(100)).toBe(5);
    expect(component.getScoreStars(80)).toBe(4);
    expect(component.getScoreStars(null)).toBe(5);
  });

  it('should compute star distribution percentages', () => {
    fixture.componentRef.setInput('stats', {
      averageRating: 4.0,
      totalReviews: 2,
      distribution: { 5: 1, 4: 1, 3: 0, 2: 0, 1: 0 },
    });
    fixture.detectChanges();

    const dist = component.starDistribution();
    expect(dist.find((d) => d.stars === 5)?.percentage).toBe(50);
    expect(dist.find((d) => d.stars === 4)?.percentage).toBe(50);
    expect(dist.find((d) => d.stars === 3)?.percentage).toBe(0);
  });
});
