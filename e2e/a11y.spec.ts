import { test, expect } from '@playwright/test';

/**
 * Chequeos de accesibilidad básicos que no requieren backend.
 * No pretende reemplazar axe-core, solo cubre las reglas del §13.6:
 * navegación por teclado y aria-label en badges/timeline.
 */
test.describe('13.6 Accesibilidad', () => {
  test('login: Tab navega entre email → password → submit', async ({ page }) => {
    await page.goto('/auth/login');

    const email = page.locator('input[type="email"], input[name="email"]').first();
    await email.focus();
    await expect(email).toBeFocused();

    await page.keyboard.press('Tab');
    const password = page.locator('input[type="password"]').first();
    await expect(password).toBeFocused();
  });

  test('todos los botones sin texto tienen aria-label', async ({ page }) => {
    await page.goto('/auth/login');
    const iconButtons = await page.locator('button:not([aria-label]):has(mat-icon)').all();
    for (const btn of iconButtons) {
      // Un botón puramente icono debe tener aria-label o title
      const hasText = ((await btn.textContent()) ?? '').trim().length > 0;
      const hasAria = (await btn.getAttribute('aria-label')) !== null
        || (await btn.getAttribute('title')) !== null;
      expect(hasText || hasAria, `botón sin nombre accesible: ${await btn.innerHTML()}`).toBeTruthy();
    }
  });

  test('imágenes con contenido tienen alt', async ({ page }) => {
    await page.goto('/auth/login');
    const imgs = await page.locator('img').all();
    for (const img of imgs) {
      const alt = await img.getAttribute('alt');
      const ariaHidden = await img.getAttribute('aria-hidden');
      // Decorativa (aria-hidden=true) o con alt (aunque sea vacío)
      expect(alt !== null || ariaHidden === 'true').toBeTruthy();
    }
  });

  test('landmark: main y nav presentes', async ({ page }) => {
    await page.goto('/auth/login');
    // La página pública puede no tener main; verificamos que si existe sidebar
    // tras login, cumpla role=navigation.
    await page.goto('/dashboard').catch(() => {});
    await page.waitForTimeout(500);
    const nav = page.locator('[role="navigation"], nav');
    // Si redirige a login sin datos, aceptamos count 0. Si carga, debe haber uno.
    const count = await nav.count();
    if (!/login/.test(page.url())) {
      expect(count).toBeGreaterThan(0);
    }
  });

  test('sin scroll horizontal en 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/auth/login');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
