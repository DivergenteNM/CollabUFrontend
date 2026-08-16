import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

/**
 * En el modelo real las evaluaciones no las crea el usuario final:
 *   - `admin` / facultad emiten las evaluaciones vía el ciclo de cierre.
 *   - Los sujetos evaluados / evaluadores llenan las que ya existen.
 *
 * Este componente se mantiene por retrocompatibilidad de la ruta
 * `/my-evaluations/create` pero informa al usuario y redirige. Si se
 * requiere en el futuro un flujo manual (p. ej. autoevaluación libre),
 * se implementa aquí usando `EvaluationService.create()` con el DTO real.
 */
@Component({
  selector: 'app-evaluation-create',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatButtonModule, MatCardModule],
  template: `
    <div class="ec">
      <mat-card>
        <mat-card-content>
          <mat-icon>info</mat-icon>
          <h2>Las evaluaciones se crean automáticamente</h2>
          <p>
            Cuando un proyecto entra en la etapa de cierre, el sistema genera
            las evaluaciones pendientes para cada participante (estudiante,
            empresa, asesor). Puedes verlas y completarlas desde
            <strong>"Evaluaciones"</strong> en el menú lateral.
          </p>
          <div class="ec__actions">
            <button mat-flat-button color="primary" (click)="router.navigate(['/my-evaluations'])">
              <mat-icon>list_alt</mat-icon> Ver mis evaluaciones
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .ec { max-width: 600px; margin: 40px auto; padding: 24px; }
    mat-card-content {
      text-align: center;
      padding: 32px !important;
      mat-icon { font-size: 48px; width: 48px; height: 48px; color: var(--mat-sys-primary); }
      h2 { margin: 12px 0 8px; font-size: 1.25rem; }
      p { color: var(--text-secondary); font-size: 0.9375rem; line-height: 1.5; }
    }
    .ec__actions { margin-top: 20px; }
  `],
})
export class EvaluationCreateComponent implements OnInit {
  readonly router = inject(Router);
  ngOnInit(): void {
    // Redirige tras 3s si el usuario no interactúa — evita quedar en un
    // callejón sin salida al navegar por accidente a /my-evaluations/create.
    setTimeout(() => {
      if (this.router.url.endsWith('/create')) {
        this.router.navigate(['/my-evaluations']);
      }
    }, 3000);
  }
}
