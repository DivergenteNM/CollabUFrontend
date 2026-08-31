import { inject, Injectable } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { BaseApiService } from '../../../core/services/base-api.service';
import { ApplicationStatus } from '../../../core/enums';
import { StudentService } from '../../students/services/student.service';
import { UserProfileService } from '../../../core/services/user-profile.service';
import { ProjectService } from '../../projects/services/project.service';
import { StorageService } from '../../../core/services/storage.service';
import {
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  Application,
  Interview,
  Deliverable,
} from '../../../core/models';

@Injectable({ providedIn: 'root' })
export class ApplicationService extends BaseApiService {
  protected readonly basePath = '/applications';
  private readonly studentService = inject(StudentService);
  private readonly userService = inject(UserProfileService);
  private readonly projectService = inject(ProjectService);
  private readonly storageService = inject(StorageService);

  create(data: { projectId: string; coverLetter: string; resumeUrl?: string }): Observable<ApiResponse<Application>> {
    return this.http.post<ApiResponse<Application>>(this.apiUrl, data);
  }

  getMyApplications(params: PaginationParams): Observable<PaginatedResponse<Application>> {
    return this.http.get<PaginatedResponse<Application>>(`${this.apiUrl}/my`, {
      params: this.buildParams(params)
    });
  }

  getReceivedApplications(params: PaginationParams & { projectId?: string }): Observable<PaginatedResponse<Application>> {
    return this.http.get<PaginatedResponse<Application>>(`${this.apiUrl}/received`, {
      params: this.buildParams(params)
    });
  }

  getById(id: string): Observable<Application> {
    return this.http.get<Application>(`${this.apiUrl}/${id}`);
  }

  /**
   * Contexto completo del proyecto en una sola petición: participantes, etapa,
   * acciones pendientes y — sobre todo — los permisos del usuario en ESTE
   * proyecto. La interfaz debe decidir qué mostrar a partir de
   * `viewer.permissions`, no del rol global: un `faculty` puede ser asesor de un
   * proyecto y jurado de otro, con capacidades distintas en cada uno.
   */
  getContext(id: string): Observable<ProjectContext> {
    return this.http.get<ProjectContext>(`${this.apiUrl}/${id}/context`);
  }

  enrichApplication(app: Application): Observable<Application> {
    return forkJoin({
      studentData: this.studentService.getProfileById(app.studentId).pipe(catchError(() => of(null))),
      userData: this.userService.getProfileById(app.studentId).pipe(catchError(() => of(null))),
      projectData: this.projectService.getById(app.projectId).pipe(catchError(() => of(null)))
    }).pipe(
      map(({ studentData, userData, projectData }) => {
        const enriched = { ...app };
        if (studentData?.data) {
          enriched.student = studentData.data;
          if (userData?.data) {
            // @ts-ignore
            enriched.student.user = userData.data;
          }
        }
        const proj = (projectData as any)?.data || projectData;
        if (proj) {
          enriched.project = proj;
        }
        return enriched;
      })
    );
  }

  changeStatus(id: string, status: ApplicationStatus, notes?: string): Observable<ApiResponse<Application>> {
    return this.http.patch<ApiResponse<Application>>(`${this.apiUrl}/${id}/status`, { status, notes });
  }

