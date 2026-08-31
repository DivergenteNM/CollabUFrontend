import { Page, expect } from '@playwright/test';

/**
 * Credenciales sembradas por Backend/scripts/seed_full_up.sql.
 * Password única para dev: CollabU2026!
 */
export const SEED_PASSWORD = 'CollabU2026!';

export const SEED_USERS = {
  student: 'student11@collabu.dev',       // Camila Vargas — proyecto activo
  studentNew: 'student16@collabu.dev',    // Santiago López — sin onboarding
  company: 'company01@collabu.dev',       // Carlos Gómez
  faculty: 'faculty01@collabu.dev',       // Ana Ruiz — asesor
  facultyMulti: 'faculty04@collabu.dev',  // Jorge Salas — doble rol (E20)
  admin: 'admin01@collabu.dev',
} as const;

export type SeedUser = keyof typeof SEED_USERS;

/**
 * Realiza el login vía UI. Si el backend no está disponible la ruta redirige
 * de vuelta al login; el llamador puede detectar el fallo con la URL.
 */
export async function loginAs(page: Page, user: SeedUser): Promise<void> {
  await page.goto('/auth/login');
  await page.fill('[formControlName="email"], input[name="email"]', SEED_USERS[user]);
  await page.fill('[formControlName="password"], input[name="password"]', SEED_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/dashboard|onboarding|admin|projects|my-|received-/, { timeout: 10_000 });
}

/**
 * Verifica que la página no produce overflow horizontal. Un valor > 1px
 * de diferencia entre scrollWidth y clientWidth suele romper la vista móvil.
 */
export async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => {
    const html = document.documentElement;
    const body = document.body;
    return {
      htmlDiff: html.scrollWidth - html.clientWidth,
      bodyDiff: body.scrollWidth - body.clientWidth,
    };
  });
  expect(overflow.htmlDiff, 'html scrollWidth vs clientWidth').toBeLessThanOrEqual(1);
  expect(overflow.bodyDiff, 'body scrollWidth vs clientWidth').toBeLessThanOrEqual(1);
}

/**
 * Salta el test si el backend no responde. Muchos flujos requieren datos
 * sembrados; sin backend viven, pero fallan a mitad y ensucian el reporte.
 */
export async function skipIfBackendDown(page: Page, endpoint = 'http://localhost:3000/health'): Promise<void> {
  try {
    const response = await page.request.get(endpoint, { timeout: 3_000 });
    if (!response.ok()) throw new Error(`status ${response.status()}`);
  } catch {
    // El caller marca el test como skipped desde fixture externa
    throw new Error('BACKEND_DOWN');
  }
}
