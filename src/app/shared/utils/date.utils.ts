import { format, formatDistanceToNow, isPast, differenceInDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Format a date string or Date to a human-readable format.
 */
export function formatDate(value: string | Date, pattern: string = 'd MMM yyyy'): string {
  const date = typeof value === 'string' ? parseISO(value) : value;
  return format(date, pattern, { locale: es });
}

/**
 * Get a relative time string like "hace 3 días".
 */
export function relativeTime(value: string | Date): string {
  const date = typeof value === 'string' ? parseISO(value) : value;
  return formatDistanceToNow(date, { addSuffix: true, locale: es });
}

/**
 * Check if a date/time is in the past (expired).
 */
export function isExpired(value: string | Date): boolean {
  const date = typeof value === 'string' ? parseISO(value) : value;
  return isPast(date);
}

/**
 * Calculate the number of days until a given date (negative if past).
 */
export function daysUntil(value: string | Date): number {
  const date = typeof value === 'string' ? parseISO(value) : value;
  return differenceInDays(date, new Date());
}
