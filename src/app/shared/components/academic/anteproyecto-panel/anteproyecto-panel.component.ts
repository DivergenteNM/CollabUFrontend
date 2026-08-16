import { Component, ChangeDetectionStrategy, inject, input, signal, computed } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';

import {
  ApplicationService,
  AcademicSubmission,
  SubmissionHistoryItem,
  ProjectParticipant,
} from '../../../../features/applications/services/application.service';
import { AuthStore } from '../../../../state/auth.store';
import { FileLinkComponent } from '../../ui/file-link/file-link.component';
import { EmptyStateComponent } from '../../ui/empty-state/empty-state.component';
import { DeadlineChipComponent } from '../../ui/deadline-chip/deadline-chip.component';
import { statusLabel as registryLabel } from '../../../../core/status/status-registry';

const SUBMITTABLE_STATES = ['pending_submission', 'needs_revision'];
const REVIEWABLE_STATES = ['submitted', 'revised', 'under_review'];

const HISTORY_LABELS: Record<string, string> = {
  submitted: 'Entregado',
  asesor_commented: 'Comentario del asesor',
  correction_requested: 'Corrección solicitada',
  revised: 'Re-entregado',
  approved: 'Visto bueno',
  rejected: 'Rechazado',
  expired: 'Plazo vencido',
  deadline_extended: 'Plazo extendido',
};

const ACTOR_LABELS: Record<string, string> = {
  student: 'Estudiante',
  asesor: 'Asesor',
  jurado_anteproyecto: 'Jurado',
  jurado_final: 'Jurado final',
  admin: 'Facultad',
  system: 'Sistema',
};

/** A quién obliga el plazo vigente, según el estado de la entrega. */
type ActiveDeadline = { date: string; owner: 'student' | 'reviewer' } | null;

/**
 * Única fuente de verdad para ver/interactuar con el anteproyecto — la usan
 * tanto `ProjectWorkspaceComponent` (desarrollo, sin tocar) como
 * `SelectionWorkspaceComponent` (pre-desarrollo). Los inputs de acción
 * (`canComment`/`canReview`/`canExtendDeadline`) son opcionales y por
 * defecto `false`, así que el uso existente en el workspace de desarrollo
 * no cambia de comportamiento — solo se activan donde el padre los pase.
 */
@Component({
  selector: 'app-anteproyecto-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule, MatIconModule, MatButtonModule, MatChipsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatProgressSpinnerModule, MatSnackBarModule, FormsModule, DatePipe,
    FileLinkComponent, EmptyStateComponent, DeadlineChipComponent,
  ],
  templateUrl: './anteproyecto-panel.component.html',
  styleUrl: './anteproyecto-panel.component.scss',
})
export class AnteproyectoPanelComponent {
  readonly applicationId = input.required<string>();
  /** El estudiante entrega; los demás roles solo consultan. */
  readonly canEdit = input(true);
  /** Asesor: puede agregar comentarios, no aprueba ni rechaza. */
  readonly canComment = input(false);
  /** Jurado de anteproyecto: da visto bueno / pide corrección / rechaza. */
  readonly canReview = input(false);
  /** Admin: puede extender el plazo vigente. */
  readonly canExtendDeadline = input(false);
  /** Jurados de anteproyecto activos (accepted) — para el bloque de vistos buenos. */
  readonly juradoParticipants = input<ProjectParticipant[]>([]);

  private readonly applicationService = inject(ApplicationService);
  private readonly authStore = inject(AuthStore);
  private readonly snackBar = inject(MatSnackBar);

  readonly currentUserId = computed(() => this.authStore.user()?.id ?? null);

  readonly uploading = signal(false);
  /** True cuando el visor perdió acceso (403) — típicamente jurado desvinculado tras aprobar. */
  readonly accessRevoked = signal(false);
  readonly commentText = signal('');
  readonly submittingComment = signal(false);
  readonly reviewComment = signal('');
  readonly reviewFile = signal<File | null>(null);
  readonly reviewFileError = signal<string | null>(null);
  readonly submittingReview = signal<'correction' | 'approve' | 'reject' | null>(null);
  readonly showExtendForm = signal(false);
  readonly extendTarget = signal<'review' | 'student'>('review');
  readonly extendDays = signal(3);
  readonly extendReason = signal('');
  readonly submittingExtend = signal(false);

