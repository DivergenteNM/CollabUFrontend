/**
 * Las evaluaciones se guardan en escala 0-100 (calificación por criterio y nota global);
 * la interfaz las muestra en 0-5 estrellas. Esta es la ÚNICA conversión: antes estaba
 * repetida (lista, detalle, workspace, supervisión) y el seed la rompía sin que se notara.
 */
export const EVALUATION_SCORE_MAX = 100;
export const EVALUATION_STARS_MAX = 5;

/** 0-100 → 0-5 (número, o null si no hay nota). */
export function scoreToStars(score: number | string | null | undefined): number | null {
  if (score == null || score === '') return null;
  const value = Number(score);
  if (Number.isNaN(value)) return null;
  return value / (EVALUATION_SCORE_MAX / EVALUATION_STARS_MAX);
}

/** 0-100 → "4.3" (una decimal) o "—" si no hay nota. */
export function formatStars(score: number | string | null | undefined): string {
  const stars = scoreToStars(score);
  return stars == null ? '—' : stars.toFixed(1);
}

/** Color semántico de una barra por rango de la nota 0-100. */
export function scoreTone(score: number | string | null | undefined): 'good' | 'ok' | 'low' {
  const value = Number(score ?? 0);
  if (value >= 75) return 'good';
  if (value >= 50) return 'ok';
  return 'low';
}
