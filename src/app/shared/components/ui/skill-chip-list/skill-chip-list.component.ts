import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-skill-chip-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatChipsModule, MatIconModule, MatTooltipModule],
  host: { 'class': 'skill-chip-list' },
  template: `
    <mat-chip-set>
      @for (skill of visibleSkills(); track skill) {
        <mat-chip [removable]="removable()" (removed)="removed.emit(skill)">
          {{ skill }}
          @if (removable()) {
            <mat-icon matChipRemove>cancel</mat-icon>
          }
        </mat-chip>
      }
      @if (hiddenCount() > 0) {
        <mat-chip
          class="more-chip"
          [matTooltip]="hiddenSkills().join(', ')">
          +{{ hiddenCount() }} más
        </mat-chip>
      }
    </mat-chip-set>
  `,
  styles: `
    :host {
      display: block;
    }

    .more-chip {
      font-style: italic;
      opacity: 0.8;
    }
  `,
})
export class SkillChipListComponent {
  readonly skills = input.required<string[]>();
  readonly maxVisible = input<number>(4);
  readonly removable = input<boolean>(false);
  readonly removed = output<string>();

  readonly visibleSkills = computed(() => this.skills().slice(0, this.maxVisible()));
  readonly hiddenSkills = computed(() => this.skills().slice(this.maxVisible()));
  readonly hiddenCount = computed(() => Math.max(0, this.skills().length - this.maxVisible()));
}