  readonly resource = rxResource({
    params: () => this.applicationId(),
    stream: ({ params: id }) => {
      this.accessRevoked.set(false);
      return forkJoin({
        // 403 tras aprobar es un caso esperado, no un error real: el jurado se
        // desvincula automáticamente al aprobarse el anteproyecto (evento
        // `academic.anteproyecto.approved` → admin-service), y esa desvinculación
        // puede completarse antes de que termine de recargar este panel.
        submission: this.applicationService.getAnteproyecto(id).pipe(
          catchError((err: HttpErrorResponse) => {
            if (err.status === 403) {
              this.accessRevoked.set(true);
              return of(null as AcademicSubmission | null);
            }
            throw err;
          }),
        ),
        // El historial es complementario: su ausencia no debe ocultar el estado.
        history: this.applicationService.getAnteproyectoHistory(id).pipe(
          catchError(() => of([] as SubmissionHistoryItem[])),
        ),
      });
    },
  });

  readonly submission = computed<AcademicSubmission | null>(
    () => this.resource.value()?.submission ?? null,
  );
  readonly history = computed(() => this.resource.value()?.history ?? []);

  /**
   * Historial agrupado por versión — así cada revisión/corrección queda
   * claramente asociada a la versión que la originó, en vez de una lista
   * plana donde no se sabe a qué entrega corresponde cada comentario.
   */
  readonly historyByVersion = computed(() => {
    const groups = new Map<number, SubmissionHistoryItem[]>();
    let currentVersion = 0;
    for (const item of this.history()) {
      if (item.versionNumber) currentVersion = item.versionNumber;
      const key = item.versionNumber ?? currentVersion;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    }
    return [...groups.entries()]
      .map(([version, items]) => ({ version, items }))
      .sort((a, b) => b.version - a.version);
  });

  /**
   * Solo uno de los dos plazos está vigente a la vez, y depende del estado.
   * Antes solo se mostraba el del estudiante y únicamente en `needs_revision`,
   * así que el plazo de revisión del jurado era invisible para todos.
   */
  readonly activeDeadline = computed<ActiveDeadline>(() => {
    const s = this.submission();
    if (!s) return null;

    if (['needs_revision', 'pending_submission'].includes(s.status) && s.deadlineForStudent) {
      return { date: s.deadlineForStudent, owner: 'student' };
    }
    if (REVIEWABLE_STATES.includes(s.status) && s.deadlineForReview) {
      return { date: s.deadlineForReview, owner: 'reviewer' };
    }
    return null;
  });

  /**
   * Estado de vistos buenos — SIN lenguaje de votación. La cantidad de
   * jurados es dinámica (1, 2 o los que estén asignados); todos deben dar
   * su visto bueno para que el anteproyecto se acepte. `juradoVotes` se
   * resetea en cada (re)entrega, así que siempre refleja la versión actual.
   */
  readonly juradoReviewStatus = computed(() => {
    const jurados = this.juradoParticipants();
    if (jurados.length === 0) return null;
    const votes = this.submission()?.juradoVotes ?? {};
    const rows = jurados.map((j) => ({
      userId: j.userId,
      name: j.fullName ?? 'Jurado',
      vote: votes[j.userId] ?? null,
    }));
    const approvedCount = rows.filter((r) => r.vote === 'approve').length;
    const rejectedCount = rows.filter((r) => r.vote === 'reject').length;
    return {
      rows,
      total: jurados.length,
      approvedCount,
      rejectedCount,
      allApproved: approvedCount === jurados.length,
    };
  });

  readonly myVote = computed(() => {
    const uid = this.currentUserId();
    if (!uid) return null;
    return this.submission()?.juradoVotes?.[uid] ?? null;
  });

