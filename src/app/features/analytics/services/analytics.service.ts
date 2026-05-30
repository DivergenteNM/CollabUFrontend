import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../core/services/base-api.service';
import {
  AnalyticsDashboard,
  PlatformMetrics,
  ProjectMetrics,
  StudentMetrics,
  CompanyMetrics,
  SkillTrend,
  Report,
  GenerateReportPayload,
  MetricsQuery,
} from '../../../core/models';

@Injectable({ providedIn: 'root' })
export class AnalyticsService extends BaseApiService {
  protected readonly basePath = '/analytics';

  // ─── Dashboard ──────────────────────────────────────────────────────────────

  getDashboard(): Observable<AnalyticsDashboard> {
    return this.http.get<AnalyticsDashboard>(`${this.apiUrl}/dashboard`);
  }

  // ─── Plataforma ─────────────────────────────────────────────────────────────

  getPlatformMetrics(query: MetricsQuery = {}): Observable<PlatformMetrics[]> {
    return this.http.get<PlatformMetrics[]>(`${this.apiUrl}/platform`, {
      params: this.buildParams(query),
    });
  }

  // ─── Proyectos ──────────────────────────────────────────────────────────────

  getProjectMetrics(projectId: string, query: MetricsQuery = {}): Observable<ProjectMetrics[]> {
    return this.http.get<ProjectMetrics[]>(`${this.apiUrl}/projects/${projectId}`, {
      params: this.buildParams(query),
    });
  }

  getProjectSummary(projectId: string): Observable<ProjectMetrics> {
    return this.http.get<ProjectMetrics>(`${this.apiUrl}/projects/${projectId}/summary`);
  }

  // ─── Estudiantes ────────────────────────────────────────────────────────────

  getStudentMetrics(studentId: string, query: MetricsQuery = {}): Observable<StudentMetrics[]> {
    return this.http.get<StudentMetrics[]>(`${this.apiUrl}/students/${studentId}`, {
      params: this.buildParams(query),
    });
  }

  getStudentSummary(studentId: string): Observable<StudentMetrics> {
    return this.http.get<StudentMetrics>(`${this.apiUrl}/students/${studentId}/summary`);
  }

  // ─── Empresas ───────────────────────────────────────────────────────────────

  getCompanyMetrics(companyId: string, query: MetricsQuery = {}): Observable<CompanyMetrics[]> {
    return this.http.get<CompanyMetrics[]>(`${this.apiUrl}/companies/${companyId}`, {
      params: this.buildParams(query),
    });
  }

  getCompanySummary(companyId: string): Observable<CompanyMetrics> {
    return this.http.get<CompanyMetrics>(`${this.apiUrl}/companies/${companyId}/summary`);
  }

  // ─── Skills ─────────────────────────────────────────────────────────────────

  getSkillTrends(query: MetricsQuery = {}): Observable<SkillTrend[]> {
    return this.http.get<SkillTrend[]>(`${this.apiUrl}/skills/trends`, {
      params: this.buildParams(query),
    });
  }

  getTopSkills(): Observable<SkillTrend[]> {
    return this.http.get<SkillTrend[]>(`${this.apiUrl}/skills/top`);
  }

  // ─── Reportes ───────────────────────────────────────────────────────────────

  generateReport(payload: GenerateReportPayload): Observable<Report> {
    return this.http.post<Report>(`${this.apiUrl}/reports`, payload);
  }

  getReports(): Observable<Report[]> {
    return this.http.get<Report[]>(`${this.apiUrl}/reports`);
  }

  getReport(id: string): Observable<Report> {
    return this.http.get<Report>(`${this.apiUrl}/reports/${id}`);
  }
}
