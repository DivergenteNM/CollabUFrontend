import { Component, ChangeDetectionStrategy, inject, input, computed, signal, viewChild, ElementRef, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { Router } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { ApiResponse, Project } from '../../../../core/models';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import {
  ApplicationService, Permission, ProjectContext, SelectionDocument,
} from '../../../applications/services/application.service';
import { ApplicationStatus } from '../../../../core/enums';
import { StudentService } from '../../../students/services/student.service';
import { ChatService } from '../../../chat/services/chat.service';
import { FacultyService } from '../../../faculty/services/faculty.service';
import { StudentProfile } from '../../../../core/models/student.model';
import { Interview } from '../../../../core/models/application.model';
import { statusLabel as registryLabel } from '../../../../core/status/status-registry';

import { SkeletonComponent } from '../../../../shared/components/ui/skeleton/skeleton.component';
import { StatusBadgeComponent } from '../../../../shared/components/ui/status-badge/status-badge.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../shared/components/ui/confirm-dialog/confirm-dialog.component';
import { CompanyProfileCardComponent } from '../../../../shared/components/selection/company-profile-card/company-profile-card.component';
import { CandidateProfileCardComponent } from '../../../../shared/components/selection/candidate-profile-card/candidate-profile-card.component';
import { InterviewPanelComponent } from '../../../../shared/components/selection/interview-panel/interview-panel.component';
import { SelectionDocumentsPanelComponent } from '../../../../shared/components/selection/selection-documents-panel/selection-documents-panel.component';
import { AnteproyectoPanelComponent } from '../../../../shared/components/academic/anteproyecto-panel/anteproyecto-panel.component';
import { RejectAssignmentDialogComponent } from '../../components/reject-assignment-dialog/reject-assignment-dialog.component';

import { ScheduleInterviewDialogComponent, ScheduleInterviewResult } from '../../components/schedule-interview-dialog/schedule-interview-dialog.component';
import { RescheduleInterviewDialogComponent, RescheduleInterviewResult } from '../../components/reschedule-interview-dialog/reschedule-interview-dialog.component';
import { CompleteInterviewDialogComponent, CompleteInterviewResult } from '../../components/complete-interview-dialog/complete-interview-dialog.component';
import { RequestDocumentDialogComponent, RequestDocumentResult } from '../../components/request-document-dialog/request-document-dialog.component';
import { RejectApplicationDialogComponent } from '../../components/reject-application-dialog/reject-application-dialog.component';
import { ProjectInfoCardComponent } from '../../../../shared/components/project/project-info-card/project-info-card.component';

/**
 * Workspace de las etapas previas al inicio del proyecto: aplicación,
 * selección/entrevista, y espera de asignación de asesor. Deliberadamente
 * NO comparte componente con `ProjectWorkspaceComponent` (desarrollo) — son
 * procesos distintos con información y acciones distintas. El router decide
 * cuál mostrar según la etapa real (`stage-router.guard.ts`).
 */
@Component({
  selector: 'app-selection-workspace',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule, MatIconModule, MatButtonModule, MatDialogModule,
    MatSnackBarModule, MatProgressSpinnerModule, MatTooltipModule,
    SkeletonComponent, StatusBadgeComponent,
    CompanyProfileCardComponent, CandidateProfileCardComponent,
    InterviewPanelComponent, SelectionDocumentsPanelComponent,
    AnteproyectoPanelComponent, ProjectInfoCardComponent,
  ],
  templateUrl: './selection-workspace.component.html',
  styleUrl: './selection-workspace.component.scss',
})
export class SelectionWorkspaceComponent {
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly applicationService = inject(ApplicationService);
  private readonly studentService = inject(StudentService);
  private readonly chatService = inject(ChatService);
  private readonly facultyService = inject(FacultyService);

  readonly applicationId = input.required<string>();
  readonly busy = signal(false);
  readonly loadingChat = signal(false);

  readonly contextResource = rxResource({
    params: () => this.applicationId(),
    stream: ({ params: id }) => this.applicationService.getContext(id),
  });

