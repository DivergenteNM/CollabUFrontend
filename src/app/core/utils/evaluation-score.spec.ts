import { describe, it, expect } from 'vitest';
import { formatStars, scoreToStars, scoreTone } from './evaluation-score';

describe('evaluation-score', () => {
  it('convierte 0-100 a 0-5', () => {
    expect(scoreToStars(100)).toBe(5);
    expect(scoreToStars(80)).toBe(4);
    expect(scoreToStars(0)).toBe(0);
  });

  it('acepta strings (las columnas decimal llegan como texto)', () => {
    expect(scoreToStars('86.00')).toBeCloseTo(4.3, 5);
    expect(formatStars('86.00')).toBe('4.3');
  });

  it('sin nota o valor inválido → null / "—"', () => {
    expect(scoreToStars(null)).toBeNull();
    expect(scoreToStars(undefined)).toBeNull();
    expect(scoreToStars('')).toBeNull();
    expect(scoreToStars('abc')).toBeNull();
    expect(formatStars(null)).toBe('—');
  });

  it('una nota guardada en escala 1-5 por error se nota (0.2/5), no se oculta', () => {
    // Regresión del seed: 4 guardado como "4" daba 0.2/5; la conversión no debe "adivinar" la escala.
    expect(formatStars(4)).toBe('0.2');
  });

  it('tono por rango', () => {
    expect(scoreTone(90)).toBe('good');
    expect(scoreTone(60)).toBe('ok');
    expect(scoreTone(20)).toBe('low');
  });
});
