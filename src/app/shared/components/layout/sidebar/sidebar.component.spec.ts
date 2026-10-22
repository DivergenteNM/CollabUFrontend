import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { SidebarComponent } from './sidebar.component';
import { AuthStore } from '../../../../state/auth.store';
import { StudentProjectStore } from '../../../../state/student-project.store';
import { UserRole, ApplicationStatus } from '../../../../core/enums';
import { AuthUser } from '../../../../core/models';

/**
 * Regresión de UX (hallazgo H1, pruebas con usuarios finales — rol
 * Administración/Facultad): el menú administrativo, al ser el más extenso,
 * se percibía como desordenado y con nombres que no describían la función
 * real de cada submódulo. Se agrupó por dominio y se alinearon las etiquetas
 * con el propósito real de cada vista.
 */
const mockAdmin: AuthUser = {
  id: 'admin-1',
  email: 'admin@udenar.edu.co',
  role: UserRole.ADMIN,
  isEmailVerified: true,
  isActive: true,
};

describe('SidebarComponent — menú administrativo', () => {
  let component: SidebarComponent;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: '**', component: class {} }]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    const authStore = TestBed.inject(AuthStore);
    authStore.setAuth(mockAdmin, 'token', 'refresh');

    const fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('agrupa el menú administrativo con encabezados de sección', () => {
    const sectionLabels = component.menuItems()
      .filter((item) => item.sectionLabel)
      .map((item) => item.sectionLabel);

    expect(sectionLabels).toEqual([
      'Verificación y configuración académica',
      'Seguimiento académico',
      'Administración institucional',
    ]);
  });

  it('renombra las etiquetas para que coincidan con la función real del módulo', () => {
    const labels = component.menuItems().map((item) => item.label);

    expect(labels).toContain('Dashboard');
    expect(labels).toContain('Cola de trabajo académico');
    expect(labels).toContain('Asesores y jurados');
    expect(labels).not.toContain('Panel Analítico');
    expect(labels).not.toContain('Proceso académico');
    expect(labels).not.toContain('Supervisores');
  });

  it('no elimina ninguna de las rutas administrativas existentes', () => {
    const routes = component.menuItems()
      .filter((item) => item.route)
      .map((item) => item.route);

    expect(routes).toEqual(expect.arrayContaining([
      '/admin/dashboard', '/admin/verifications', '/admin/skills',
      '/admin/document-requirements', '/admin/templates', '/admin/rejection-categories',
      '/admin/academic-process', '/admin/supervisors', '/admin/periods',
      '/admin/users', '/admin/reports',
    ]));
  });
});

describe('SidebarComponent — alcance del administrador', () => {
  function build(user: AuthUser): SidebarComponent {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: '**', component: class {} }]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    TestBed.inject(AuthStore).setAuth(user, 'token', 'refresh');
    const fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('el admin de departamento NO ve períodos, categorías de rechazo ni usuarios (globales de la Facultad)', () => {
    const component = build({ ...mockAdmin, adminLevel: 'department', departmentId: 'dept-sis' });
    const routes = component.menuItems().filter((i) => i.route).map((i) => i.route);

    expect(routes).not.toContain('/admin/periods');
    expect(routes).not.toContain('/admin/rejection-categories');
    expect(routes).not.toContain('/admin/users');
    // lo suyo sí
    expect(routes).toEqual(expect.arrayContaining(['/admin/skills', '/admin/templates', '/admin/supervisors', '/admin/verifications']));
  });

  it('no deja encabezados de sección vacíos', () => {
    const component = build({ ...mockAdmin, adminLevel: 'department', departmentId: 'dept-sis' });
    const items = component.menuItems();
    items.forEach((item, i) => {
      if (item.sectionLabel) {
        const next = items[i + 1];
        expect(next && !next.sectionLabel && !next.divider).toBe(true);
      }
    });
  });

  it('el superadmin (o admin sin nivel) conserva el menú completo', () => {
    const component = build({ ...mockAdmin, adminLevel: 'super' });
    const routes = component.menuItems().filter((i) => i.route).map((i) => i.route);

    expect(routes).toEqual(expect.arrayContaining(['/admin/periods', '/admin/rejection-categories', '/admin/users']));
  });
});

describe('SidebarComponent — menú de estudiante reactivo', () => {
  const mockStudent: AuthUser = {
    id: 'student-1',
    email: 'estudiante@udenar.edu.co',
    role: UserRole.STUDENT,
    isEmailVerified: true,
    isActive: true,
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: '**', component: class {} }]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
  });

  it('muestra Mis Aplicaciones y Recomendaciones si no tiene proyecto activo', () => {
    const authStore = TestBed.inject(AuthStore);
    authStore.setAuth(mockStudent, 'token', 'refresh');

    const fixture = TestBed.createComponent(SidebarComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const labels = component.menuItems().map((i) => i.label);
    expect(labels).toContain('Mis Aplicaciones');
    expect(labels).toContain('Recomendaciones');
    expect(labels).toContain('Tendencias de Skills');
    expect(labels).not.toContain('Mi Proyecto');
  });

  it('oculta Mis Aplicaciones, Recomendaciones y Tendencias de Skills cuando tiene proyecto activo', () => {
    const authStore = TestBed.inject(AuthStore);
    authStore.setAuth(mockStudent, 'token', 'refresh');

    const studentProjectStore = TestBed.inject(StudentProjectStore);
    studentProjectStore.setApplications([
      {
        id: 'app-active',
        studentId: 'student-1',
        projectId: 'proj-1',
        status: ApplicationStatus.IN_PROGRESS,
        createdAt: '2026-03-01',
        updatedAt: '2026-03-01',
      } as any,
    ]);

    const fixture = TestBed.createComponent(SidebarComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const labels = component.menuItems().map((i) => i.label);
    expect(labels).toContain('Mi Proyecto');
    expect(labels).not.toContain('Mis Aplicaciones');
    expect(labels).not.toContain('Recomendaciones');
    expect(labels).not.toContain('Tendencias de Skills');
  });
});

