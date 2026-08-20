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
  templateUrl: './application-card.component.html',
  styleUrl: './application-card.component.scss',
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
           s !== ApplicationStatus.WITHDRAWN &&
           s !== ApplicationStatus.IN_PROGRESS &&
           s !== ApplicationStatus.REJECTED;
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
    }
    return actions;
  });
}
