import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { DatePipe } from '@angular/common';
import { Project } from '../../../../core/models';
import { MatchScoreBarComponent } from '../../ui/match-score-bar/match-score-bar.component';
import { StatusBadgeComponent } from '../../ui/status-badge/status-badge.component';

@Component({
  selector: 'app-project-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatIconModule, MatButtonModule, MatChipsModule, DatePipe, MatchScoreBarComponent, StatusBadgeComponent],
  host: { 'class': 'project-card' },
  templateUrl: './project-card.component.html',
  styleUrl: './project-card.component.scss',
})
export class ProjectCardComponent {
  readonly project = input.required<Project>();
  readonly matchScore = input<number>();
  readonly showActions = input<boolean>(true);
  readonly canApply = input<boolean>(true);
  readonly viewDetail = output<string>();
  readonly apply = output<string>();

  readonly projectTypeLabel = computed(() => {
    const map: Record<string, string> = {
      professional_practice: 'Práctica Profesional',
      social_service: 'Servicio Social',
      research: 'Investigación',
      internship: 'Pasantía',
    };
    return map[this.project().projectType] || this.project().projectType;
  });
}
