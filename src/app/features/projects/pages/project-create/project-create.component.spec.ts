import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi, describe, beforeEach, it, expect } from 'vitest';

import { ProjectCreateComponent } from './project-create.component';
import { ProjectService } from '../../services/project.service';
import { AdminService } from '../../../admin/services/admin.service';
import { StorageService } from '../../../../core/services/storage.service';
import { ProjectType, CompensationType } from '../../../../core/enums';

import { provideNativeDateAdapter } from '@angular/material/core';

describe('ProjectCreateComponent', () => {
  let component: ProjectCreateComponent;
  let fixture: ComponentFixture<ProjectCreateComponent>;

  const mockProjectService = {
    create: vi.fn().mockReturnValue(of({ data: { id: 'test-proj-123' } })),
    addRequirement: vi.fn().mockReturnValue(of({ data: {} })),
    updateStatus: vi.fn().mockReturnValue(of({ data: {} })),
  };

  const mockAdminService = {
    getPrograms: vi.fn().mockReturnValue(of([
      { id: 'prog-1', name: 'Ingeniería de Sistemas', faculty: 'Ingeniería' },
      { id: 'prog-2', name: 'Diseño Visual', faculty: 'Artes' },
    ])),
    getSkillCatalog: vi.fn().mockReturnValue(of([
      { id: 'skill-1', name: 'angular', displayName: 'Angular', category: 'framework', isActive: true },
      { id: 'skill-2', name: 'python', displayName: 'Python', category: 'language', isActive: true },
    ])),
  };

  const mockStorageService = {
    upload: vi.fn().mockReturnValue(of({ data: { fileId: 'file-123' } })),
  };

  const storageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => { store[key] = value.toString(); },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { store = {}; },
    };
  })();

  beforeEach(async () => {
    if (typeof localStorage === 'undefined') {
      (globalThis as any).localStorage = storageMock;
    } else {
      localStorage.clear();
    }

    await TestBed.configureTestingModule({
      imports: [ProjectCreateComponent],
      providers: [
        provideAnimationsAsync(),
        provideRouter([]),
        provideNativeDateAdapter(),
        { provide: ProjectService, useValue: mockProjectService },
        { provide: AdminService, useValue: mockAdminService },
        { provide: StorageService, useValue: mockStorageService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component with initial form defaults', () => {
    expect(component).toBeTruthy();
    expect(component.basicInfoForm.get('projectType')?.value).toBe(ProjectType.PROFESSIONAL_PRACTICE);
    expect(component.basicInfoForm.get('locationType')?.value).toBe('remote');
    expect(component.basicInfoForm.get('positionsAvailable')?.value).toBe(1);
    expect(component.basicInfoForm.get('compensationType')?.value).toBe(CompensationType.UNPAID);
  });

  it('should validate title and description minimum lengths', () => {
    const titleControl = component.basicInfoForm.get('title');
    const descControl = component.basicInfoForm.get('description');

    titleControl?.setValue('Corto');
    expect(titleControl?.valid).toBeFalsy();
    expect(titleControl?.hasError('minlength')).toBeTruthy();

    titleControl?.setValue('Desarrollo de Plataforma Web Integral');
    expect(titleControl?.valid).toBeTruthy();

    descControl?.setValue('Descripción muy corta');
    expect(descControl?.valid).toBeFalsy();
    expect(descControl?.hasError('minlength')).toBeTruthy();

    descControl?.setValue('Esta es una descripción detallada que cuenta con más de cincuenta caracteres para cumplir con la validación.');
    expect(descControl?.valid).toBeTruthy();
  });

  it('should add and remove custom skills', () => {
    component.customSkillDraft = 'Docker & Kubernetes';
    component.addCustomSkill();

    expect(component.skills().length).toBe(1);
    expect(component.skills()[0].name).toBe('Docker & Kubernetes');
    expect(component.skills()[0].isMandatory).toBe(false);

    // Toggle mandatory
    component.toggleSkillMandatory('Docker & Kubernetes', true);
    expect(component.skills()[0].isMandatory).toBe(true);

    // Remove skill
    component.removeSkill('Docker & Kubernetes');
    expect(component.skills().length).toBe(0);
  });

  it('should toggle catalog skills', () => {
    const entry = { id: 'skill-1', name: 'angular', displayName: 'Angular', category: 'framework' as const, isActive: true };
    component.toggleCatalogSkill(entry);

    expect(component.skills().length).toBe(1);
    expect(component.skills()[0].name).toBe('Angular');
    expect(component.isSkillSelected('Angular')).toBe(true);

    // Toggle off
    component.toggleCatalogSkill(entry);
    expect(component.skills().length).toBe(0);
    expect(component.isSkillSelected('Angular')).toBe(false);
  });

  it('should compute duration summary when dates are selected', () => {
    component.scheduleForm.patchValue({
      startDate: '2026-03-01',
      endDate: '2026-06-30',
      weeklyHours: 20,
    });

    const summary = component.durationSummary();
    expect(summary).not.toBeNull();
    expect(summary?.months).toBeGreaterThanOrEqual(3);
    expect(summary?.suggestedTotalHours).toBeGreaterThan(0);
  });

  it('should save and reload draft from localStorage', () => {
    component.basicInfoForm.patchValue({ title: 'Proyecto de Prueba en Borrador' });
    component.saveToLocalStorage();

    expect(localStorage.getItem('collabu_project_draft')).toBeTruthy();
    expect(component.lastSavedTime()).toBeTruthy();
    expect(component.hasDraftInStorage()).toBe(true);
  });
});
