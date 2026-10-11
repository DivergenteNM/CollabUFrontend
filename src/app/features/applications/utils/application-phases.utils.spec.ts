import { describe, it, expect } from 'vitest';
import { ApplicationStatus } from '../../../core/enums';
import {
  resolveApplicationPhase,
  getStepStatus,
} from './application-phases.utils';
import { MACRO_PHASES_CONFIG } from '../config/application-phases.config';

describe('application-phases.utils', () => {
  describe('resolveApplicationPhase', () => {
    it('debe resolver fase RECRUITMENT para status PENDING', () => {
      const res = resolveApplicationPhase(ApplicationStatus.PENDING);
      expect(res.currentPhase.id).toBe('RECRUITMENT');
      expect(res.currentPhaseIndex).toBe(1);
      expect(res.activeStepIndex).toBe(0);
      expect(res.isTerminal).toBe(false);
      expect(res.ctaConfig.label).toBe('Ver Seguimiento');
    });

    it('debe resolver fase RECRUITMENT con CTA de entrevista para status INTERVIEW', () => {
      const res = resolveApplicationPhase(ApplicationStatus.INTERVIEW);
      expect(res.currentPhase.id).toBe('RECRUITMENT');
      expect(res.activeStepIndex).toBe(3);
      expect(res.ctaConfig.label).toBe('Ver Entrevista');
      expect(res.ctaConfig.icon).toBe('event');
    });

    it('debe priorizar CTA de entrevista si hasUpcomingInterview es true', () => {
      const res = resolveApplicationPhase(ApplicationStatus.UNDER_REVIEW, true);
      expect(res.ctaConfig.label).toBe('Ver Entrevista');
    });

    it('debe resolver fase ACADEMIC para status ACCEPTED', () => {
      const res = resolveApplicationPhase(ApplicationStatus.ACCEPTED);
      expect(res.currentPhase.id).toBe('ACADEMIC');
      expect(res.currentPhaseIndex).toBe(2);
      expect(res.activeStepIndex).toBe(0);
      expect(res.isPhaseCompleted(1)).toBe(true);
      expect(res.ctaConfig.label).toBe('Gestión Académica');
    });

    it('debe resolver fase ACADEMIC para status PENDING_SUPERVISOR', () => {
      const res = resolveApplicationPhase(ApplicationStatus.PENDING_SUPERVISOR);
      expect(res.currentPhase.id).toBe('ACADEMIC');
      expect(res.currentPhaseIndex).toBe(2);
      expect(res.activeStepIndex).toBe(1);
      expect(res.ctaConfig.label).toBe('Gestión Académica');
    });

    it('debe resolver fase WORKSPACE para status IN_PROGRESS', () => {
      const res = resolveApplicationPhase(ApplicationStatus.IN_PROGRESS);
      expect(res.currentPhase.id).toBe('WORKSPACE');
      expect(res.currentPhaseIndex).toBe(3);
      expect(res.activeStepIndex).toBe(0);
      expect(res.isPhaseCompleted(1)).toBe(true);
      expect(res.isPhaseCompleted(2)).toBe(true);
      expect(res.ctaConfig.label).toBe('Ir al Workspace');
    });

    it('debe resolver fase WORKSPACE para status COMPLETED', () => {
      const res = resolveApplicationPhase(ApplicationStatus.COMPLETED);
      expect(res.currentPhase.id).toBe('WORKSPACE');
      expect(res.activeStepIndex).toBe(1);
      expect(res.ctaConfig.label).toBe('Ir al Workspace');
    });

    it('debe marcar isTerminal en true para status REJECTED', () => {
      const res = resolveApplicationPhase(ApplicationStatus.REJECTED);
      expect(res.isTerminal).toBe(true);
      expect(res.terminalLabel).toBe('Postulación no seleccionada');
      expect(res.ctaConfig.label).toBe('Ver Detalle');
    });

    it('debe marcar isTerminal en true para status WITHDRAWN', () => {
      const res = resolveApplicationPhase(ApplicationStatus.WITHDRAWN);
      expect(res.isTerminal).toBe(true);
      expect(res.terminalLabel).toBe('Postulación retirada');
    });
  });

  describe('getStepStatus', () => {
    it('marca todos los pasos completados si la fase visualizada es anterior a la actual', () => {
      const res = resolveApplicationPhase(ApplicationStatus.IN_PROGRESS); // WORKSPACE (orden 3)
      const recruitmentPhase = MACRO_PHASES_CONFIG[0]; // orden 1

      const step0 = getStepStatus(recruitmentPhase, 0, res);
      const step3 = getStepStatus(recruitmentPhase, 3, res);
      expect(step0).toBe('completed');
      expect(step3).toBe('completed');
    });

    it('marca paso activo y futuros correctamente dentro de la fase en curso', () => {
      const res = resolveApplicationPhase(ApplicationStatus.SHORTLISTED); // RECRUITMENT (orden 1), step 2
      const recruitmentPhase = MACRO_PHASES_CONFIG[0];

      expect(getStepStatus(recruitmentPhase, 0, res)).toBe('completed');
      expect(getStepStatus(recruitmentPhase, 1, res)).toBe('completed');
      expect(getStepStatus(recruitmentPhase, 2, res)).toBe('active');
      expect(getStepStatus(recruitmentPhase, 3, res)).toBe('future');
    });
  });
});