  readonly context = computed<ProjectContext | null>(() => this.contextResource.value() ?? null);
  readonly viewer = computed(() => this.context()?.viewer ?? null);
  readonly application = computed(() => this.context()?.application ?? null);
  readonly project = computed(() => this.context()?.project ?? null);
  readonly companyProfile = computed(() => this.context()?.companyProfile ?? null);

  /** Igual que en ProjectWorkspaceComponent: el proyecto completo no viaja en
   * getContext(), se pide aparte contra el mismo GET /projects/:id público. */
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly projectDetailResource = httpResource<ApiResponse<Project>>(() => {
    const id = this.project()?.id;
    if (!this.isBrowser || !id) return undefined;
    return { url: `${environment.apiUrl}/projects/${id}` };
  });
  readonly projectDetail = computed<Project | null>(() => {
    const res = this.projectDetailResource.value() as any;
    return res?.data ?? res ?? null;
  });
  readonly participants = computed(() => this.context()?.participants ?? []);

  can(permission: Permission): boolean {
    return this.viewer()?.permissions.includes(permission) ?? false;
  }

  readonly isStudent = computed(() => this.viewer()?.contextRole === 'student');
  readonly isCompany = computed(() => this.viewer()?.contextRole === 'company');
  readonly isAdmin = computed(() => this.viewer()?.contextRole === 'admin');
  readonly isAsesor = computed(() => this.viewer()?.contextRole === 'asesor');
  readonly isJurado = computed(() => this.viewer()?.contextRole === 'jurado_anteproyecto');

  /** Mi propia asignación como asesor, si está pendiente de aceptación (accept/decline vive aquí). */
  readonly myPendingAsesorAssignment = computed(() => {
    if (!this.isAsesor()) return null;
    return this.viewer()?.assignments.find((a) => a.role === 'asesor' && a.status === 'pending_acceptance') ?? null;
  });

  /** Jurados de anteproyecto activos — para el bloque de vistos buenos del panel. */
  readonly juradoParticipants = computed(() =>
    this.participants().filter((p) => p.role === 'jurado_anteproyecto'),
  );

  readonly academicRecord = computed(() => this.context()?.academicRecord ?? null);

  /** El anteproyecto se habilita apenas hay `ProjectAcademicRecord` — se crea al aceptar el asesor. */
  readonly showAnteproyecto = computed(() => !!this.academicRecord() && this.can('view_anteproyecto'));

  readonly statusLabel = computed(() => {
    const s = this.application()?.status;
    return s ? registryLabel('application', s) : '';
  });

  readonly isTerminal = computed(() => {
    const s = this.application()?.status;
    return s === 'rejected' || s === 'withdrawn' || s === 'cancelled';
  });

  // ── Entrevistas ──
  readonly interviewsResource = rxResource({
    params: () => this.applicationId(),
    stream: ({ params: id }) => this.applicationService.getInterviews(id).pipe(catchError(() => of([] as Interview[]))),
  });
  readonly interviews = computed<Interview[]>(() => this.interviewsResource.value() ?? []);

  // ── Documentos de selección ──
  readonly selectionDocsResource = rxResource({
    params: () => ({ id: this.applicationId(), show: this.can('view_selection_documents') }),
    stream: ({ params }) => params.show
      ? this.applicationService.getSelectionDocuments(params.id).pipe(catchError(() => of([] as SelectionDocument[])))
      : of([] as SelectionDocument[]),
  });
  readonly selectionDocuments = computed<SelectionDocument[]>(() => this.selectionDocsResource.value() ?? []);

  // ── Perfil del candidato (solo si puedo verlo — empresa/admin) ──
  readonly candidateResource = rxResource({
    params: () => ({ studentId: this.application() ? this.context()?.participants.find(p => p.role === 'student')?.userId : null, show: this.can('view_candidate') }),
    stream: ({ params }) => (params.show && params.studentId)
      ? this.studentService.getProfileById(params.studentId).pipe(
          switchMap((res) => of(res.data ?? null)),
          catchError(() => of(null as StudentProfile | null)),
        )
      : of(null as StudentProfile | null),
  });
  readonly candidateProfile = computed(() => this.candidateResource.value() ?? null);
  readonly candidateName = computed(() => this.participants().find((p) => p.role === 'student')?.fullName ?? null);

