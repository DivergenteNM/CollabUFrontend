import {
  Component, ChangeDetectionStrategy, inject, input, computed, signal, effect, viewChild, PLATFORM_ID,
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';
import { catchError, switchMap } from 'rxjs/operators';

import { DatePipe, isPlatformBrowser } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { ApiResponse, Project } from '../../../../core/models';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';

import { ApplicationService, Permission, ProjectContext } from '../../../applications/services/application.service';
import { ChatService } from '../../../chat/services/chat.service';
import { EvaluationService } from '../../../evaluations/services/evaluation.service';
import { Evaluation } from '../../../../core/models';
import { ChatUnreadStore } from '../../../../state/chat-unread.store';
import { statusLabel as registryLabel } from '../../../../core/status/status-registry';
import { Deliverable } from '../../../../core/models';

import { SkeletonComponent } from '../../../../shared/components/ui/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../../../shared/components/ui/status-badge/status-badge.component';
import { DeadlineChipComponent } from '../../../../shared/components/ui/deadline-chip/deadline-chip.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../shared/components/ui/confirm-dialog/confirm-dialog.component';
import { TimelineComponent, TimelineEvent } from '../../../../shared/components/ui/timeline/timeline.component';
import { LifecycleTimelineComponent } from '../../../../shared/components/academic/lifecycle-timeline/lifecycle-timeline.component';
import { PeopleCardComponent } from '../../../../shared/components/academic/people-card/people-card.component';
import { AnteproyectoPanelComponent } from '../../../../shared/components/academic/anteproyecto-panel/anteproyecto-panel.component';
import { DocumentsPanelComponent } from '../../../../shared/components/academic/documents-panel/documents-panel.component';
import { SelectDocumentRequirementsDialogComponent } from '../../../../shared/components/academic/select-document-requirements-dialog/select-document-requirements-dialog.component';
import { FinalDocumentsPanelComponent } from '../../../../shared/components/academic/final-documents-panel/final-documents-panel.component';
import { ProgressBarComponent } from '../../../../shared/components/academic/progress-bar/progress-bar.component';
import {
  DeliverableCardComponent,
  DeliverableReviewEvent,
  DeliverableSubmitEvent,
} from '../../../../shared/components/academic/deliverable-card/deliverable-card.component';
import { CreateDeliverableDialogComponent } from '../../../applications/components/create-deliverable-dialog/create-deliverable-dialog.component';
import { FinalizationComponent } from '../../../admin/pages/finalization/finalization.component';
import { InitiationAgreementComponent } from '../../../admin/pages/initiation-agreement/initiation-agreement.component';
import { ProjectChatPanelComponent } from '../../../../shared/components/workspace/project-chat-panel/project-chat-panel.component';
import { FileLinkComponent } from '../../../../shared/components/ui/file-link/file-link.component';
import { ProjectInfoCardComponent } from '../../../../shared/components/project/project-info-card/project-info-card.component';
import { CompanyProfileCardComponent } from '../../../../shared/components/selection/company-profile-card/company-profile-card.component';

@Component({
  selector: 'app-project-workspace',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe, MatCardModule, MatTabsModule, MatIconModule, MatButtonModule,
    MatDividerModule, MatDialogModule, MatSnackBarModule, MatProgressSpinnerModule, MatBadgeModule,
    SkeletonComponent, EmptyStateComponent, StatusBadgeComponent, DeadlineChipComponent,
    TimelineComponent,
    LifecycleTimelineComponent, PeopleCardComponent,
    AnteproyectoPanelComponent, DocumentsPanelComponent, ProgressBarComponent,
    DeliverableCardComponent, FinalizationComponent, InitiationAgreementComponent,
    ProjectChatPanelComponent, FileLinkComponent, FinalDocumentsPanelComponent,
    ProjectInfoCardComponent, CompanyProfileCardComponent,
  ],
  templateUrl: './project-workspace.component.html',
  styleUrl: './project-workspace.component.scss',
})
export class ProjectWorkspaceComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly applicationService = inject(ApplicationService);
  private readonly chatService = inject(ChatService);
  private readonly evaluationService = inject(EvaluationService);
  private readonly chatUnreadStore = inject(ChatUnreadStore);

  readonly projectChatUnread = computed(() => {
    const projectId = this.context()?.project?.id;
    return this.chatUnreadStore.getByProject(projectId);
  });

  readonly participantUserIds = computed<string[]>(() => {
    const currentUserId = this.viewer()?.userId;
    return this.participants()
      .map((p) => p.userId)
      .filter((id): id is string => !!id && id !== currentUserId);
  });

  readonly applicationId = input.required<string>();

  readonly loadingChat = signal(false);
  readonly submitting = signal(false);

  /** Deep-link params: `?tab=academic&anchor=anteproyecto`. */
  private readonly tabParam = toSignal(
    this.route.queryParamMap.pipe(map((p) => p.get('tab'))),
    { initialValue: null },
  );
  private readonly anchorParam = toSignal(
    this.route.queryParamMap.pipe(map((p) => p.get('anchor'))),
    { initialValue: null },
  );

  readonly contextResource = rxResource({
    params: () => this.applicationId(),
    stream: ({ params: id }) => this.applicationService.getContext(id),
  });

  readonly context = computed<ProjectContext | null>(
    () => this.contextResource.value() ?? null,
  );

  readonly stage = computed(() => this.context()?.stage ?? null);
  readonly viewer = computed(() => this.context()?.viewer ?? null);
  readonly participants = computed(() => this.context()?.participants ?? []);
  readonly pendingActions = computed(() => this.context()?.pendingActions ?? []);
  readonly academicRecord = computed(() => this.context()?.academicRecord ?? null);
  readonly counters = computed(() => this.context()?.counters ?? null);
  readonly companyProfile = computed(() => this.context()?.companyProfile ?? null);

  /**
   * El contexto solo trae {id, title, companyId} del proyecto — el resto de su
   * información (descripción, skills, modalidad, programas, documento) vive en
   * el proyecto completo, ya público vía GET /projects/:id (mismo endpoint que
   * usa la ficha pública de proyecto). Se pide aparte para no tocar el
   * contrato de getProjectContext, que usan varias pantallas más.
   */
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly projectDetailResource = httpResource<ApiResponse<Project>>(() => {
    const id = this.context()?.project?.id;
    if (!this.isBrowser || !id) return undefined;
    return { url: `${environment.apiUrl}/projects/${id}` };
  });
  readonly projectDetail = computed<Project | null>(() => {
    const res = this.projectDetailResource.value() as any;
    return res?.data ?? res ?? null;
  });

  can(permission: Permission): boolean {
    return this.viewer()?.permissions.includes(permission) ?? false;
  }

  readonly projectTitle = computed(() => this.context()?.project?.title ?? 'Proyecto');

  readonly applicationStatusLabel = computed(() => {
    const status = this.context()?.application.status;
    return status ? registryLabel('application', status) : '';
  });

  readonly progressResource = rxResource({
    params: () => this.applicationId(),
    stream: ({ params: id }) =>
      this.applicationService.getProgress(id).pipe(catchError(() => of(null))),
  });

  readonly deliverablesResource = rxResource({
    params: () => ({ id: this.applicationId(), show: this.showDeliverablesTab() }),
    stream: ({ params }) =>
      params.show
        ? this.applicationService.getDeliverables(params.id).pipe(catchError(() => of([])))
        : of([]),
  });

  readonly deliverables = computed<Deliverable[]>(
    () => (this.deliverablesResource.value() as Deliverable[]) ?? [],
  );

  readonly timelineResource = rxResource({
    params: () => this.applicationId(),
    stream: ({ params: id }) =>
      this.applicationService.getById(id).pipe(
        switchMap((app) => {
          if (!app) return of([]);
          return of((app.timeline ?? []).map((t) => ({
            date: t.createdAt,
            title: this.timelineTitle(t.toStatus),
            description: '',
            icon: this.timelineIcon(t.toStatus),
          })));
        }),
        catchError(() => of([])),
      ),
  });

  readonly timelineEvents = computed<TimelineEvent[]>(
    () => (this.timelineResource.value() as TimelineEvent[]) ?? [],
  );

  readonly showAcademicTab = computed(() => {
    const record = this.academicRecord();
    return !!record && record.status !== 'cancelled';
  });

  /**
   * El proyecto quedó cerrado: los paneles bloquean acciones de escritura pero
   * siguen mostrando el historial. Es el switch central para modo read-only.
   */
  readonly isCompleted = computed(() =>
    this.academicRecord()?.status === 'completed',
  );

  readonly isCancelled = computed(() =>
    this.academicRecord()?.status === 'cancelled',
  );

  /** Bloquea acciones de escritura en cualquier panel académico. */
  readonly isReadOnly = computed(() =>
    this.isCompleted() || this.isCancelled(),
  );

  readonly finalGradeFileId = computed(
    () => this.academicRecord()?.finalGradeFileId ?? null,
  );

  readonly showDeliverablesTab = computed(() => {
    const record = this.academicRecord();
    if (!record) return false;
    // Incluye 'waiting_documents'/'waiting_agreement': el backend ya permite
    // crear entregables desde que la postulación está IN_PROGRESS (asesor
    // aceptado), y el checklist de iniciación exige un mínimo de entregables
    // definidos por la empresa como precondición para cargar el acuerdo. Sin
    // esta pestaña visible antes de 'active', esa precondición era imposible
    // de cumplir — la empresa no tenía dónde crearlos.
    return ['waiting_documents', 'waiting_agreement', 'active', 'waiting_final_docs',
            'final_docs_review', 'finalizing', 'completed'].includes(record.status);
  });

  readonly evaluationsResource = rxResource({
    params: () => this.applicationId(),
    stream: ({ params: id }) =>
      this.evaluationService.getByApplication(id).pipe(catchError(() => of([] as Evaluation[]))),
  });

  readonly evaluations = computed<Evaluation[]>(
    () => (this.evaluationsResource.value() as Evaluation[]) ?? [],
  );

  readonly evaluationsAsEvaluator = computed(() => {
    const currentUserId = this.viewer()?.userId;
    return this.evaluations().filter((e) => e.evaluatorId === currentUserId);
  });

  readonly evaluationsAboutMe = computed(() => {
    const currentUserId = this.viewer()?.userId;
    return this.evaluations().filter((e) => e.evaluatedId === currentUserId);
  });

  readonly showEvaluationsTab = computed(() => this.evaluations().length > 0);

  readonly showAnteproyecto = computed(() => this.can('view_anteproyecto'));
  readonly showDocuments = computed(() => this.can('view_documents'));

  /** Etapa "Documentos" — el corte de negocio real es `waiting_documents`, no un tab genérico. */
  readonly isWaitingDocumentsStage = computed(
    () => this.academicRecord()?.status === 'waiting_documents',
  );

  readonly studentDocsPanel = viewChild<DocumentsPanelComponent>('studentDocsPanel');
  readonly companyDocsPanel = viewChild<DocumentsPanelComponent>('companyDocsPanel');
  readonly initiationAgreement = viewChild<InitiationAgreementComponent>('initiationAgreement');

  readonly contextRole = computed(() => this.viewer()?.contextRole ?? null);
  readonly viewerContextRole = computed(() => this.viewer()?.contextRole ?? '');

  /**
   * El panel de documentos finales aparece cuando el proyecto ya entró en la
   * fase de finalización (o la superó). Solo visible para participantes con
   * permiso `view_final_documents`.
   */
  readonly showFinalDocsPanel = computed(() => {
    if (!this.can('view_final_documents')) return false;
    const record = this.academicRecord();
    if (!record) return false;
    return ['waiting_final_docs', 'final_docs_review',
            'finalizing', 'completed'].includes(record.status);
  });

  /**
   * Índice de tab a mostrar según `?tab=` y las pestañas que estén disponibles.
   * Las pestañas académico/entregables son condicionales, así que el índice
   * cambia según el rol y el estado del registro académico.
   */
  readonly selectedTabIndex = computed(() => {
    const target = this.tabParam();
    if (!target) return 0;
    const tabs: string[] = ['summary'];
    if (this.showAcademicTab()) tabs.push('academic');
    if (this.showDeliverablesTab()) tabs.push('deliverables');
    if (this.showEvaluationsTab()) tabs.push('evaluations');
    if (this.can('chat')) tabs.push('chat');
    tabs.push('activity');
    const idx = tabs.indexOf(target);
    return idx >= 0 ? idx : 0;
  });

  constructor() {
    /**
     * El deep-link puede llegar antes de que renderice el panel destino; nos
     * suscribimos al contexto para intentar el scroll cuando el DOM ya existe.
     */
    effect(() => {
      const anchor = this.anchorParam();
      if (!anchor || !this.context()) return;
      queueMicrotask(() => {
        setTimeout(() => {
          const el = document.getElementById(`ws-anchor-${anchor}`);
          el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 250);
      });
    });
  }

  goBack(): void {
    const role = this.viewer()?.userRole;
    if (role === 'student') this.router.navigate(['/my-applications']);
    else if (role === 'company') this.router.navigate(['/received-applications']);
    else if (role === 'faculty') this.router.navigate(['/my-students']);
    else this.router.navigate(['/admin/academic-process']);
  }

  startChat(targetUserId?: string): void {
    const ctx = this.context();
    if (!ctx || this.loadingChat()) return;

    const partnerId = targetUserId ?? ctx.project?.companyUserId;
    if (!partnerId) return;

    this.loadingChat.set(true);
    this.chatService.createConversation(
      [partnerId], 'direct', ctx.project?.id,
    ).subscribe({
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

  withdraw(): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Retirar postulación',
        message: '¿Estás seguro? Esta acción no se puede deshacer.',
        confirmText: 'Retirar',
        type: 'danger',
      } satisfies ConfirmDialogData,
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.applicationService.withdraw(this.applicationId()).subscribe({
          next: () => {
            this.snackBar.open('Postulación retirada', 'OK', { duration: 3000 });
            this.reloadAll();
          },
          error: () => this.snackBar.open('Error al retirar', 'Cerrar', { duration: 4000 }),
        });
      }
    });
  }

  onDeliverableSubmit(event: DeliverableSubmitEvent): void {
    if (!event.files.length || this.submitting()) return;
    this.submitting.set(true);

    this.applicationService.submitDeliverable(this.applicationId(), {
      file: event.files[0],
      title: event.files[0].name,
      projectDeliverableId: event.deliverableId,
    }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.snackBar.open('Entregable subido', 'OK', { duration: 3000 });
        this.reloadAll();
      },
      error: () => {
        this.submitting.set(false);
        this.snackBar.open('Error al subir entregable', 'Cerrar', { duration: 4000 });
      },
    });
  }

  onDeliverableReview(event: DeliverableReviewEvent): void {
    if (this.submitting()) return;
    this.submitting.set(true);

    this.applicationService.reviewDeliverable(
      this.applicationId(),
      event.deliverableId,
      event.action,
      { grade: event.grade, feedback: event.feedback },
    ).subscribe({
      next: () => {
        this.submitting.set(false);
        this.snackBar.open('Revisión guardada', 'OK', { duration: 3000 });
        this.reloadAll();
      },
      error: (err) => {
        this.submitting.set(false);
        const msg = err?.error?.message ?? 'Error al guardar revisión';
        this.snackBar.open(Array.isArray(msg) ? msg.join('; ') : msg, 'Cerrar', { duration: 4000 });
      },
    });
  }

  openCreateDeliverable(): void {
    const ref = this.dialog.open(CreateDeliverableDialogComponent);
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      this.applicationService.createDeliverable(this.applicationId(), result).subscribe({
        next: () => {
          this.snackBar.open('Entregable creado', 'OK', { duration: 3000 });
          this.reloadAll();
        },
        error: () => this.snackBar.open('Error al crear entregable', 'Cerrar', { duration: 4000 }),
      });
    });
  }

  reloadAll(): void {
    this.contextResource.reload();
    this.progressResource.reload();
    this.timelineResource.reload();
    this.deliverablesResource.reload();
    this.evaluationsResource.reload();
    this.initiationAgreement()?.reload();
  }

  openSelectDocumentRequirements(): void {
    const ref = this.dialog.open(SelectDocumentRequirementsDialogComponent, { width: '560px', maxHeight: '85vh' });
    ref.afterClosed().subscribe((requirementIds: string[] | undefined) => {
      if (!requirementIds || requirementIds.length === 0) return;
      this.applicationService.selectDocumentRequirements(this.applicationId(), requirementIds).subscribe({
        next: () => {
          this.snackBar.open('Documentos requeridos definidos', 'OK', { duration: 3000 });
          this.studentDocsPanel()?.resource.reload();
          this.companyDocsPanel()?.resource.reload();
        },
        error: () => this.snackBar.open('No se pudo guardar la selección', 'Cerrar', { duration: 4000 }),
      });
    });
  }

  goToEvaluation(evaluationId: string): void {
    // Abre el detalle de la evaluación (form si pending, resultados si completed).
    this.router.navigate(['/my-evaluations', evaluationId]);
  }

  evalTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      company_evaluates_student: 'Empresa → Estudiante',
      student_evaluates_company: 'Estudiante → Empresa',
      supervisor_evaluates_student: 'Asesor → Estudiante',
      student_evaluates_supervisor: 'Estudiante → Asesor',
      self_evaluation: 'Autoevaluación',
    };
    return labels[type] ?? type;
  }

  deliverableStatusLabel(status: string): string {
    return registryLabel('deliverable', status);
  }

  private timelineIcon(status: string): string {
    const icons: Record<string, string> = {
      pending: 'send', under_review: 'visibility', shortlisted: 'star',
      interview: 'event', accepted: 'check_circle', rejected: 'cancel',
      withdrawn: 'undo', in_progress: 'play_circle', completed: 'task_alt',
      cancelled: 'block', pending_supervisor: 'person_search',
    };
    return icons[status] ?? 'circle';
  }

  roleIcon(role: string): string {
    const icons: Record<string, string> = {
      company: 'business', asesor: 'school',
      jurado_anteproyecto: 'gavel', jurado_final: 'gavel',
    };
    return icons[role] ?? 'person';
  }

  roleLabel(role: string): string {
    const labels: Record<string, string> = {
      company: 'Empresa', asesor: 'Asesor',
      jurado_anteproyecto: 'Jurado de anteproyecto',
      jurado_final: 'Jurado final',
    };
    return labels[role] ?? role;
  }

  private timelineTitle(status: string): string {
    const titles: Record<string, string> = {
      pending: 'Postulación enviada', under_review: 'En revisión',
      shortlisted: 'Preseleccionado', interview: 'Entrevista programada',
      accepted: 'Aceptado', rejected: 'Rechazado',
      withdrawn: 'Retirado', in_progress: 'Proyecto en progreso',
      completed: 'Proyecto completado', cancelled: 'Cancelado',
      pending_supervisor: 'Esperando asignación de asesor',
    };
    return titles[status] ?? status;
  }
}
