import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { StudentProjectStore } from './student-project.store';
import { Application } from '../core/models';
import { ApplicationStatus } from '../core/enums';

const mockPendingApp: Application = {
  id: 'app-pending-1',
  projectId: 'proj-1',
  studentId: 'student-1',
  status: ApplicationStatus.PENDING,
  appliedAt: new Date().toISOString(),
  projectTitle: 'Proyecto Pendiente',
  companyName: 'Empresa Alpha',
} as any;

const mockAcceptedApp: Application = {
  id: 'app-accepted-1',
  projectId: 'proj-2',
  studentId: 'student-1',
  status: ApplicationStatus.ACCEPTED,
  appliedAt: new Date().toISOString(),
  projectTitle: 'Proyecto Aceptado',
  companyName: 'Empresa Beta',
} as any;

const mockInProgressApp: Application = {
  id: 'app-prog-1',
  projectId: 'proj-3',
  studentId: 'student-1',
  status: ApplicationStatus.IN_PROGRESS,
  appliedAt: new Date().toISOString(),
  projectTitle: 'Proyecto en Desarrollo',
  companyName: 'Empresa Gamma',
} as any;

describe('StudentProjectStore', () => {
  let store: InstanceType<typeof StudentProjectStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    store = TestBed.inject(StudentProjectStore);
    store.clear();
  });

  it('debe iniciar sin proyecto activo por defecto', () => {
    expect(store.applications()).toEqual([]);
    expect(store.hasActiveProject()).toBe(false);
    expect(store.activeApplication()).toBeNull();
    expect(store.projectRoute()).toBe('/dashboard');
  });

  it('no debe activar hasActiveProject si las postulaciones están en pending o under_review', () => {
    store.setApplications([mockPendingApp]);

    expect(store.applications().length).toBe(1);
    expect(store.hasActiveProject()).toBe(false);
    expect(store.activeApplication()).toBeNull();
    expect(store.projectRoute()).toBe('/dashboard');
  });

  it('debe activar hasActiveProject y computar ruta y título cuando la postulación es ACCEPTED', () => {
    store.setApplications([mockPendingApp, mockAcceptedApp]);

    expect(store.hasActiveProject()).toBe(true);
    expect(store.activeApplication()?.id).toBe('app-accepted-1');
    expect(store.activeProjectTitle()).toBe('Proyecto Aceptado');
    expect(store.projectRoute()).toBe('/workspace/app-accepted-1');
    expect(store.phaseResolution()).not.toBeNull();
    expect(store.phaseResolution()?.currentPhase.id).toBe('ACADEMIC');
  });

  it('debe computar correctamente fase WORKSPACE cuando la postulación es IN_PROGRESS', () => {
    store.setApplications([mockInProgressApp]);

    expect(store.hasActiveProject()).toBe(true);
    expect(store.activeApplication()?.id).toBe('app-prog-1');
    expect(store.projectRoute()).toBe('/workspace/app-prog-1');
    expect(store.phaseResolution()?.currentPhase.id).toBe('WORKSPACE');
  });

  it('debe limpiar el estado al llamar a clear()', () => {
    store.setApplications([mockAcceptedApp]);
    expect(store.hasActiveProject()).toBe(true);

    store.clear();
    expect(store.hasActiveProject()).toBe(false);
    expect(store.applications()).toEqual([]);
  });
});
