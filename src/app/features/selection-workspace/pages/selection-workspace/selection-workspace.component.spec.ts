import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { SelectionWorkspaceComponent } from './selection-workspace.component';
import { ApplicationService } from '../../../applications/services/application.service';
import { StudentService } from '../../../students/services/student.service';
import { ChatService } from '../../../chat/services/chat.service';
import { FacultyService } from '../../../faculty/services/faculty.service';

/**
 * Regresión: `goBack()` y `goToSupervisorAssignment()` navegaban a
 * `/admin/supervisor-assignments`, una ruta que nunca existió (la ruta real
 * registrada en `admin.routes.ts` es `/admin/supervisors`) — esto producía la
 * pantalla de "página no encontrada" al volver desde este workspace como
 * administrador (hallazgo H2 de las pruebas con usuarios finales).
 */
function contextFor(
  contextRole: 'admin' | 'student' | 'company' | 'faculty',
  academicRecord: { status: string } | null = null,
) {
  return {
    application: { id: 'app-1', status: 'accepted' },
    project: null,
    companyProfile: null,
    academicRecord,
    participants: [],
    viewer: { userId: 'user-1', userRole: contextRole, contextRole, assignments: [], permissions: [] },
  };
}

describe('SelectionWorkspaceComponent — navegación', () => {
  let component: SelectionWorkspaceComponent;
  let fixture: ComponentFixture<SelectionWorkspaceComponent>;
  let router: Router;

  async function setup(
    contextRole: 'admin' | 'student' | 'company' | 'faculty',
    academicRecord: { status: string } | null = null,
  ) {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ApplicationService,
          useValue: {
            getContext: vi.fn().mockReturnValue(of(contextFor(contextRole, academicRecord))),
            getInterviews: vi.fn().mockReturnValue(of([])),
            getSelectionDocuments: vi.fn().mockReturnValue(of([])),
          },
        },
        { provide: StudentService, useValue: { getProfileById: vi.fn().mockReturnValue(of({ data: null })) } },
        { provide: ChatService, useValue: {} },
        { provide: FacultyService, useValue: {} },
      ],
    });
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(SelectionWorkspaceComponent);
    fixture.componentRef.setInput('applicationId', 'app-1');
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(component.viewer()?.contextRole).toBe(contextRole);
  }

  it('goBack() navega a /admin/supervisors para el rol admin (no a la ruta inexistente supervisor-assignments)', async () => {
    await setup('admin');
    component.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/admin/supervisors']);
  });

  it('goToSupervisorAssignment() navega a /admin/supervisors con el applicationId como query param', async () => {
    await setup('admin');
    component.goToSupervisorAssignment();
    expect(router.navigate).toHaveBeenCalledWith(['/admin/supervisors'], { queryParams: { applicationId: 'app-1' } });
  });

  it('goBack() navega a /my-applications para el rol estudiante', async () => {
    await setup('student');
    component.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/my-applications']);
  });

  /**
   * Mejora derivada de las pruebas con usuarios finales: el chat dejó de
   * mostrarse embebido en la columna lateral (ya tiene su propia vista,
   * igual que en el workspace de desarrollo) y ese espacio ahora muestra el
   * estado y la trazabilidad del proceso, antes solo visibles en un badge
   * pequeño del encabezado que los administrativos reportaron no percibir.
   */
  describe('columna lateral — estado y trazabilidad (reemplaza el chat embebido)', () => {
    it('ya no embebe el panel de chat en la columna lateral', async () => {
      await setup('student');
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('app-project-chat-panel')).toBeNull();
    });

    it('muestra el estado de la postulación en la tarjeta de la columna lateral', async () => {
      await setup('student');
      const el = fixture.nativeElement as HTMLElement;
      const sideCard = el.querySelector('.sw__side .sw__status-card');
      expect(sideCard).toBeTruthy();
      expect(sideCard?.querySelector('app-status-badge')).toBeTruthy();
    });

    it('muestra también el estado del proceso académico cuando existe registro académico', async () => {
      await setup('student', { status: 'waiting_anteproyecto' });
      const el = fixture.nativeElement as HTMLElement;
      const statusRows = el.querySelectorAll('.sw__side .sw__status-row');
      // Una fila para la postulación y otra para el proceso académico.
      expect(statusRows.length).toBe(2);
    });
  });
});
