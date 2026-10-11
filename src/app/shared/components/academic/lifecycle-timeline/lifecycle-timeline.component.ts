import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProjectStage, ContextRole } from '../../../../features/applications/services/application.service';

interface StageNode {
  key: ProjectStage;
  label: string;
  icon: string;
}

const STAGES: StageNode[] = [
  { key: 'application',          label: 'Postulación',     icon: 'send' },
  { key: 'selection',            label: 'Selección',       icon: 'how_to_reg' },
  { key: 'academic_assignment',  label: 'Asignación',      icon: 'person_add' },
  { key: 'anteproyecto',        label: 'Anteproyecto',    icon: 'menu_book' },
  { key: 'documents',           label: 'Documentos',      icon: 'description' },
  { key: 'agreement',           label: 'Acuerdo',         icon: 'handshake' },
  { key: 'development',         label: 'Desarrollo',      icon: 'engineering' },
  { key: 'closure',             label: 'Cierre',          icon: 'flag' },
];

const ACTOR_LABELS: Record<string, string> = {
  student: 'Estudiante',
  company: 'Empresa',
  asesor: 'Asesor',
  jurado_anteproyecto: 'Jurado',
  jurado_final: 'Jurado final',
  admin: 'Facultad',
};

@Component({
  selector: 'app-lifecycle-timeline',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatTooltipModule],
  template: `
    <div class="lifecycle" role="progressbar"
         [attr.aria-valuenow]="currentIndex()"
         [attr.aria-valuemax]="stages.length - 1">
      @for (stage of stages; track stage.key; let i = $index; let last = $last) {
        <div class="lifecycle__step"
             [class.lifecycle__step--completed]="i < currentIndex()"
             [class.lifecycle__step--active]="i === currentIndex()"
             [class.lifecycle__step--future]="i > currentIndex()"
             [class.lifecycle__step--terminal]="isTerminal() && i === currentIndex()"
             [matTooltip]="stage.label">
          <div class="lifecycle__circle">
            <mat-icon>
              @if (i < currentIndex()) { check }
              @else if (isTerminal() && i === currentIndex()) {
                {{ terminalIcon() }}
              }
              @else { {{ stage.icon }} }
            </mat-icon>
          </div>
          <span class="lifecycle__label">{{ stage.label }}</span>
          @if (i === currentIndex() && waitingOn()) {
            <span class="lifecycle__actor">{{ actorLabel(waitingOn()!) }}</span>
          }
        </div>
        @if (!last) {
          <div class="lifecycle__line"
               [class.lifecycle__line--filled]="i < currentIndex()">
          </div>
        }
      }
    </div>
  `,
  styles: [`
    :host { display: block; overflow-x: auto; }
    .lifecycle {
      display: flex; align-items: flex-start;
      min-width: 680px; padding: 6px 0;
    }
    .lifecycle__step {
      display: flex; flex-direction: column; align-items: center;
      gap: 6px; flex-shrink: 0; min-width: 80px;
    }
    .lifecycle__circle {
      width: 36px; height: 36px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      border: 2px solid var(--border-color, #d3ddd4);
      background: var(--bg-card, #ffffff);
      transition: all 200ms ease;
    }
    .lifecycle__circle mat-icon {
      font-size: 18px; width: 18px; height: 18px;
      color: var(--text-tertiary, #6e7d70);
    }
    .lifecycle__step--completed .lifecycle__circle {
      background: var(--color-primary, #388e53);
      border-color: var(--color-primary, #388e53);
    }
    .lifecycle__step--completed .lifecycle__circle mat-icon {
      color: #ffffff;
    }
    .lifecycle__step--active .lifecycle__circle {
      border-color: var(--color-primary, #388e53);
      background: var(--color-primary-50, #eef7f0);
      box-shadow: 0 0 0 4px rgba(56, 142, 83, 0.18);
    }
    .lifecycle__step--active .lifecycle__circle mat-icon {
      color: var(--color-primary-700, #245c36);
    }
    .lifecycle__step--terminal .lifecycle__circle {
      border-color: var(--color-error, #c93b3b);
      background: var(--color-error-bg, #fdf0f0);
    }
    .lifecycle__step--terminal .lifecycle__circle mat-icon {
      color: var(--color-error, #c93b3b);
    }
    .lifecycle__label {
      font-size: 0.75rem; color: var(--text-secondary, #4a584c);
      text-align: center; max-width: 80px; line-height: 1.25;
      font-weight: 500;
    }
    .lifecycle__step--active .lifecycle__label {
      color: var(--color-primary-700, #245c36); font-weight: 700;
    }
    .lifecycle__actor {
      font-size: 0.6875rem; color: var(--color-accent-700, #1f5374);
      background: var(--color-accent-50, #eff6fb);
      padding: 1px 6px; border-radius: 8px;
      text-align: center; font-weight: 600;
    }
    .lifecycle__line {
      flex: 1; height: 3px; min-width: 16px;
      border-radius: 2px;
      background: var(--border-color, #d3ddd4);
      margin-top: 17px; transition: background 200ms ease;
    }
    .lifecycle__line--filled { background: var(--color-primary, #388e53); }
  `],
})
export class LifecycleTimelineComponent {
  readonly currentStage = input.required<ProjectStage>();
  readonly completedStages = input<string[]>([]);
  readonly waitingOn = input<ContextRole | null>(null);

  readonly stages = STAGES;

  readonly isTerminal = computed(() => {
    const s = this.currentStage();
    return s === 'completed' || s === 'closed';
  });

  readonly terminalIcon = computed(() =>
    this.currentStage() === 'completed' ? 'school' : 'block',
  );

  readonly currentIndex = computed(() => {
    const current = this.currentStage();
    if (current === 'completed') return STAGES.length;
    if (current === 'closed') return STAGES.length;
    const idx = STAGES.findIndex((s) => s.key === current);
    return idx >= 0 ? idx : 0;
  });

  actorLabel(role: ContextRole): string {
    return ACTOR_LABELS[role] ?? role;
  }
}
