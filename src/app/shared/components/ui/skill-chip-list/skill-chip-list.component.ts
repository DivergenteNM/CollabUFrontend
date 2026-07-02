import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-skill-chip-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatChipsModule, MatIconModule, MatTooltipModule],
  host: { 'class': 'skill-chip-list' },
  templateUrl: './skill-chip-list.component.html',
  styleUrl: './skill-chip-list.component.scss',
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
