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
      min-width: 600px; padding: 4px 0;
    }
    .lifecycle__step {
      display: flex; flex-direction: column; align-items: center;
      gap: 4px; flex-shrink: 0; min-width: 72px;
    }
    .lifecycle__circle {
      width: 32px; height: 32px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      border: 2px solid var(--mat-sys-outline-variant);
      background: var(--mat-sys-surface);
      transition: all 200ms ease;
    }
    .lifecycle__circle mat-icon {
      font-size: 16px; width: 16px; height: 16px;
      color: var(--mat-sys-outline);
    }
    .lifecycle__step--completed .lifecycle__circle {
      background: var(--mat-sys-primary);
      border-color: var(--mat-sys-primary);
    }
    .lifecycle__step--completed .lifecycle__circle mat-icon {
      color: var(--mat-sys-on-primary);
    }
    .lifecycle__step--active .lifecycle__circle {
      border-color: var(--mat-sys-primary);
      background: color-mix(in srgb, var(--mat-sys-primary) 12%, transparent);
    }
    .lifecycle__step--active .lifecycle__circle mat-icon {
      color: var(--mat-sys-primary);
    }
    .lifecycle__step--terminal .lifecycle__circle {
      border-color: var(--mat-sys-error);
      background: color-mix(in srgb, var(--mat-sys-error) 12%, transparent);
    }
    .lifecycle__step--terminal .lifecycle__circle mat-icon {
      color: var(--mat-sys-error);
    }
    .lifecycle__label {
      font-size: .625rem; color: var(--mat-sys-on-surface-variant);
      text-align: center; max-width: 72px; line-height: 1.2;
    }
    .lifecycle__step--active .lifecycle__label {
      color: var(--mat-sys-primary); font-weight: 600;
    }
    .lifecycle__actor {
      font-size: .5625rem; color: var(--mat-sys-outline);
      text-align: center;
    }
    .lifecycle__line {
      flex: 1; height: 2px; min-width: 16px;
      background: var(--mat-sys-outline-variant);
      margin-top: 16px; transition: background 200ms ease;
    }
    .lifecycle__line--filled { background: var(--mat-sys-primary); }
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
