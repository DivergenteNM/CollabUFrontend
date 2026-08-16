import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProjectParticipant } from '../../../../features/applications/services/application.service';

const ROLE_LABELS: Record<string, string> = {
  student: 'Estudiante',
  company: 'Empresa',
  asesor: 'Asesor',
  jurado_anteproyecto: 'Jurado de anteproyecto',
  jurado_final: 'Jurado final',
  admin: 'Administrador',
};

const STATUS_ICONS: Record<string, string> = {
  pending_acceptance: 'hourglass_top',
  accepted: 'check_circle',
  active: 'check_circle',
  declined: 'cancel',
  disconnected: 'link_off',
  replaced: 'swap_horiz',
  completed: 'task_alt',
};

@Component({
  selector: 'app-people-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatIconModule, MatButtonModule, MatTooltipModule],
  template: `
    <mat-card class="people">
      <mat-card-header>
        <mat-card-title>Participantes</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        @for (p of participants(); track p.userId) {
          <div class="people__row">
            <div class="people__avatar">
              @if (p.avatarUrl) {
                <img [src]="p.avatarUrl" [alt]="p.fullName ?? 'Avatar'" />
              } @else {
                <mat-icon>person</mat-icon>
              }
            </div>
            <div class="people__info">
              <span class="people__name">{{ p.fullName ?? 'Sin nombre' }}</span>
              <span class="people__role">
                {{ roleLabel(p.role) }}
                @if (p.assignmentStatus) {
                  <mat-icon class="people__status-icon"
                    [matTooltip]="p.assignmentStatus"
                    [class]="'people__status--' + p.assignmentStatus">
                    {{ statusIcon(p.assignmentStatus) }}
                  </mat-icon>
                }
              </span>
            </div>
            @if (canChat()) {
              <button mat-icon-button
                      matTooltip="Enviar mensaje"
                      (click)="chatRequested.emit(p.userId)">
                <mat-icon>chat</mat-icon>
              </button>
            }
          </div>
        }
        @if (participants().length === 0) {
          <p class="people__empty">Sin participantes asignados</p>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .people mat-card-content { padding-top: 8px; }
    .people__row {
      display: flex; align-items: center; gap: 12px;
      padding: 8px 0; border-bottom: 1px solid var(--border-color);
    }
    .people__row:last-of-type { border-bottom: none; }
    .people__avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: var(--bg-tertiary); display: flex;
      align-items: center; justify-content: center;
      overflow: hidden; flex-shrink: 0;
    }
    .people__avatar img { width: 100%; height: 100%; object-fit: cover; }
    .people__avatar mat-icon { font-size: 20px; color: var(--text-secondary); }
    .people__info { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .people__name {
      font-size: .8125rem; font-weight: 500;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .people__role {
      font-size: .6875rem; color: var(--text-secondary);
      display: flex; align-items: center; gap: 4px;
    }
    .people__status-icon { font-size: 14px; width: 14px; height: 14px; }
    .people__status--accepted, .people__status--active { color: var(--color-success); }
    .people__status--pending_acceptance { color: var(--color-warning); }
    .people__status--declined, .people__status--disconnected { color: var(--color-error); }
    .people__empty {
      text-align: center; color: var(--text-secondary);
      font-size: .8125rem; padding: 16px 0;
    }
  `],
})
export class PeopleCardComponent {
  readonly participants = input.required<ProjectParticipant[]>();
  readonly canChat = input(false);
  readonly chatRequested = output<string>();

  roleLabel(role: string): string {
    return ROLE_LABELS[role] ?? role;
  }

  statusIcon(status: string): string {
    return STATUS_ICONS[status] ?? 'help';
  }
}
