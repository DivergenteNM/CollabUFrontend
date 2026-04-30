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

  addSkill(data: Partial<StudentSkill>): Observable<ApiResponse<StudentSkill>> {
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

  private mapSkillCategory(rawCategory?: string): 'technical' | 'soft' | 'language' | 'tool' {
    const value = (rawCategory ?? '').toLowerCase();

    if (value.includes('soft') || value.includes('blanda')) return 'soft';
    if (value.includes('language') || value.includes('idioma')) return 'language';
    if (value.includes('tool') || value.includes('herramienta')) return 'tool';
    return 'technical';
  }

  private mapSkillLevel(rawLevel?: string): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
    const value = (rawLevel ?? '').toLowerCase();

    if (value === 'basic' || value === 'basico' || value === 'básico') return 'beginner';
    if (value === 'intermediate' || value === 'intermedio') return 'intermediate';
    if (value === 'advanced' || value === 'avanzado') return 'advanced';
    return 'expert';
  }
}
