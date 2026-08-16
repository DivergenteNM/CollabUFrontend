import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BaseApiService } from '../../../core/services/base-api.service';
import {
  ApiResponse,
  normalizeApiResponse,
  StudentProfile,
  StudentSkill,
  StudentDocument,
  StudentEducation,
  StudentExperience,
} from '../../../core/models';

@Injectable({ providedIn: 'root' })
export class StudentService extends BaseApiService {
  protected readonly basePath = '/students';

  createProfile(data: Partial<StudentProfile>): Observable<ApiResponse<StudentProfile>> {
    return this.http
      .post<ApiResponse<StudentProfile> | StudentProfile>(`${this.apiUrl}/profile`, data)
      .pipe(map((res) => normalizeApiResponse<StudentProfile>(res, 'Perfil creado')));
  }

  getProfile(): Observable<ApiResponse<StudentProfile>> {
    return this.http
      .get<ApiResponse<StudentProfile> | StudentProfile>(`${this.apiUrl}/profile`)
      .pipe(map((res) => normalizeApiResponse<StudentProfile>(res, 'Perfil obtenido')));
  }

  getProfileById(userId: string): Observable<ApiResponse<StudentProfile>> {
    return this.http
      .get<ApiResponse<StudentProfile> | StudentProfile>(`${this.apiUrl}/profile/${userId}`)
      .pipe(map((res) => normalizeApiResponse<StudentProfile>(res, 'Perfil obtenido')));
  }

  updateProfile(data: Partial<StudentProfile>): Observable<ApiResponse<StudentProfile>> {
    return this.http
      .patch<ApiResponse<StudentProfile> | StudentProfile>(`${this.apiUrl}/profile`, data)
      .pipe(map((res) => normalizeApiResponse<StudentProfile>(res, 'Perfil actualizado')));
  }

  getSkills(): Observable<ApiResponse<StudentSkill[]>> {
    return this.http
      .get<ApiResponse<StudentSkill[]> | StudentSkill[]>(`${this.apiUrl}/skills`)
      .pipe(map((res) => normalizeApiResponse<StudentSkill[]>(res, 'Habilidades obtenidas')));
  }

  addSkill(data: Partial<StudentSkill> & { catalogSkillId?: string }): Observable<ApiResponse<StudentSkill>> {
    const payload = {
      ...data,
      category: this.mapSkillCategory(data.category),
      proficiencyLevel: this.mapSkillLevel(data.proficiencyLevel),
    };

    return this.http
      .post<ApiResponse<StudentSkill> | StudentSkill>(`${this.apiUrl}/skills`, payload)
      .pipe(map((res) => normalizeApiResponse<StudentSkill>(res, 'Habilidad agregada')));
  }

