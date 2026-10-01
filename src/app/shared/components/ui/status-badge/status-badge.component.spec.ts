import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { StatusBadgeComponent } from './status-badge.component';
import { ApplicationStatus } from '../../../../core/enums';

describe('StatusBadgeComponent — contrast & tokens', () => {
  it('resolves correct accessible tone and label for PENDING', () => {
    const fixture = TestBed.createComponent(StatusBadgeComponent);
    fixture.componentRef.setInput('status', ApplicationStatus.PENDING);
    fixture.componentRef.setInput('domain', 'application');
    fixture.detectChanges();

    const config = fixture.componentInstance.statusConfig();
    expect(config.label).toBe('Pendiente');
    expect(config.tone).toBe('warning');
    expect(config.color).toBe('var(--color-warning-text)');
    expect(config.bg).toBe('var(--color-warning-bg)');
    expect(config.border).toBe('var(--color-warning-border)');
  });

  it('resolves correct accessible tone and label for INTERVIEW (emerald)', () => {
    const fixture = TestBed.createComponent(StatusBadgeComponent);
    fixture.componentRef.setInput('status', ApplicationStatus.INTERVIEW);
    fixture.componentRef.setInput('domain', 'application');
    fixture.detectChanges();

    const config = fixture.componentInstance.statusConfig();
    expect(config.label).toBe('Entrevista');
    expect(config.tone).toBe('interview');
    expect(config.color).toBe('var(--color-success-text)');
    expect(config.bg).toBe('var(--color-success-bg)');
    expect(config.border).toBe('var(--color-success-border)');
  });

  it('resolves correct accessible tone and label for ACCEPTED', () => {
    const fixture = TestBed.createComponent(StatusBadgeComponent);
    fixture.componentRef.setInput('status', ApplicationStatus.ACCEPTED);
    fixture.componentRef.setInput('domain', 'application');
    fixture.detectChanges();

    const config = fixture.componentInstance.statusConfig();
    expect(config.label).toBe('Aceptada');
    expect(config.tone).toBe('success');
    expect(config.color).toBe('var(--color-success-text)');
    expect(config.bg).toBe('var(--color-success-bg)');
    expect(config.border).toBe('var(--color-success-border)');
  });
});
