import { test, expect } from '@playwright/test';
import { expectNoHorizontalOverflow } from './helpers';

/**
 * Sin scroll horizontal en los cuatro breakpoints principales. La ausencia
 * de overflow es una regla dura del planning (§13.4).
 */
const VIEWPORTS = [
  { name: 'mobile',  width: 375,  height: 812 },
  { name: 'tablet',  width: 768,  height: 1024 },
  { name: 'laptop',  width: 1280, height: 800 },
  { name: 'desktop', width: 1920, height: 1080 },
];

const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/register',
];

test.describe('13.4 Responsive', () => {
  for (const vp of VIEWPORTS) {
    for (const route of PUBLIC_ROUTES) {
      test(`${route} a ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(route);
        await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {});
        await expectNoHorizontalOverflow(page);
      });
    }
  }

  test('login mantiene formulario visible en 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/auth/login');
    const email = page.locator('input[type="email"], input[name="email"]').first();
    const password = page.locator('input[type="password"]').first();
    await expect(email).toBeVisible();
    await expect(password).toBeVisible();
    // El botón debe alcanzarse sin scroll horizontal
    const submitBox = await page.locator('button[type="submit"]').first().boundingBox();
    expect(submitBox?.x ?? 0).toBeGreaterThanOrEqual(0);
    expect((submitBox?.x ?? 0) + (submitBox?.width ?? 0)).toBeLessThanOrEqual(375);
  });
});
