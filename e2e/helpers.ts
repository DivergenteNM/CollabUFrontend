import { Page, expect } from '@playwright/test';

/**
 * Credenciales sembradas por Backend/scripts/seed_full_up.sql.
 * Password única para dev: CollabU2026!
 */
export const SEED_PASSWORD = 'CollabU2026!';

export const SEED_USERS = {
  student: 'student11@collabu.dev',       // Camila Vargas — proyecto activo
  studentNew: 'karol.pabon@collabu.dev',  // Karol Pabón (Electrónica) — sin onboarding (seed de departamentos)
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
  const email = page.locator('[formControlName="email"], input[name="email"]').first();
  const password = page.locator('[formControlName="password"], input[name="password"]').first();
  // Con SSR en desarrollo la hidratación puede reiniciar el formulario justo después de escribir:
  // se vuelve a rellenar hasta que los valores se mantengan.
  for (let attempt = 0; attempt < 6; attempt++) {
    await email.fill(SEED_USERS[user]);
    await password.fill(SEED_PASSWORD);
    await page.waitForTimeout(400);
    if ((await email.inputValue()) === SEED_USERS[user] && (await password.inputValue()) === SEED_PASSWORD) break;
  }
  await page.locator('button[type="submit"]').click();
  // Con `ng serve` la primera carga de cada ruta compila chunks: el margen debe cubrir ese arranque en frío.
  await page.waitForURL(/dashboard|onboarding|admin|projects|my-|received-/, { timeout: 30_000 });
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