  withdraw(id: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/withdraw`, {});
  }

  submitDeliverable(
    applicationId: string,
    data: {
      file: File;
      title: string;
      description?: string;
      /**
       * ID del entregable en el backend. Si viene informado, la subida se
       * hace vía PATCH `/deliverables/:id` (actualiza el student_deliverable
       * asignado con el nuevo archivo). Si NO viene, se crea uno nuevo con
       * POST. La UI de workspace SIEMPRE pasa el id porque el card muestra
       * entregables ya asignados por la empresa/asesor.
       */
      projectDeliverableId?: string;
    }
  ): Observable<ApiResponse<Deliverable>> {
    return this.storageService.upload(data.file, 'deliverable').pipe(
      switchMap((response) => {
        const body: Record<string, any> = {
          title: data.title,
          description: data.description,
          fileUrl: response.data?.url,
          fileId: response.data?.fileId,
        };

        if (data.projectDeliverableId) {
          return this.http.patch<ApiResponse<Deliverable>>(
            `${this.apiUrl}/${applicationId}/deliverables/${data.projectDeliverableId}`,
            body,
          );
        }
        return this.http.post<ApiResponse<Deliverable>>(
          `${this.apiUrl}/${applicationId}/deliverables`,
          body,
        );
      }),
    );
  }

  reviewDeliverable(
    applicationId: string,
    deliverableId: string,
    status: 'approved' | 'rejected' | 'needs_revision',
    data: { grade?: number; feedback?: string }
  ): Observable<ApiResponse<Deliverable>> {
    const action = status === 'approved' ? 'approve' : status === 'rejected' ? 'reject' : 'request-revision';
    return this.http.patch<ApiResponse<Deliverable>>(
      `${this.apiUrl}/${applicationId}/deliverables/${deliverableId}/${action}`,
      data
    );
  }

  scheduleInterview(applicationId: string, data: Partial<Interview>): Observable<ApiResponse<Interview>> {
    return this.http.post<ApiResponse<Interview>>(
      `${this.apiUrl}/${applicationId}/interviews`, data
    );
  }

  completeInterview(
    applicationId: string,
    interviewId: string,
    data: { score?: number; interviewerNotes?: string; resolution: 'passed' | 'failed'; resolutionComment?: string },
  ): Observable<ApiResponse<Interview>> {
    return this.http.patch<ApiResponse<Interview>>(
      `${this.apiUrl}/${applicationId}/interviews/${interviewId}/complete`, data
    );
  }

  setInterviewBrief(
    applicationId: string,
    interviewId: string,
    data: { file?: File; description?: string; dueDate?: string },
  ): Observable<ApiResponse<Interview>> {
    const upload$: Observable<ApiResponse<{ fileId: string; url: string }> | null> = data.file
      ? this.storageService.upload(data.file, 'interview_attachment')
      : of(null);

    return upload$.pipe(
      switchMap((uploadRes) => {
        const body: Record<string, unknown> = {
          description: data.description,
          dueDate: data.dueDate,
        };
        if (uploadRes?.data?.fileId) body['fileId'] = uploadRes.data.fileId;
        return this.http.patch<ApiResponse<Interview>>(
          `${this.apiUrl}/${applicationId}/interviews/${interviewId}/brief`, body
        );
      }),
    );
  }

  getInterviews(applicationId: string): Observable<Interview[]> {
    return this.http.get<Interview[]>(`${this.apiUrl}/${applicationId}/interviews`);
  }

  cancelInterview(applicationId: string, interviewId: string, reason?: string): Observable<ApiResponse<Interview>> {
    return this.http.patch<ApiResponse<Interview>>(
      `${this.apiUrl}/${applicationId}/interviews/${interviewId}/cancel`, { reason },
    );
  }

  rescheduleInterview(
    applicationId: string, interviewId: string, data: { scheduledAt: string; reason?: string },
  ): Observable<ApiResponse<Interview>> {
    return this.http.post<ApiResponse<Interview>>(
      `${this.apiUrl}/${applicationId}/interviews/${interviewId}/reschedule`, data,
    );
  }

  setInterviewFeedback(applicationId: string, interviewId: string, studentFeedback: string): Observable<Interview> {
    return this.http.patch<Interview>(
      `${this.apiUrl}/${applicationId}/interviews/${interviewId}/student-feedback`, { studentFeedback },
    );
  }

  setInterviewSolution(applicationId: string, interviewId: string, file: File): Observable<ApiResponse<Interview>> {
    return this.storageService.upload(file, 'interview_attachment').pipe(
      switchMap((uploadRes) => {
        return this.http.patch<ApiResponse<Interview>>(
          `${this.apiUrl}/${applicationId}/interviews/${interviewId}/solution`,
          { fileId: uploadRes.data?.fileId },
        );
      }),
    );
  }

  updateNotes(applicationId: string, notes: string): Observable<ApiResponse<Application>> {
    return this.http.patch<ApiResponse<Application>>(`${this.apiUrl}/${applicationId}/notes`, { notes });
  }

  createDeliverable(applicationId: string, data: {
    title: string;
    description?: string;
    type?: string;
    dueDate?: string;
    projectDeliverableId?: string;
  }): Observable<ApiResponse<Deliverable>> {
    return this.http.post<ApiResponse<Deliverable>>(
      `${this.apiUrl}/${applicationId}/deliverables/create`,
      data
    );
  }

  bulkCreateDeliverable(data: {
    applicationIds: string[];
    title: string;
    description?: string;
    type?: string;
    dueDate?: string;
    projectDeliverableId?: string;
  }): Observable<ApiResponse<Deliverable[]>> {
    return this.http.post<ApiResponse<Deliverable[]>>(
      `${this.apiUrl}/deliverables/bulk-create`,
      data
    );
  }

  getDeliverables(applicationId: string): Observable<Deliverable[]> {
    return this.http.get<Deliverable[]>(`${this.apiUrl}/${applicationId}/deliverables`);
  }

  // ── Documentos requeridos ──

  getDocuments(applicationId: string): Observable<ProjectDocument[]> {
    return this.http.get<ProjectDocument[]>(`${this.apiUrl}/${applicationId}/documents`);
  }

  uploadDocument(applicationId: string, requirementId: string, file: File): Observable<ProjectDocument> {
    return this.storageService.upload(file, 'academic_document').pipe(
      switchMap((res) => this.http.post<ProjectDocument>(`${this.apiUrl}/${applicationId}/documents`, {
        requirementId,
        fileId: res.data?.fileId,
      })),
    );
  }

  reviewDocument(applicationId: string, docId: string, status: 'approved' | 'rejected', comment?: string): Observable<ProjectDocument> {
    return this.http.patch<ProjectDocument>(`${this.apiUrl}/${applicationId}/documents/${docId}/review`, { status, comment });
  }

  /** Documentos del catálogo global que el admin seleccionó para ESTE proyecto. */
  getProjectDocumentRequirements(applicationId: string): Observable<ProjectDocumentRequirementLite[]> {
    return this.http.get<ProjectDocumentRequirementLite[]>(`${this.apiUrl}/${applicationId}/documents/requirements`);
  }

  selectDocumentRequirements(applicationId: string, requirementIds: string[]): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/${applicationId}/documents/requirements`, { requirementIds });
  }

  // ── Documentos de selección (empresa → estudiante, antes del inicio) ──

  getSelectionDocuments(applicationId: string): Observable<SelectionDocument[]> {
    return this.http.get<SelectionDocument[]>(`${this.apiUrl}/${applicationId}/selection-documents`);
  }

  requestSelectionDocument(
    applicationId: string, data: { name: string; description?: string; isMandatory?: boolean },
  ): Observable<SelectionDocument> {
    return this.http.post<SelectionDocument>(`${this.apiUrl}/${applicationId}/selection-documents`, data);
  }

  submitSelectionDocument(applicationId: string, docId: string, file: File): Observable<SelectionDocument> {
    return this.storageService.upload(file, 'academic_document').pipe(
      switchMap((res) => this.http.post<SelectionDocument>(
        `${this.apiUrl}/${applicationId}/selection-documents/${docId}/submit`,
        { fileId: res.data?.fileId },
      )),
    );
  }

  reviewSelectionDocument(
    applicationId: string, docId: string, status: 'approve' | 'reject', comment?: string,
  ): Observable<SelectionDocument> {
    return this.http.patch<SelectionDocument>(
      `${this.apiUrl}/${applicationId}/selection-documents/${docId}/review`, { status, comment },
    );
  }

  // ── Anteproyecto ──

  getAnteproyecto(applicationId: string): Observable<AcademicSubmission> {
    return this.http.get<AcademicSubmission>(`${this.apiUrl}/${applicationId}/anteproyecto`);
  }

  getAnteproyectoHistory(applicationId: string): Observable<SubmissionHistoryItem[]> {
    return this.http.get<SubmissionHistoryItem[]>(`${this.apiUrl}/${applicationId}/anteproyecto/history`);
  }

  submitAnteproyecto(applicationId: string, file: File): Observable<AcademicSubmission> {
    return this.storageService.upload(file, 'academic_document').pipe(
      switchMap((res) => this.http.post<AcademicSubmission>(`${this.apiUrl}/${applicationId}/anteproyecto`, {
        fileId: res.data?.fileId,
      })),
    );
  }

  addAsesorComment(applicationId: string, comment: string): Observable<AcademicSubmission> {
    return this.http.patch<AcademicSubmission>(`${this.apiUrl}/${applicationId}/anteproyecto/asesor-comment`, { comment });
  }

  /** `file` es opcional y debe ser PDF — se valida en el componente antes de llamar aquí. */
  reviewAnteproyecto(
    applicationId: string, action: 'correction' | 'approve' | 'reject', comment?: string, file?: File,
  ): Observable<AcademicSubmission> {
    const upload$: Observable<ApiResponse<{ fileId: string; url: string }> | null> = file
      ? this.storageService.upload(file, 'academic_document')
      : of(null);
    return upload$.pipe(
      switchMap((res) => this.http.patch<AcademicSubmission>(`${this.apiUrl}/${applicationId}/anteproyecto/review`, {
        action, comment, fileId: res?.data?.fileId,
      })),
    );
  }

  /**
   * Vista de solo lectura para un jurado que ya no tiene acceso activo
   * (se desvincula automáticamente al aprobarse el anteproyecto). Distinto
   * de `getAnteproyecto`/`getAnteproyectoHistory`, que exigen participación activa.
   */
  getJuradoAnteproyectoHistory(applicationId: string): Observable<{ submission: AcademicSubmission; history: SubmissionHistoryItem[] }> {
    return this.http.get<{ submission: AcademicSubmission; history: SubmissionHistoryItem[] }>(
      `${this.apiUrl}/${applicationId}/anteproyecto/jurado-history`,
    );
  }

  extendAnteproyectoDeadline(
    applicationId: string, target: 'review' | 'student', businessDays: number, reason?: string,
  ): Observable<AcademicSubmission> {
    return this.http.patch<AcademicSubmission>(
      `${this.apiUrl}/${applicationId}/anteproyecto/extend-deadline`, { target, businessDays, reason },
    );
  }

  // ── Registro académico / acuerdo de iniciación / progreso ──

  getAcademicRecord(applicationId: string): Observable<ProjectAcademicRecord> {
    return this.http.get<ProjectAcademicRecord>(`${this.apiUrl}/${applicationId}/academic-record`);
  }

  getInitiationChecklist(applicationId: string): Observable<InitiationChecklist> {
    return this.http.get<InitiationChecklist>(`${this.apiUrl}/${applicationId}/academic-record/checklist`);
  }

  uploadInitiationAgreement(applicationId: string, file: File, agreedDurationWeeks: number, notifyByEmail = true): Observable<ProjectAcademicRecord> {
    return this.storageService.upload(file, 'academic_document').pipe(
      switchMap((res) => this.http.patch<ProjectAcademicRecord>(`${this.apiUrl}/${applicationId}/academic-record/initiation-agreement`, {
        fileId: res.data?.fileId,
        agreedDurationWeeks,
        notifyByEmail,
      })),
    );
  }

  getProgress(applicationId: string): Observable<ProgressData> {
    return this.http.get<ProgressData>(`${this.apiUrl}/${applicationId}/progress`);
  }

  // ── Comentarios en entregables ──

  getDeliverableComments(applicationId: string, deliverableId: string): Observable<DeliverableComment[]> {
    return this.http.get<DeliverableComment[]>(`${this.apiUrl}/${applicationId}/deliverables/${deliverableId}/comments`);
  }

  addDeliverableComment(applicationId: string, deliverableId: string, content: string, isInternal = false): Observable<DeliverableComment> {
    return this.http.post<DeliverableComment>(`${this.apiUrl}/${applicationId}/deliverables/${deliverableId}/comments`, { content, isInternal });
  }

  // ── Finalización ──

  startFinalization(applicationId: string, finalDocs: FinalDocRequirementInput[]): Observable<ProjectAcademicRecord> {
    return this.http.patch<ProjectAcademicRecord>(
      `${this.apiUrl}/${applicationId}/finalization/start`,
      { finalDocs },
    );
  }

  getFinalDocuments(applicationId: string): Observable<FinalDocumentsResponse> {
    return this.http.get<FinalDocumentsResponse>(`${this.apiUrl}/${applicationId}/finalization/documents`);
  }

  uploadFinalDocument(applicationId: string, finalRequirementId: string, file: File): Observable<any> {
    return this.storageService.upload(file, 'academic_document').pipe(
      switchMap((res) => this.http.post(
        `${this.apiUrl}/${applicationId}/finalization/documents`,
        { finalRequirementId, fileId: res.data?.fileId },
      )),
    );
  }

  reviewFinalDocument(
    applicationId: string,
    documentId: string,
    action: 'approve' | 'reject',
    comment?: string,
  ): Observable<any> {
    const status = action === 'approve' ? 'approved' : 'rejected';
    return this.http.patch(
      `${this.apiUrl}/${applicationId}/finalization/documents/${documentId}/review`,
      { status, comment },
    );
  }

  advanceFinalization(applicationId: string): Observable<AdvanceFinalizationResponse> {
    return this.http.patch<AdvanceFinalizationResponse>(`${this.apiUrl}/${applicationId}/finalization/advance`, {});
  }

  cancelFinalization(applicationId: string, reason?: string): Observable<ProjectAcademicRecord> {
    return this.http.patch<ProjectAcademicRecord>(
      `${this.apiUrl}/${applicationId}/finalization/cancel`,
      { reason },
    );
  }

  uploadFinalGrade(applicationId: string, file: File, gradeValue?: number, notifyByEmail = true): Observable<ProjectAcademicRecord> {
    return this.storageService.upload(file, 'academic_document').pipe(
      switchMap((res) => this.http.patch<ProjectAcademicRecord>(`${this.apiUrl}/${applicationId}/finalization/final-grade`, {
        fileId: res.data?.fileId,
        gradeValue,
        notifyByEmail,
      })),
    );
  }
}

