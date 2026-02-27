import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-assigned-students-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="placeholder">
      <h1>Mis Estudiantes</h1>
      <p>Lista de estudiantes asignados (próxima fase).</p>
    </div>
  `,
  styles: `
    .placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      color: var(--mat-sys-on-surface-variant);
    }
  `,
})
export class AssignedStudentsListComponent {}
