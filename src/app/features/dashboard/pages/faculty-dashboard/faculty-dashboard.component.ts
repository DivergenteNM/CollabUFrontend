import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { httpResource } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { environment } from '../../../../../environments/environment';
import {
  FacultyService,
  EnrichedAssignment,
  SupervisorProfile,
} from '../../../faculty/services/faculty.service';
import { ToastService } from '../../../../core/services/toast.service';
import { NotificationsStore } from '../../../../state/notifications.store';
import { AuthStore } from '../../../../state/auth.store';
import { StatCardComponent } from '../../../../shared/components/ui/stat-card/stat-card.component';
import { StatusBadgeComponent } from '../../../../shared/components/ui/status-badge/status-badge.component';
import { SkeletonComponent } from '../../../../shared/components/ui/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state.component';
import { RelativeTimePipe, ImageUrlPipe } from '../../../../shared/pipes';

export type FacultyFilterTab = 'all' | 'active' | 'pending' | 'jurado' | 'completed';

@Component({
  selector: 'app-faculty-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    DatePipe,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressBarModule,
    StatCardComponent,
    StatusBadgeComponent,
    SkeletonComponent,
    EmptyStateComponent,
    RelativeTimePipe,
    ImageUrlPipe,
  ],
  templateUrl: './faculty-dashboard.component.html',
  styleUrl: './faculty-dashboard.component.scss',
})
export class FacultyDashboardComponent {
  readonly router = inject(Router);
  readonly authStore = inject(AuthStore);
  private readonly facultyService = inject(FacultyService);
  private readonly toastService = inject(ToastService);
  readonly notificationsStore = inject(NotificationsStore);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  // --- Filtro interactivo de estudiantes ---
  readonly activeFilter = signal<FacultyFilterTab>('all');
  readonly processingId = signal<string | null>(null);

  // --- Estado de carga y datos ---
  readonly isLoading = signal(true);
  readonly assignments = signal<EnrichedAssignment[]>([]);
  readonly totalCount = signal(0);

  // --- Perfil del docente / supervisor ---
  readonly supervisorProfileResource = httpResource<SupervisorProfile>(
    () => (this.isBrowser ? { url: `${environment.apiUrl}/admin/supervisors/me` } : undefined)
  );

  readonly supervisorProfile = computed(() => this.supervisorProfileResource.value() ?? null);

  readonly avatarUrl = computed(() => {
    return this.authStore.profile()?.avatarUrl || null;
  });

  readonly userInitials = computed(() => {
    const p = this.authStore.profile();
    if (p?.firstName && p?.lastName) {
      return `${p.firstName[0]}${p.lastName[0]}`.toUpperCase();
    }
    if (p?.firstName) {
      return p.firstName.slice(0, 2).toUpperCase();
    }
    return 'DO';
  });

  readonly greetingTime = computed(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return '¡Buenos días';
    if (hour >= 12 && hour < 19) return '¡Buenas tardes';
    return '¡Buenas noches';
  });

  readonly supervisorRoleLabel = computed(() => {
    const role = this.supervisorProfile()?.role;
    const map: Record<string, string> = {
      thesis_advisor: 'Asesor de Tesis / Grado',
      faculty_supervisor: 'Supervisor de Prácticas',
      academic_director: 'Director de Programa',
      internship_coordinator: 'Coordinador de Prácticas',
    };
    return (role && map[role]) || 'Docente Universitario';
  });

  // --- Contadores reactivos ---
  readonly pendingAcceptanceCount = computed(
    () => this.assignments().filter((a) => a.status === 'pending_acceptance').length
  );

  readonly activeCount = computed(
    () => this.assignments().filter((a) => a.status === 'active' || a.status === 'accepted').length
  );

  readonly completedCount = computed(
    () => this.assignments().filter((a) => a.status === 'completed').length
  );

  readonly juradoCount = computed(
    () =>
      this.assignments().filter(
        (a) => a.role === 'jurado_anteproyecto' || a.role === 'jurado_final'
      ).length
  );

  // --- Asignaciones filtradas por tab ---
  readonly filteredAssignments = computed(() => {
    const list = this.assignments();
    const filter = this.activeFilter();

    if (filter === 'all') return list;
    if (filter === 'active') {
      return list.filter((a) => a.status === 'active' || a.status === 'accepted');
    }
    if (filter === 'pending') {
      return list.filter((a) => a.status === 'pending_acceptance');
    }
    if (filter === 'jurado') {
      return list.filter(
        (a) => a.role === 'jurado_anteproyecto' || a.role === 'jurado_final'
      );
    }
    if (filter === 'completed') {
      return list.filter((a) => a.status === 'completed');
    }

    return list;
  });

  constructor() {
    if (this.isBrowser) {
      this.loadAssignments();
    }
  }

  loadAssignments(): void {
    this.isLoading.set(true);
    this.facultyService.getMyStudentsEnriched({ limit: 100 }).subscribe({
      next: (response) => {
        this.assignments.set(response.data || []);
        this.totalCount.set(response.total ?? (response.data ? response.data.length : 0));
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  setFilter(tab: FacultyFilterTab): void {
    this.activeFilter.set(tab);
  }

  navigateToStudent(applicationId: string): void {
    this.router.navigate(['/my-students', applicationId]);
  }

  acceptAssignment(assignment: EnrichedAssignment, event?: Event): void {
    if (event) event.stopPropagation();
    this.processingId.set(assignment.id);

    this.facultyService.acceptAssignment(assignment.id).subscribe({
      next: () => {
        this.toastService.success(`Asignación aceptada para ${assignment.studentName}`);
        this.processingId.set(null);
        this.loadAssignments();
      },
      error: () => {
        this.toastService.error('No se pudo aceptar la asignación');
        this.processingId.set(null);
      },
    });
  }

  declineAssignment(assignment: EnrichedAssignment, event?: Event): void {
    if (event) event.stopPropagation();
    const reason = prompt('Indica el motivo por el cual declinas esta asignación:');
    if (!reason || !reason.trim()) return;

    this.processingId.set(assignment.id);
    this.facultyService.declineAssignment(assignment.id, reason.trim()).subscribe({
      next: () => {
        this.toastService.info('Asignación declinada correctamente');
        this.processingId.set(null);
        this.loadAssignments();
      },
      error: () => {
        this.toastService.error('No se pudo declinar la asignación');
        this.processingId.set(null);
      },
    });
  }

  getRoleLabel(role: string): string {
    const map: Record<string, string> = {
      asesor: 'Asesor de Proyecto',
      jurado_anteproyecto: 'Jurado Anteproyecto',
      jurado_final: 'Jurado Sustentación',
    };
    return map[role] || role;
  }

  getRoleBadgeClass(role: string): string {
    if (role === 'asesor') return 'role-badge--asesor';
    if (role === 'jurado_anteproyecto') return 'role-badge--jurado-ap';
    return 'role-badge--jurado-fn';
  }

  getStudentInitials(name?: string): string {
    if (!name) return 'ES';
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
}