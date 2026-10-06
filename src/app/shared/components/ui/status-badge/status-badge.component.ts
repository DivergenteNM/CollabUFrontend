import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { StatusDomain, statusOf, statusColors } from '../../../../core/status/status-registry';

@Component({
  selector: 'app-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  host: {
    'class': 'status-badge',
    '[class]': '"status-badge--" + size() + " status-badge--" + resolved().tone',
    '[style.--badge-color]': 'resolved().color',
    '[style.--badge-bg]': 'resolved().bg',
    '[style.--badge-border]': 'resolved().border',
    '[attr.aria-label]': '"Estado: " + resolved().label',
    '[attr.title]': 'resolved().description || ("Estado: " + resolved().label)',
  },
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.scss',
})
export class StatusBadgeComponent {
  readonly status = input.required<string>();
  readonly domain = input<StatusDomain>('application');
  readonly size = input<'sm' | 'md'>('md');

  readonly resolved = computed(() => {
    const cfg = statusOf(this.domain(), this.status());
    const colors = statusColors(cfg.tone);
    return { label: cfg.label, icon: cfg.icon, tone: cfg.tone, description: cfg.description, ...colors };
  });

  readonly statusConfig = this.resolved;
}
