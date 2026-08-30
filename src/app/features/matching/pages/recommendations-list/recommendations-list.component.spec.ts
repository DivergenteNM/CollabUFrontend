import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { RecommendationsListComponent } from './recommendations-list.component';
import { environment } from '../../../../../environments/environment';

/**
 * Regresión de UX (hallazgo H8, pruebas con usuarios finales — rol
 * Estudiante): la tarjeta de recomendación solo mostraba las habilidades
 * coincidentes, nunca las faltantes, aunque matching-service ya calcula y
 * persiste ambas listas en `skillsBreakdown`. El estudiante no tenía forma
 * de entender, sin abrir el detalle, por qué el puntaje no era más alto.
 * No se modifica el cálculo del backend — solo su presentación.
 */
describe('RecommendationsListComponent — desglose de afinidad', () => {
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    httpTesting = TestBed.inject(HttpTestingController);
  });

  it('muestra tanto las habilidades coincidentes como las faltantes en la tarjeta', async () => {
    const fixture = TestBed.createComponent(RecommendationsListComponent);
    fixture.detectChanges();

    const req = httpTesting.expectOne(
      (r) => r.url === `${environment.apiUrl}/matching/recommendations`,
    );
    req.flush({
      data: [{
        id: 'rec-1',
        projectTitle: 'Motor de Recomendación con IA',
        message: null,
        matchResult: {
          projectId: 'project-1',
          overallScore: 65,
          skillsScore: 60, proficiencyScore: 70, programScore: 100,
          semesterScore: 100, availabilityScore: 100, languageScore: 100,
          skillsBreakdown: {
            matched: [{ name: 'Python', catalogSkillId: 's1', requiredLevel: 'intermediate', studentLevel: 'intermediate' }],
            missing: [{ name: 'TensorFlow', catalogSkillId: 's2', requiredLevel: 'basic', studentLevel: null }],
            extra: [],
          },
        },
      }],
      total: 1,
    });
    await fixture.whenStable();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Python');
    expect(text).toContain('TensorFlow');
  });

  it('no muestra la fila de faltantes cuando no hay habilidades faltantes', async () => {
    const fixture = TestBed.createComponent(RecommendationsListComponent);
    fixture.detectChanges();

    const req = httpTesting.expectOne(
      (r) => r.url === `${environment.apiUrl}/matching/recommendations`,
    );
    req.flush({
      data: [{
        id: 'rec-1',
        projectTitle: 'Proyecto completo',
        message: null,
        matchResult: {
          projectId: 'project-1',
          overallScore: 100,
          skillsScore: 100, proficiencyScore: 100, programScore: 100,
          semesterScore: 100, availabilityScore: 100, languageScore: 100,
          skillsBreakdown: {
            matched: [{ name: 'Python', catalogSkillId: 's1', requiredLevel: 'intermediate', studentLevel: 'intermediate' }],
            missing: [],
            extra: [],
          },
        },
      }],
      total: 1,
    });
    await fixture.whenStable();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.recs__skills-icon--missing')).toBeNull();
  });
});
