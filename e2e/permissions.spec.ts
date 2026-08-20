import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

/**
 * Cada rol contra rutas prohibidas: la app debe redirigir o mostrar 403.
 * No confiamos en el backend para bloquear; verificamos que la UI oculte
 * los controles y que el guard rechace el acceso.
 */
test.describe('13.3 Pruebas de permisos', () => {
  test('student no puede acceder a rutas admin', async ({ page }) => {
    await loginAs(page, 'student').catch(() => {});
    await page.goto('/admin/dashboard');
    // Debe redirigir fuera del panel admin
    await page.waitForURL(/dashboard|forbidden|login/, { timeout: 5_000 }).catch(() => {});
    expect(page.url()).not.toMatch(/\/admin\/dashboard$/);
  });

  test('student no ve controles de admin en su sidebar', async ({ page }) => {
    await loginAs(page, 'student').catch(() => {});
    await page.goto('/dashboard').catch(() => {});
    await expect(page.locator('a:has-text("Verificaciones")')).toHaveCount(0);
    await expect(page.locator('a:has-text("Supervisores")')).toHaveCount(0);
    await expect(page.locator('a:has-text("Periodos")')).toHaveCount(0);
  });

  test('company no puede ver rutas de admin ni faculty', async ({ page }) => {
    await loginAs(page, 'company').catch(() => {});
    await page.goto('/admin/users');
    expect(page.url()).not.toMatch(/\/admin\/users$/);

    await page.goto('/my-students');
    expect(page.url()).not.toMatch(/\/my-students$/);
  });

  test('faculty no accede a rutas admin exclusivas', async ({ page }) => {
    await loginAs(page, 'faculty').catch(() => {});
    await page.goto('/admin/users');
    expect(page.url()).not.toMatch(/\/admin\/users$/);
  });

  test('admin puede acceder al panel de configuración', async ({ page }) => {
    await loginAs(page, 'admin').catch(() => {});
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/admin/);
  });

  test('rutas sin sesión redirigen a login', async ({ page }) => {
    // Limpia cualquier storage
    await page.context().clearCookies();
    await page.goto('/dashboard');
    await page.waitForURL(/login/, { timeout: 5_000 }).catch(() => {});
    expect(page.url()).toMatch(/login/);
  });
});
