import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { MatchingService } from './matching.service';
import { environment } from '../../../../environments/environment';

describe('MatchingService', () => {
  let service: MatchingService;
  let httpTesting: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/matching`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MatchingService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('getRecommendations hace GET a /matching/recommendations con los params de paginación', () => {
    service.getRecommendations({ page: 1, limit: 10 }).subscribe((res) => {
      expect(res.data.length).toBe(1);
    });

    const req = httpTesting.expectOne(
      (r) => r.url === `${baseUrl}/recommendations` && r.params.get('page') === '1' && r.params.get('limit') === '10',
    );
    expect(req.request.method).toBe('GET');
    req.flush({ data: [{ id: 'rec-1' }], meta: { total: 1, page: 1, limit: 10 } });
  });

  it('getMatchDetail hace GET sin envoltorio {data} — matching-service no usa TransformInterceptor', () => {
    service.getMatchDetail('project-1').subscribe((res) => {
      expect(res?.skillsScore).toBe(90);
      expect((res as any).data).toBeUndefined();
    });

    const req = httpTesting.expectOne(`${baseUrl}/projects/project-1/my-match`);
    expect(req.request.method).toBe('GET');
    req.flush({ id: 'match-1', skillsScore: 90 });
  });

  it('getMatchDetail retorna null cuando el estudiante no tiene match calculado para ese proyecto', () => {
    service.getMatchDetail('project-2').subscribe((res) => {
      expect(res).toBeNull();
    });

    const req = httpTesting.expectOne(`${baseUrl}/projects/project-2/my-match`);
    req.flush(null);
  });

  it('getProjectMatches hace GET a /matching/projects/:id con params', () => {
    service.getProjectMatches('project-1', { page: 1, limit: 20 }).subscribe();

    const req = httpTesting.expectOne(
      (r) => r.url === `${baseUrl}/projects/project-1` && r.params.get('limit') === '20',
    );
    expect(req.request.method).toBe('GET');
    req.flush({ data: [], meta: { total: 0, page: 1, limit: 20 } });
  });

  it('getResultsForStudent retorna la forma plana {data,total} (sin meta) que expone matching-service', () => {
    service.getResultsForStudent('student-1', 50).subscribe((res) => {
      expect(res.total).toBe(2);
      expect(res.data.length).toBe(2);
    });

    const req = httpTesting.expectOne(
      (r) => r.url === `${baseUrl}/results/student/student-1` && r.params.get('limit') === '50',
    );
    expect(req.request.method).toBe('GET');
    req.flush({ data: [{ id: 'm1' }, { id: 'm2' }], total: 2 });
  });

  it('calculate hace POST con studentId y projectId', () => {
    service.calculate('student-1', 'project-1').subscribe((res) => {
      expect(res.id).toBe('match-1');
    });

    const req = httpTesting.expectOne(`${baseUrl}/calculate`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ studentId: 'student-1', projectId: 'project-1' });
    req.flush({ id: 'match-1' });
  });
});
