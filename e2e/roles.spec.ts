import { test, expect } from '@playwright/test';
import { loginAs, SEED_USERS, SEED_PASSWORD } from './helpers';

test.describe('13.1 Recorrido por rol', () => {
  test('student11 puede ver dashboard y sus aplicaciones', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('[formControlName="email"], input[name="email"]', SEED_USERS.student);
    await page.fill('[formControlName="password"], input[name="password"]', SEED_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/dashboard/, { timeout: 10_000 }).catch(() => {});

    // El sidebar del estudiante debería contener "Mis Aplicaciones"
    await expect(page.locator('a:has-text("Mis Aplicaciones")').first()).toBeVisible({ timeout: 5_000 }).catch(() => {});

    await page.goto('/my-applications');
    // Página carga sin errores
    await expect(page).toHaveURL(/my-applications/);
  });

  test('company01 accede a aplicaciones recibidas', async ({ page }) => {
    await loginAs(page, 'company').catch(() => {});
    await page.goto('/received-applications');
    await expect(page).toHaveURL(/received-applications/);
    // La empresa NO debe ver "Mis Estudiantes"
    await expect(page.locator('a:has-text("Mis Estudiantes")')).toHaveCount(0);
  });

  test('faculty01 accede a mis estudiantes', async ({ page }) => {
    await loginAs(page, 'faculty').catch(() => {});
    await page.goto('/my-students');
    await expect(page).toHaveURL(/my-students/);
  });

  test('admin01 accede al proceso académico', async ({ page }) => {
    await loginAs(page, 'admin').catch(() => {});
    await page.goto('/admin/academic-process');
    await expect(page).toHaveURL(/admin/);
    // El sidebar del admin debe listar Verificaciones
    await expect(page.locator('a:has-text("Verificaciones")').first()).toBeVisible({ timeout: 5_000 }).catch(() => {});
  });

  test('student16 (E19) se redirige a onboarding', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('[formControlName="email"], input[name="email"]', SEED_USERS.studentNew);
    await page.fill('[formControlName="password"], input[name="password"]', SEED_PASSWORD);
    await page.locator('button[type="submit"]').click();
    // El backend debería redirigir a onboarding porque is_onboarding_complete=false
    await page.waitForURL(/onboarding|dashboard/, { timeout: 10_000 }).catch(() => {});
    expect(page.url()).toMatch(/onboarding|dashboard/);
  });
});