export interface AdvanceFinalizationResponse {
  record: ProjectAcademicRecord;
  pendingDocs: { id: string; name: string; actorType: string }[];
}

export type FinalDocActor = 'student' | 'company' | 'asesor';

export interface FinalDocRequirementInput {
  name: string;
  description?: string;
  actorType: FinalDocActor;
  isMandatory?: boolean;
}

export interface FinalDocumentRequirement {
  id: string;
  applicationId: string;
  name: string;
  description: string | null;
  actorType: FinalDocActor;
  isMandatory: boolean;
  displayOrder: number;
  createdBy: string;
  createdAt: string;
}

export interface FinalDocumentSubmission {
  id: string;
  applicationId: string;
  requirementId: string;
  requirementName: string;
  stage: 'initial' | 'final';
  actorType: FinalDocActor | null;
  submittedBy: string | null;
  fileId: string | null;
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  reviewerId: string | null;
  reviewerComment: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FinalDocumentsResponse {
  requirements: FinalDocumentRequirement[];
  documents: FinalDocumentSubmission[];
}

// ── Contrato del panel del proyecto (`GET /applications/:id/context`) ──

/** Rol del usuario dentro de ESTE proyecto. No es el rol global de la cuenta. */
export type ContextRole =
  | 'student'
  | 'company'
  | 'asesor'
  | 'jurado_anteproyecto'
  | 'jurado_final'
  | 'admin';

export type Permission =
  | 'view_project' | 'view_candidate' | 'view_private_notes' | 'view_progress'
  | 'view_academic_record' | 'view_activity'
  | 'change_application_status' | 'withdraw_application' | 'manage_private_notes'
  | 'manage_interviews' | 'submit_interview_solution'
  | 'view_anteproyecto' | 'submit_anteproyecto' | 'comment_anteproyecto'
  | 'review_anteproyecto' | 'extend_deadline'
  | 'view_documents' | 'upload_document' | 'review_document' | 'manage_document_requirements'
  | 'view_selection_documents' | 'request_selection_document'
  | 'upload_selection_document' | 'review_selection_document'
  | 'view_deliverables' | 'create_deliverable' | 'submit_deliverable'
  | 'review_deliverable' | 'comment_deliverable'
  | 'view_final_documents' | 'upload_final_document' | 'review_final_document'
  | 'manage_initiation_agreement' | 'manage_finalization' | 'manage_participants'
  | 'chat';

/** Las 8 etapas del ciclo académico, más los estados terminales. */
export type ProjectStage =
  | 'application' | 'selection' | 'academic_assignment' | 'anteproyecto'
  | 'documents' | 'agreement' | 'development' | 'closure'
  | 'completed' | 'closed';

export interface ProjectParticipant {
  userId: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: ContextRole;
  assignmentId: string | null;
  assignmentStatus: string | null;
}

export interface PendingAction {
  type: string;
  label: string;
  description: string | null;
  dueDate: string | null;
  severity: 'info' | 'warning' | 'danger';
  targetTab: string;
}

export interface ProjectContext {
  application: {
    id: string;
    status: string;
    appliedAt: string;
    reviewedAt: string | null;
    acceptedAt: string | null;
    completedAt: string | null;
    matchScore: number | null;
    coverLetter: string | null;
    notes: string | null;
  };
  project: {
    id: string;
    title: string;
    companyId: string;
    companyUserId: string;
  } | null;
  companyProfile: CompanyProfile | null;
  academicRecord: ProjectAcademicRecord | null;
  participants: ProjectParticipant[];
  viewer: {
    userId: string;
    userRole: string;
    contextRole: ContextRole;
    assignments: { assignmentId: string; role: string; status: string }[];
    permissions: Permission[];
  };
  stage: {
    current: ProjectStage;
    completed: string[];
    waitingOn: ContextRole | null;
  };
  pendingActions: PendingAction[];
  counters: {
    deliverablesPending: number;
    deliverablesAwaitingReview: number;
    documentsPending: number;
    documentsAwaitingReview: number;
  };
}

export interface SelectionDocument {
  id: string;
  applicationId: string;
  name: string;
  description: string | null;
  isMandatory: boolean;
  requestedBy: string;
  status: 'requested' | 'submitted' | 'approved' | 'rejected';
  fileId: string | null;
  submittedAt: string | null;
  reviewerId: string | null;
  reviewerComment: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface CompanyProfile {
  companyId: string;
  companyName: string;
  industry: string | null;
  companySize: string | null;
  description: string | null;
  website: string | null;
  logoUrl: string | null;
  foundedYear: number | null;
  employeeCount: number | null;
  verificationStatus: string;
  rating: number;
  totalReviews: number;
  totalProjects: number;
  headquartersCity: string | null;
  locations: { city: string; state: string | null; country: string }[];
  businessAreas: string[];
}

export interface ProjectAcademicRecord {
  id: string;
  applicationId: string;
  supervisorAssignmentId: string;
  anteproyectoSubmissionId: string | null;
  initiationAgreementFileId: string | null;
  officialStartDate: string | null;
  agreedDurationWeeks: number | null;
  expectedEndDate: string | null;
  actualEndDate: string | null;
  finalGradeFileId: string | null;
  finalGradeValue: string | null;
  cancellationReason: string | null;
  status: 'waiting_anteproyecto' | 'waiting_documents' | 'waiting_agreement' | 'active' | 'waiting_final_docs' | 'final_docs_review' | 'finalizing' | 'completed' | 'cancelled';
  asesorCompletionSignal: boolean;
  notes: string | null;
}

export interface InitiationChecklist {
  anteproyectoApproved: boolean;
  mandatoryDocumentsApproved: boolean;
  minimumDeliverablesMet: { met: boolean; current: number; required: number };
  readyForAgreement: boolean;
}

export interface ProgressData {
  temporalProgress: number;
  deliverableProgress: number;
  overallProgress: number;
  alertLevel: 'on_track' | 'at_risk' | 'delayed';
  officialStartDate: string | null;
  expectedEndDate: string | null;
}

export interface DeliverableComment {
  id: string;
  deliverableId: string;
  parentId: string | null;
  authorId: string;
  authorRole: string;
  content: string;
  isInternal: boolean;
  attachmentFileId: string | null;
  createdAt: string;
}

export interface ProjectDocument {
  id: string;
  applicationId: string;
  requirementId: string;
  requirementName: string;
  submittedBy: string | null;
  fileId: string | null;
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  reviewerId: string | null;
  reviewerComment: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
}

export interface ProjectDocumentRequirementLite {
  id: string;
  name: string;
  description: string | null;
  actorType: 'student' | 'company';
  isMandatory: boolean;
  templateFileId: string | null;
}

export interface AcademicSubmission {
  id: string;
  applicationId: string;
  submissionType: string;
  status: 'pending_submission' | 'submitted' | 'under_review' | 'needs_revision' | 'revised' | 'approved' | 'rejected' | 'expired';
  currentFileId: string | null;
  versionNumber: number;
  correctionCount: number;
  /**
   * Voto de cada jurado sobre la versión actual, indexado por userId.
   * La aprobación exige unanimidad; se reinicia en cada (re)entrega.
   */
  juradoVotes: Record<string, 'approve' | 'reject'> | null;
  reviewerComments: string | null;
  asesorComments: string | null;
  studentResponse: string | null;
  deadlineForReview: string | null;
  deadlineForStudent: string | null;
  submittedAt: string | null;
}

export interface SubmissionHistoryItem {
  id: string;
  submissionId: string;
  action: string;
  actorId: string;
  actorRole: string;
  comment: string | null;
  fileId: string | null;
  versionNumber: number | null;
  createdAt: string;
}
