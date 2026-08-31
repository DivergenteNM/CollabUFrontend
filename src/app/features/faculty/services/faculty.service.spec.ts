import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { FacultyService } from './faculty.service';
import { environment } from '../../../../environments/environment';

describe('FacultyService', () => {
  let service: FacultyService;
  let httpTesting: HttpTestingController;
  const adminUrl = `${environment.apiUrl}/admin`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(FacultyService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('getMyStudents hace GET a /admin/supervisors/my-students con filtros opcionales', () => {
    service.getMyStudents({ status: 'active', page: 2, limit: 10 }).subscribe();

    const req = httpTesting.expectOne(
      (r) =>
        r.url === `${adminUrl}/supervisors/my-students`
        && r.params.get('status') === 'active'
        && r.params.get('page') === '2'
        && r.params.get('limit') === '10',
    );
    expect(req.request.method).toBe('GET');
    req.flush({ data: [], total: 0, page: 2, limit: 10, totalPages: 0 });
  });

  it('getMyStudentsEnriched siempre agrega enriched=true', () => {
    service.getMyStudentsEnriched().subscribe();

    const req = httpTesting.expectOne(
      (r) => r.url === `${adminUrl}/supervisors/my-students` && r.params.get('enriched') === 'true',
    );
    req.flush({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 });
  });

  it('acceptAssignment hace PATCH al endpoint /accept sin body', () => {
    service.acceptAssignment('asgn-1').subscribe((res) => {
      expect(res.status).toBe('accepted');
    });

    const req = httpTesting.expectOne(`${adminUrl}/supervisors/assignments/asgn-1/accept`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({});
    req.flush({ id: 'asgn-1', status: 'accepted' });
  });

  it('declineAssignment envía el motivo de rechazo en el body', () => {
    service.declineAssignment('asgn-1', 'No tengo disponibilidad').subscribe();

    const req = httpTesting.expectOne(`${adminUrl}/supervisors/assignments/asgn-1/decline`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ reason: 'No tengo disponibilidad' });
    req.flush({ id: 'asgn-1', status: 'declined' });
  });

  it.each([
    ['approved', 'approve'],
    ['rejected', 'reject'],
    ['needs_revision', 'request-revision'],
  ] as const)('reviewDeliverable traduce status "%s" al endpoint /%s', (status, expectedAction) => {
    service.reviewDeliverable('app-1', 'del-1', status, { grade: 4, feedback: 'Buen trabajo' }).subscribe();

    const req = httpTesting.expectOne(
      `${environment.apiUrl}/applications/app-1/deliverables/del-1/${expectedAction}`,
    );
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ grade: 4, feedback: 'Buen trabajo' });
    req.flush({ data: { id: 'del-1', status } });
  });

  it('getDeliverables hace GET a applications/:id/deliverables', () => {
    service.getDeliverables('app-1').subscribe();

    const req = httpTesting.expectOne(`${environment.apiUrl}/applications/app-1/deliverables`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getEvaluationsByApplication hace GET a evaluations/application/:id', () => {
    service.getEvaluationsByApplication('app-1').subscribe();

    const req = httpTesting.expectOne(`${environment.apiUrl}/evaluations/application/app-1`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getMyProfile hace GET a /admin/supervisors/me', () => {
    service.getMyProfile().subscribe();

    const req = httpTesting.expectOne(`${adminUrl}/supervisors/me`);
    expect(req.request.method).toBe('GET');
    req.flush({ id: 'sup-1' });
  });

  it('updateMyProfile hace PATCH a /admin/supervisors/me con los datos', () => {
    service.updateMyProfile({ department: 'Sistemas' }).subscribe();

    const req = httpTesting.expectOne(`${adminUrl}/supervisors/me`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ department: 'Sistemas' });
    req.flush({ id: 'sup-1', department: 'Sistemas' });
  });
});
