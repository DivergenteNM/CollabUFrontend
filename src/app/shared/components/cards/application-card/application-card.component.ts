import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { DatePipe } from '@angular/common';
import { Application } from '../../../../core/models';
import { ApplicationStatus } from '../../../../core/enums';
import { StatusBadgeComponent } from '../../ui/status-badge/status-badge.component';
import { ApplicationProgressStepperComponent } from '../../ui/application-progress-stepper/application-progress-stepper.component';

@Component({
  selector: 'app-application-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule, MatIconModule, MatButtonModule, MatMenuModule, DatePipe,
    StatusBadgeComponent, ApplicationProgressStepperComponent,
  ],
  host: { 'class': 'application-card' },
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>
          @if (viewMode() === 'student') {
            {{ application().project?.title || 'Proyecto' }}
          } @else {
            Estudiante #{{ application().student?.studentCode || application().studentId }}
          }
        </mat-card-title>
        <mat-card-subtitle>
          <app-status-badge [status]="application().status" size="sm" />
          <span class="application-card__date">
            <mat-icon>calendar_today</mat-icon>
            {{ application().appliedAt | date:'d MMM yyyy' }}
          </span>
        </mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <app-application-progress-stepper [currentStatus]="application().status" />

        @if (application().coverLetter) {
          <p class="application-card__cover">{{ application().coverLetter }}</p>
        }

        @if (application().matchScore) {
          <div class="application-card__score">
            <mat-icon>star</mat-icon>
            Match: {{ application().matchScore }}%
          </div>
        }
      </mat-card-content>

      <mat-card-actions align="end">
        <button mat-button (click)="viewDetail.emit(application().id)">
          <mat-icon>visibility</mat-icon> Ver Detalle
        </button>

        @if (viewMode() === 'company' && canChangeStatus()) {
          <button mat-flat-button [matMenuTriggerFor]="statusMenu">
            <mat-icon>edit</mat-icon> Cambiar Estado
          </button>
          <mat-menu #statusMenu="matMenu">
            @for (action of availableActions(); track action.status) {
              <button mat-menu-item (click)="changeStatus.emit({ id: application().id, status: action.status })">
                <mat-icon>{{ action.icon }}</mat-icon>
                {{ action.label }}
              </button>
            }
          </mat-menu>
        }
      </mat-card-actions>
    </mat-card>
  `,
  styles: `
    :host {
      display: block;
    }

    mat-card-subtitle {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .application-card__date {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.8125rem;
      color: var(--mat-sys-on-surface-variant);

      mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }
    }

    .application-card__cover {
      font-size: 0.875rem;
      color: var(--mat-sys-on-surface-variant);
      line-height: 1.5;
      margin-top: 12px;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .application-card__score {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      margin-top: 12px;
      font-weight: 600;
      color: var(--mat-sys-primary);

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: #ffc107;
      }
    }
  `,
})
export class ApplicationCardComponent {
  readonly application = input.required<Application>();
  readonly viewMode = input<'student' | 'company'>('student');
  readonly viewDetail = output<string>();
  readonly changeStatus = output<{ id: string; status: ApplicationStatus }>();

  readonly canChangeStatus = computed(() => {
    const s = this.application().status;
    return s !== ApplicationStatus.COMPLETED &&
           s !== ApplicationStatus.CANCELLED &&
           s !== ApplicationStatus.WITHDRAWN;
  });

  readonly availableActions = computed(() => {
    const s = this.application().status;
    const actions: { status: ApplicationStatus; label: string; icon: string }[] = [];
    switch (s) {
      case ApplicationStatus.PENDING:
        actions.push(
          { status: ApplicationStatus.UNDER_REVIEW, label: 'Revisar', icon: 'visibility' },
          { status: ApplicationStatus.REJECTED, label: 'Rechazar', icon: 'cancel' },
        );
        break;
      case ApplicationStatus.UNDER_REVIEW:
        actions.push(
          { status: ApplicationStatus.INTERVIEW, label: 'Entrevistar', icon: 'event' },
          { status: ApplicationStatus.ACCEPTED, label: 'Aceptar', icon: 'check_circle' },
          { status: ApplicationStatus.REJECTED, label: 'Rechazar', icon: 'cancel' },
        );
        break;
      case ApplicationStatus.INTERVIEW:
        actions.push(
          { status: ApplicationStatus.ACCEPTED, label: 'Aceptar', icon: 'check_circle' },
          { status: ApplicationStatus.REJECTED, label: 'Rechazar', icon: 'cancel' },
        );
        break;
      case ApplicationStatus.ACCEPTED:
        actions.push(
          { status: ApplicationStatus.IN_PROGRESS, label: 'Iniciar', icon: 'play_circle' },
        );
        break;
      case ApplicationStatus.IN_PROGRESS:
        actions.push(
          { status: ApplicationStatus.COMPLETED, label: 'Completar', icon: 'task_alt' },
        );
        break;
    }
    return actions;
  });
}
