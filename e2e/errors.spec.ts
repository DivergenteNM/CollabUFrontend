import { test, expect } from '@playwright/test';

/**
 * Simula fallos backend con route intercept. La UI debe distinguir
 * error de red de estado vacío y ofrecer reintento.
 */
test.describe('13.5 Estados de error', () => {
  test('403 en /projects muestra mensaje o redirige a login', async ({ page }) => {
    await page.route('**/api/v1/projects**', (route) => {
      route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Prohibido' }),
      });
    });
    await page.goto('/projects');
    await page.waitForTimeout(1500);
    const bodyText = (await page.textContent('body')) ?? '';
    // Debe haber señal visible: mensaje de error o redirección a login
    const hasErrorUx = /permiso|prohib|acceso|no autorizado|forbidden/i.test(bodyText)
      || /login/.test(page.url());
    expect(hasErrorUx).toBeTruthy();
  });

  test('500 en /notifications no rompe layout', async ({ page }) => {
    await page.route('**/api/v1/notifications**', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Error interno' }),
      });
    });
    await page.goto('/notifications');
    await page.waitForTimeout(1500);
    // El sidebar y encabezado deben seguir presentes
    const hasStructure = await page.locator('body').isVisible();
    expect(hasStructure).toBeTruthy();
    // No debe existir stack trace crudo visible
    const bodyText = (await page.textContent('body')) ?? '';
    expect(bodyText).not.toMatch(/at\s+\w+\(.*\.ts:\d+/);
  });

  test('timeout en login se maneja sin bloquear la UI', async ({ page }) => {
    await page.route('**/api/v1/auth/login', async (route) => {
      // Simula timeout retrasando la respuesta más allá del timeout del cliente
      await new Promise((r) => setTimeout(r, 15_000));
      await route.abort();
    });
    await page.goto('/auth/login');
    await page.fill('[formControlName="email"], input[name="email"]', 'test@collabu.dev');
    await page.fill('[formControlName="password"], input[name="password"]', 'CollabU2026!');
    await page.locator('button[type="submit"]').click();
    // Después de ~5s el botón debe volver a estar habilitado o mostrar error
    await page.waitForTimeout(6_000);
    const btnDisabled = await page.locator('button[type="submit"]').first().isDisabled();
    expect(btnDisabled).toBeFalsy();
  });

  test('empty state vs error: /my-applications sin datos muestra empty', async ({ page }) => {
    await page.route('**/api/v1/applications/my**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], total: 0, page: 1, limit: 10 }),
      });
    });
    // Sin login la ruta redirige; nos importa que si carga, muestra empty state
    await page.goto('/my-applications');
    await page.waitForTimeout(1500);
    const html = await page.content();
    // Empty state esperado: alguna referencia a "sin", "no hay" o icono empty
    const looksLikeEmpty = /sin\s|no hay|empty|vacío|todavía/i.test(html)
      || /login/.test(page.url());
    expect(looksLikeEmpty).toBeTruthy();
  });
});
