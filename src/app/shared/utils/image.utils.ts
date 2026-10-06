import { environment } from '../../../environments/environment';

/**
 * Normaliza cualquier URL de imagen para garantizar que apunte al host/gateway correcto.
 * Resuelve rutas relativas como `/api/v1/storage/...` en la URL completa del API Gateway.
 */
export function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return null;
  }

  const trimmed = url.trim();

  // Si ya es absoluta (http/https) o es data/blob URI, retornarla directamente
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  // Si es una ruta relativa que empieza por /api/v1/... o /storage/...
  const apiBase = environment.apiUrl.replace(/\/api\/v1\/?$/, '');
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${apiBase}${cleanPath}`;
}
