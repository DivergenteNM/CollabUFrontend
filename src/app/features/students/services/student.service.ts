import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, switchMap } from 'rxjs';
import { BaseApiService } from '../../../core/services/base-api.service';
import { StorageService } from '../../../core/services/storage.service';
import { environment } from '../../../../environments/environment';
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
  private readonly storageService = inject(StorageService);

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
    return this.storageService.getUserFiles({ limit: 50 }).pipe(
      map((res) => {
        const files = Array.isArray(res?.data) ? res.data : [];
        const docs: StudentDocument[] = files
          .filter((f) => f.category !== 'avatar' && f.category !== 'company_logo')
          .map((f) => {
            let docType: StudentDocument['documentType'] = 'other';
            if (f.category === 'cv') {
              docType = 'resume';
            } else if (
              f.entityType === 'transcript' ||
              f.entityType === 'certificate' ||
              f.entityType === 'id_document' ||
              f.entityType === 'resume'
            ) {
              docType = f.entityType as StudentDocument['documentType'];
            } else if (f.category === 'academic_document') {
              docType = 'certificate';
            }

            let fileUrl = f.publicUrl ?? '';
            if (!fileUrl && f.id) {
              fileUrl = `${environment.apiUrl}/storage/files/${f.id}/download`;
            } else if (fileUrl && fileUrl.startsWith('/')) {
              fileUrl = `${environment.apiUrl.replace(/\/api\/v1\/?$/, '')}${fileUrl}`;
            }

            return {
              id: f.id,
              fileId: f.id,
              documentType: docType,
              originalName: f.originalName,
              fileUrl,
              uploadedAt: f.createdAt,
            };
          });
        return { data: docs } as unknown as ApiResponse<StudentDocument[]>;
      }),
      catchError(() => of({ data: [] } as unknown as ApiResponse<StudentDocument[]>)),
    );
  }

  uploadDocument(file: File, type: string): Observable<ApiResponse<StudentDocument>> {
    const category = type === 'resume' ? 'cv' : 'academic_document';
    return this.storageService.upload(file, category, true).pipe(
      switchMap((uploadRes) => {
        const fileId = uploadRes.data.fileId;
        const fileUrl = uploadRes.data.url;
        const doc: StudentDocument = {
          id: fileId,
          fileId,
          documentType: type as any,
          originalName: file.name,
          fileUrl,
          uploadedAt: new Date().toISOString(),
        };

        if (type === 'resume') {
          return this.updateProfile({ cvUrl: fileUrl }).pipe(
            map(() => ({ data: doc } as ApiResponse<StudentDocument>)),
            catchError(() => of({ data: doc } as ApiResponse<StudentDocument>)),
          );
        }

        return of({ data: doc } as ApiResponse<StudentDocument>);
      }),
    );
  }

  deleteDocument(docId: string, isCv = false): Observable<void> {
    return this.storageService.deleteFile(docId).pipe(
      switchMap(() => {
        if (isCv) {
          return this.updateProfile({ cvUrl: '' }).pipe(
            map(() => undefined),
            catchError(() => of(undefined)),
          );
        }
        return of(undefined);
      }),
    );
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