  /** "¿Qué sigue?" — calculado en frontend porque es específico de esta etapa. */
  readonly nextStep = computed<string>(() => {
    const status = this.application()?.status;
    const role = this.viewer()?.contextRole;
    if (!status) return '';

    const forCompany: Partial<Record<string, string>> = {
      pending: 'Revisa el perfil del candidato y decide: pasar a revisión, preseleccionar, programar entrevista o rechazar.',
      under_review: 'Preselecciona al candidato o prográmale una entrevista.',
      shortlisted: 'Programa la entrevista cuando estés listo.',
      interview: 'Completa la entrevista con el resultado (superada/no superada) o acepta directamente al candidato.',
      accepted: 'Esperando que el administrador asigne un asesor académico.',
      pending_supervisor: 'Esperando que el asesor asignado acepte. No requiere acción tuya.',
    };
    const forStudent: Partial<Record<string, string>> = {
      pending: 'Tu postulación está enviada. La empresa la revisará pronto.',
      under_review: 'La empresa está revisando tu postulación.',
      shortlisted: 'Fuiste preseleccionado. Espera a que programen tu entrevista.',
      interview: 'Tienes una entrevista programada. Revisa los detalles y prepárate.',
      accepted: '¡Fuiste aceptado! Esperando que el administrador te asigne un asesor académico.',
      pending_supervisor: 'Ya tienes un asesor propuesto, esperando que acepte la asignación.',
    };
    const forAdmin: Partial<Record<string, string>> = {
      accepted: 'Este estudiante está listo para que le asignes un asesor académico.',
      pending_supervisor: 'Ya se asignó un asesor; esperando su aceptación.',
    };

    if (status === 'rejected') return 'Esta postulación fue rechazada.';
    if (status === 'withdrawn') return 'El estudiante retiró esta postulación.';
    if (status === 'cancelled') return 'Esta postulación fue cancelada.';

    if (role === 'asesor') {
      if (this.myPendingAsesorAssignment()) return 'Tienes una asignación pendiente de aceptar o declinar.';
      const sub = this.academicRecord();
      if (!sub) return '';
      return 'Sigue el anteproyecto — puedes comentarlo mientras el jurado lo revisa.';
    }
    if (role === 'jurado_anteproyecto') {
      return 'Revisa el anteproyecto y da tu visto bueno, solicita corrección o rechaza según corresponda.';
    }

    if (role === 'company') return forCompany[status] ?? '';
    if (role === 'student') {
      if (status === 'in_progress' && this.academicRecord()?.status === 'waiting_anteproyecto') {
        return 'Ya tienes asesor asignado. Carga tu anteproyecto para que el jurado lo revise.';
      }
      return forStudent[status] ?? '';
    }
    if (role === 'admin') return forAdmin[status] ?? 'Sin acción pendiente por tu parte en esta etapa.';
    return '';
  });

  reload(): void {
    this.contextResource.reload();
    this.interviewsResource.reload();
    this.selectionDocsResource.reload();
  }

  private notifyAndReload(message: string): void {
    this.busy.set(false);
    this.snackBar.open(message, 'OK', { duration: 3000 });
    this.reload();
  }

  private notifyError(message: string): void {
    this.busy.set(false);
    this.snackBar.open(message, 'Cerrar', { duration: 4000 });
  }

  // ── Estado de la postulación ──

