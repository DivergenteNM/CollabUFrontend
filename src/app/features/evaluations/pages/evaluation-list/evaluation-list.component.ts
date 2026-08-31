import {
  Component, ChangeDetectionStrategy, inject, signal, computed,
} from '@angular/core';
import { Router } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DatePipe } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';

import { Evaluation } from '../../../../core/models';
import { EvaluationService, EvalPaginated } from '../../services/evaluation.service';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../../shared/components/ui/skeleton/skeleton.component';
import { PaginatorComponent } from '../../../../shared/components/ui/paginator/paginator.component';

/**
 * Vista principal del ciclo de evaluación:
 *   Tab 0 — pendientes por completar (soy evaluador y status=pending/in_progress)
 *   Tab 1 — que yo ya envié (soy evaluador, status=completed)
 *   Tab 2 — recibidas sobre mí (soy evaluado, status=completed)
 *
 * Se separa "pendientes" de "enviadas" porque son estados accionables muy
 * distintos: las pendientes necesitan que el usuario haga algo; las enviadas
 * son solo referencia histórica.
 */
@Component({
  selector: 'app-evaluation-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    MatTabsModule, MatButtonModule, MatIconModule, MatCardModule, MatChipsModule,
    EmptyStateComponent, SkeletonComponent, PaginatorComponent,
  ],
  templateUrl: './evaluation-list.component.html',
  styleUrl: './evaluation-list.component.scss',
})
export class EvaluationListComponent {
  readonly router = inject(Router);
  private readonly evaluationService = inject(EvaluationService);

  readonly activeTab = signal(0);
  readonly pendingPage = signal(1);
  readonly sentPage = signal(1);
  readonly receivedPage = signal(1);

  private empty = (): EvalPaginated<Evaluation> => ({ data: [], total: 0, page: 1, limit: 10 });

  readonly pendingResource = rxResource({
    params: () => this.pendingPage(),
    stream: ({ params: page }) =>
      this.evaluationService.getAsEvaluator({ page, limit: 10, status: 'pending' })
        .pipe(catchError(() => of(this.empty()))),
  });

  readonly sentResource = rxResource({
    params: () => this.sentPage(),
    stream: ({ params: page }) =>
      this.evaluationService.getAsEvaluator({ page, limit: 10, status: 'completed' })
        .pipe(catchError(() => of(this.empty()))),
  });

  readonly receivedResource = rxResource({
    params: () => this.receivedPage(),
    stream: ({ params: page }) =>
      this.evaluationService.getAsEvaluated({ page, limit: 10, status: 'completed' })
        .pipe(catchError(() => of(this.empty()))),
  });

  readonly pending = computed(() => this.pendingResource.value()?.data ?? []);
  readonly pendingTotal = computed(() => this.pendingResource.value()?.total ?? 0);
  readonly sent = computed(() => this.sentResource.value()?.data ?? []);
  readonly sentTotal = computed(() => this.sentResource.value()?.total ?? 0);
  readonly received = computed(() => this.receivedResource.value()?.data ?? []);
  readonly receivedTotal = computed(() => this.receivedResource.value()?.total ?? 0);

  readonly typeLabel: Record<string, string> = {
    company_evaluates_student: 'Empresa → Estudiante',
    student_evaluates_company: 'Estudiante → Empresa',
    supervisor_evaluates_student: 'Asesor → Estudiante',
    student_evaluates_supervisor: 'Estudiante → Asesor',
    self_evaluation: 'Autoevaluación',
  };

  readonly statusChipClass: Record<string, string> = {
    pending: 'chip-pending',
    in_progress: 'chip-progress',
    completed: 'chip-done',
    expired: 'chip-expired',
  };

  readonly statusLabel: Record<string, string> = {
    pending: 'Pendiente',
    in_progress: 'En progreso',
    completed: 'Completada',
    expired: 'Vencida',
  };

  scoreOutOf5(score: number | null): string {
    if (score == null) return '—';
    // Backend usa escala 0-100; se convierte a 5 estrellas para display.
    return (score / 20).toFixed(1);
  }

  openEvaluation(id: string): void {
    this.router.navigate(['/my-evaluations', id]);
  }

  onTabChange(index: number): void {
    this.activeTab.set(index);
  }
}