  removeSkill(skillId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/skills/${skillId}`);
  }

  getExperiences(): Observable<ApiResponse<StudentExperience[]>> {
    return this.http
      .get<ApiResponse<StudentExperience[]> | StudentExperience[]>(`${this.apiUrl}/experiences`)
      .pipe(map((res) => normalizeApiResponse<StudentExperience[]>(res, 'Experiencias obtenidas')));
  }

  addExperience(data: Partial<StudentExperience>): Observable<ApiResponse<StudentExperience>> {
    return this.http
      .post<ApiResponse<StudentExperience> | StudentExperience>(`${this.apiUrl}/experiences`, data)
      .pipe(map((res) => normalizeApiResponse<StudentExperience>(res, 'Experiencia agregada')));
  }

  removeExperience(expId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/experiences/${expId}`);
  }

  getEducation(): Observable<ApiResponse<StudentEducation[]>> {
    return this.http
      .get<ApiResponse<StudentEducation[]> | StudentEducation[]>(`${this.apiUrl}/education`)
      .pipe(map((res) => normalizeApiResponse<StudentEducation[]>(res, 'Educación obtenida')));
  }

  addEducation(data: Partial<StudentEducation>): Observable<ApiResponse<StudentEducation>> {
    return this.http
      .post<ApiResponse<StudentEducation> | StudentEducation>(`${this.apiUrl}/education`, data)
      .pipe(map((res) => normalizeApiResponse<StudentEducation>(res, 'Formación agregada')));
  }

  removeEducation(eduId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/education/${eduId}`);
  }

  getLanguages(): Observable<ApiResponse<any[]>> {
    return this.http
      .get<ApiResponse<any[]> | any[]>(`${this.apiUrl}/languages`)
      .pipe(map((res) => normalizeApiResponse<any[]>(res, 'Idiomas obtenidos')));
  }

  addLanguage(data: any): Observable<ApiResponse<any>> {
    return this.http
      .post<ApiResponse<any> | any>(`${this.apiUrl}/languages`, data)
      .pipe(map((res) => normalizeApiResponse<any>(res, 'Idioma agregado')));
  }

  removeLanguage(langId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/languages/${langId}`);
  }

  getInterests(): Observable<ApiResponse<any[]>> {
    return this.http
      .get<ApiResponse<any[]> | any[]>(`${this.apiUrl}/interests`)
      .pipe(map((res) => normalizeApiResponse<any[]>(res, 'Intereses obtenidos')));
  }

  addInterest(data: any): Observable<ApiResponse<any>> {
    return this.http
      .post<ApiResponse<any> | any>(`${this.apiUrl}/interests`, data)
      .pipe(map((res) => normalizeApiResponse<any>(res, 'Interés agregado')));
  }

  removeInterest(intId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/interests/${intId}`);
  }

  getCertifications(): Observable<ApiResponse<any[]>> {
    return this.http
      .get<ApiResponse<any[]> | any[]>(`${this.apiUrl}/certifications`)
      .pipe(map((res) => normalizeApiResponse<any[]>(res, 'Certificaciones obtenidas')));
  }

  addCertification(data: any): Observable<ApiResponse<any>> {
    return this.http
      .post<ApiResponse<any> | any>(`${this.apiUrl}/certifications`, data)
      .pipe(map((res) => normalizeApiResponse<any>(res, 'Certificación agregada')));
  }

  removeCertification(certId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/certifications/${certId}`);
  }

  getDocuments(): Observable<ApiResponse<StudentDocument[]>> {
    return this.http
      .get<ApiResponse<StudentDocument[]> | StudentDocument[]>(`${this.apiUrl}/documents`)
      .pipe(map((res) => normalizeApiResponse<StudentDocument[]>(res, 'Documentos obtenidos')));
  }

  uploadDocument(file: File, type: string): Observable<ApiResponse<StudentDocument>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', type);

    return this.http
      .post<ApiResponse<StudentDocument> | StudentDocument>(`${this.apiUrl}/documents`, formData)
      .pipe(map((res) => normalizeApiResponse<StudentDocument>(res, 'Documento subido')));
  }

  private mapSkillCategory(rawCategory?: string): 'language' | 'framework' | 'tool' | 'concept' | 'soft_skill' {
    const value = (rawCategory ?? '').toLowerCase();

    if (value.includes('soft') || value.includes('blanda')) return 'soft_skill';
    if (value.includes('framework')) return 'framework';
    if (value.includes('tool') || value.includes('herramienta')) return 'tool';
    if (value.includes('language') || value.includes('lenguaje') || value.includes('idioma')) return 'language';
    if (value.includes('concept') || value.includes('concepto')) return 'concept';
    return 'concept';
  }

  private mapSkillLevel(rawLevel?: string): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
    const value = (rawLevel ?? '').toLowerCase();

    if (value === 'basic' || value === 'basico' || value === 'básico' || value === 'beginner' || value === 'principiante') return 'beginner';
    if (value === 'intermediate' || value === 'intermedio') return 'intermediate';
    if (value === 'advanced' || value === 'avanzado') return 'advanced';
    if (value === 'expert' || value === 'experto') return 'expert';
    return 'beginner';
  }
}