  changeStatus(status: string): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.applicationService.changeStatus(this.applicationId(), status as ApplicationStatus).subscribe({
      next: () => this.notifyAndReload('Estado actualizado'),
      error: () => this.notifyError('No se pudo actualizar el estado'),
    });
  }

  openRejectDialog(): void {
    const ref = this.dialog.open(RejectApplicationDialogComponent);
    ref.afterClosed().subscribe((reason: string | undefined) => {
      if (!reason) return;
      this.busy.set(true);
      this.applicationService.changeStatus(this.applicationId(), ApplicationStatus.REJECTED, reason).subscribe({
        next: () => this.notifyAndReload('Postulación rechazada'),
        error: () => this.notifyError('No se pudo rechazar la postulación'),
      });
    });
  }

  withdraw(): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Retirar postulación', message: '¿Estás seguro? Esta acción no se puede deshacer.',
        confirmText: 'Retirar', type: 'danger',
      } satisfies ConfirmDialogData,
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.busy.set(true);
      this.applicationService.withdraw(this.applicationId()).subscribe({
        next: () => this.notifyAndReload('Postulación retirada'),
        error: () => this.notifyError('No se pudo retirar la postulación'),
      });
    });
  }

  // ── Entrevistas ──

  openScheduleInterview(): void {
    const ref = this.dialog.open(ScheduleInterviewDialogComponent, { width: '520px' });
    ref.afterClosed().subscribe((result: ScheduleInterviewResult | undefined) => {
      if (!result) return;
      this.busy.set(true);
      this.applicationService.scheduleInterview(this.applicationId(), result).subscribe({
        next: () => this.notifyAndReload('Entrevista programada'),
        error: () => this.notifyError('No se pudo programar la entrevista'),
      });
    });
  }

  openRescheduleInterview(interviewId: string): void {
    const ref = this.dialog.open(RescheduleInterviewDialogComponent, { width: '520px' });
    ref.afterClosed().subscribe((result: RescheduleInterviewResult | undefined) => {
      if (!result) return;
      this.busy.set(true);
      this.applicationService.rescheduleInterview(this.applicationId(), interviewId, result).subscribe({
        next: () => this.notifyAndReload('Entrevista reagendada'),
        error: () => this.notifyError('No se pudo reagendar la entrevista'),
      });
    });
  }

  cancelInterview(interviewId: string): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Cancelar entrevista', message: '¿Confirmas cancelar esta entrevista?', confirmText: 'Cancelar entrevista', type: 'warning' } satisfies ConfirmDialogData,
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.busy.set(true);
      this.applicationService.cancelInterview(this.applicationId(), interviewId).subscribe({
        next: () => this.notifyAndReload('Entrevista cancelada'),
        error: () => this.notifyError('No se pudo cancelar la entrevista'),
      });
    });
  }

  openCompleteInterview(interviewId: string): void {
    const ref = this.dialog.open(CompleteInterviewDialogComponent);
    ref.afterClosed().subscribe((result: CompleteInterviewResult | undefined) => {
      if (!result) return;
      this.busy.set(true);
      this.applicationService.completeInterview(this.applicationId(), interviewId, result).subscribe({
        next: () => this.notifyAndReload('Entrevista completada'),
        error: () => this.notifyError('No se pudo completar la entrevista'),
      });
    });
  }

  uploadInterviewSolution(interviewId: string, file: File): void {
    this.busy.set(true);
    this.applicationService.setInterviewSolution(this.applicationId(), interviewId, file).subscribe({
      next: () => this.notifyAndReload('Solución subida'),
      error: () => this.notifyError('No se pudo subir la solución'),
    });
  }

  submitInterviewFeedback(event: { interviewId: string; feedback: string }): void {
    this.busy.set(true);
    this.applicationService.setInterviewFeedback(this.applicationId(), event.interviewId, event.feedback).subscribe({
      next: () => this.notifyAndReload('Comentario guardado'),
      error: () => this.notifyError('No se pudo guardar el comentario'),
    });
  }

  readonly solutionFileInput = viewChild<ElementRef<HTMLInputElement>>('solutionFileInput');
  readonly selectionDocFileInput = viewChild<ElementRef<HTMLInputElement>>('selectionDocFileInput');

  private pendingSolutionInterviewId: string | null = null;
  requestSolutionFile(interviewId: string): void {
    this.pendingSolutionInterviewId = interviewId;
    this.solutionFileInput()?.nativeElement.click();
  }
  onSolutionFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    const interviewId = this.pendingSolutionInterviewId;
    (event.target as HTMLInputElement).value = '';
    if (file && interviewId) this.uploadInterviewSolution(interviewId, file);
    this.pendingSolutionInterviewId = null;
  }

  private pendingSubmitDocId: string | null = null;
  requestSelectionDocFile(docId: string): void {
    this.pendingSubmitDocId = docId;
    this.selectionDocFileInput()?.nativeElement.click();
  }
  onSelectionDocFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    const docId = this.pendingSubmitDocId;
    (event.target as HTMLInputElement).value = '';
    if (file && docId) this.submitSelectionDocument(docId, file);
    this.pendingSubmitDocId = null;
  }

  // ── Documentos de selección ──

  openRequestDocument(): void {
    const ref = this.dialog.open(RequestDocumentDialogComponent);
    ref.afterClosed().subscribe((result: RequestDocumentResult | undefined) => {
      if (!result) return;
      this.busy.set(true);
      this.applicationService.requestSelectionDocument(this.applicationId(), result).subscribe({
        next: () => this.notifyAndReload('Documento solicitado'),
        error: () => this.notifyError('No se pudo solicitar el documento'),
      });
    });
  }

  submitSelectionDocument(docId: string, file: File): void {
    this.busy.set(true);
    this.applicationService.submitSelectionDocument(this.applicationId(), docId, file).subscribe({
      next: () => this.notifyAndReload('Documento entregado'),
      error: () => this.notifyError('No se pudo entregar el documento'),
    });
  }

  reviewSelectionDocument(event: { id: string; status: 'approve' | 'reject' }): void {
    this.busy.set(true);
    this.applicationService.reviewSelectionDocument(this.applicationId(), event.id, event.status).subscribe({
      next: () => this.notifyAndReload(event.status === 'approve' ? 'Documento aprobado' : 'Documento rechazado'),
      error: () => this.notifyError('No se pudo revisar el documento'),
    });
  }

  // ── Navegación / comunicación ──

  goBack(): void {
    const role = this.viewer()?.userRole;
    if (role === 'student') this.router.navigate(['/my-applications']);
    else if (role === 'company') this.router.navigate(['/received-applications']);
    else if (role === 'faculty') this.router.navigate(['/my-students']);
    else this.router.navigate(['/admin/supervisors']);
  }

  acceptAsesorAssignment(): void {
    const assignment = this.myPendingAsesorAssignment();
    if (!assignment || this.busy()) return;
    this.busy.set(true);
    this.facultyService.acceptAssignment(assignment.assignmentId).subscribe({
      next: () => this.notifyAndReload('Asignación aceptada — ya puedes seguir el proceso académico'),
      error: () => this.notifyError('No se pudo aceptar la asignación'),
    });
  }

  declineAsesorAssignment(): void {
    const assignment = this.myPendingAsesorAssignment();
    if (!assignment) return;
    const ref = this.dialog.open(RejectAssignmentDialogComponent);
    ref.afterClosed().subscribe((reason: string | undefined) => {
      if (!reason) return;
      this.busy.set(true);
      this.facultyService.declineAssignment(assignment.assignmentId, reason).subscribe({
        next: () => this.notifyAndReload('Asignación declinada'),
        error: () => this.notifyError('No se pudo declinar la asignación'),
      });
    });
  }

  goToSupervisorAssignment(): void {
    this.router.navigate(['/admin/supervisors'], { queryParams: { applicationId: this.applicationId() } });
  }

  startChat(): void {
    const ctx = this.context();
    if (!ctx || this.loadingChat()) return;
    const currentUserId = this.viewer()?.userId;
    const partnerId = this.participants().find((p) => p.userId !== currentUserId)?.userId;
    if (!partnerId) return;

    this.loadingChat.set(true);
    this.chatService.createConversation([partnerId], 'direct', ctx.project?.id).subscribe({
      next: (res: any) => {
        this.loadingChat.set(false);
        const conv = res?.data || res;
        if (conv?.id) this.router.navigate(['/chat', conv.id]);
      },
      error: () => {
        this.loadingChat.set(false);
        this.snackBar.open('Error al iniciar el chat', 'Cerrar', { duration: 4000 });
      },
    });
  }
}
