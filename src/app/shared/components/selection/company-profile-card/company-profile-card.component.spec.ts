import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CompanyProfileCardComponent } from './company-profile-card.component';
import { CompanyProfile } from '../../../../features/applications/services/application.service';

describe('CompanyProfileCardComponent', () => {
  let fixture: ComponentFixture<CompanyProfileCardComponent>;
  let component: CompanyProfileCardComponent;

  const mockCompany: CompanyProfile = {
    companyId: 'comp-123',
    companyName: 'Tech Innovations Corp',
    industry: 'Software',
    companySize: 'medium',
    description: 'Empresa líder en desarrollo de soluciones en la nube',
    website: 'https://example.com',
    logoUrl: 'https://example.com/logo.png',
    foundedYear: 2018,
    employeeCount: 120,
    verificationStatus: 'verified',
    rating: 4.8,
    totalReviews: 14,
    totalProjects: 5,
    headquartersCity: 'Medellín',
    locations: [{ city: 'Medellín', state: 'Antioquia', country: 'Colombia' }],
    businessAreas: ['Cloud Computing', 'AI'],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompanyProfileCardComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(CompanyProfileCardComponent);
    component = fixture.componentInstance;
  });

  it('debe crearse correctamente', () => {
    fixture.componentRef.setInput('company', mockCompany);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('debe calcular correctamente publicProfileId', () => {
    fixture.componentRef.setInput('company', mockCompany);
    fixture.detectChanges();
    expect(component.publicProfileId()).toBe('comp-123');
  });

  it('debe renderizar el botón de ver perfil público y reseñas', () => {
    fixture.componentRef.setInput('company', mockCompany);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const publicBtn = compiled.querySelector('.cpc__btn-public');
    expect(publicBtn).toBeTruthy();
    expect(publicBtn?.textContent).toContain('Ver perfil público y reseñas');
    expect(publicBtn?.getAttribute('href')).toContain('/profile/company/comp-123');
  });

  it('debe mostrar mensaje cuando no hay calificaciones', () => {
    const unratedCompany = { ...mockCompany, rating: 0, totalReviews: 0 };
    fixture.componentRef.setInput('company', unratedCompany);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.cpc__no-rating')?.textContent).toContain('Sin calificaciones aún');
  });
});