  canSubmit(): boolean {
    const s = this.submission();
    return !!s && SUBMITTABLE_STATES.includes(s.status);
  }

  canReviewNow(): boolean {
    const s = this.submission();
    return this.canReview() && !!s && REVIEWABLE_STATES.includes(s.status) && !this.myVote();
  }

  statusLabel(status: string): string {
    return registryLabel('submission', status);
  }

  historyLabel(action: string): string {
    return HISTORY_LABELS[action] ?? action;
  }

  actorLabel(actorRole: string): string {
    return ACTOR_LABELS[actorRole] ?? actorRole;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploading.set(true);
    this.applicationService.submitAnteproyecto(this.applicationId(), file).subscribe({
      next: () => {
        this.uploading.set(false);
        input.value = '';
        this.snackBar.open('Anteproyecto entregado', 'OK', { duration: 3000 });
        this.resource.reload();
      },
      error: (err: HttpErrorResponse) => {
        this.uploading.set(false);
        input.value = '';
        this.snackBar.open(
          err?.error?.message ?? 'Error al entregar el anteproyecto',
          'Cerrar',
          { duration: 4000 },
        );
      },
    });
  }

  submitComment(): void {
    const comment = this.commentText().trim();
    if (!comment || this.submittingComment()) return;
    this.submittingComment.set(true);
    this.applicationService.addAsesorComment(this.applicationId(), comment).subscribe({
      next: () => {
        this.submittingComment.set(false);
        this.commentText.set('');
        this.snackBar.open('Comentario agregado', 'OK', { duration: 2500 });
        this.resource.reload();
      },
      error: (err: HttpErrorResponse) => {
        this.submittingComment.set(false);
        this.snackBar.open(err?.error?.message ?? 'Error al comentar', 'Cerrar', { duration: 4000 });
      },
    });
  }

  submitReview(action: 'correction' | 'approve' | 'reject'): void {
    if (this.submittingReview()) return;
    const comment = this.reviewComment().trim();
    if ((action === 'correction' || action === 'reject') && !comment) {
      this.snackBar.open('Se requiere un comentario para esta acción', 'Cerrar', { duration: 3000 });
      return;
    }
    this.submittingReview.set(action);
    const file = this.reviewFile() ?? undefined;
    this.applicationService.reviewAnteproyecto(this.applicationId(), action, comment || undefined, file).subscribe({
      next: () => {
        this.submittingReview.set(null);
        this.reviewComment.set('');
        this.reviewFile.set(null);
        const messages = { correction: 'Corrección solicitada', approve: 'Visto bueno registrado', reject: 'Anteproyecto rechazado' };
        this.snackBar.open(messages[action], 'OK', { duration: 3000 });
        this.resource.reload();
      },
      error: (err: HttpErrorResponse) => {
        this.submittingReview.set(null);
        this.snackBar.open(err?.error?.message ?? 'Error al procesar la revisión', 'Cerrar', { duration: 4000 });
      },
    });
  }

  /** Documento opcional adjunto a la revisión del jurado — cualquier tipo de archivo. */
  onReviewFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.reviewFileError.set(null);
    this.reviewFile.set(file);
  }

  clearReviewFile(): void {
    this.reviewFile.set(null);
    this.reviewFileError.set(null);
  }

  submitExtendDeadline(): void {
    if (this.submittingExtend()) return;
    this.submittingExtend.set(true);
    this.applicationService.extendAnteproyectoDeadline(
      this.applicationId(), this.extendTarget(), this.extendDays(), this.extendReason() || undefined,
    ).subscribe({
      next: () => {
        this.submittingExtend.set(false);
        this.showExtendForm.set(false);
        this.extendReason.set('');
        this.snackBar.open('Plazo extendido', 'OK', { duration: 3000 });
        this.resource.reload();
      },
      error: (err: HttpErrorResponse) => {
        this.submittingExtend.set(false);
        this.snackBar.open(err?.error?.message ?? 'Error al extender el plazo', 'Cerrar', { duration: 4000 });
      },
    });
  }
}
