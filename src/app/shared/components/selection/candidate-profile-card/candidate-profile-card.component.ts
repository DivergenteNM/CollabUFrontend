import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { StudentProfile } from '../../../../core/models/student.model';

/**
 * Perfil del candidato para que la empresa lo evalúe sin salir del workspace.
 * Solo se renderiza cuando el viewer tiene `view_candidate` (empresa/admin);
 * el estudiante nunca ve esta tarjeta sobre sí mismo aquí.
 */
@Component({
  selector: 'app-candidate-profile-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatCardModule, MatIconModule, MatButtonModule, MatChipsModule],
  templateUrl: './candidate-profile-card.component.html',
  styleUrl: './candidate-profile-card.component.scss',
})
export class CandidateProfileCardComponent {
  readonly student = input<StudentProfile | null>(null);
  readonly fullName = input<string | null>(null);
}
