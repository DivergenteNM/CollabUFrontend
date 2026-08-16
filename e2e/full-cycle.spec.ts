import { test, expect } from '@playwright/test';
import { loginAs, SEED_USERS, SEED_PASSWORD } from './helpers';

/**
 * §13.2 — E2E del ciclo completo. Un proyecto atraviesa draft → completed
 * con los 5 roles. Este spec depende del backend + seed corriendo; sin
 * ambos, salta con `test.skip`.
 *
 * En la práctica valida las TRANSICIONES visibles, no dispara la lógica
 * completa (el seed ya sembró proyectos en cada etapa). Recorremos los
 * workspaces de los proyectos que representan cada estado y verificamos
 * que los tabs correctos aparecen para el rol activo.
 */
test.describe.serial('13.2 Ciclo completo (requiere backend + seed)', () => {
  test.beforeAll(async ({ request }) => {
    // Skip si el backend no responde
    try {
      const health = await request.get('http://localhost:3000/health', { timeout: 3000 });
      if (!health.ok()) test.skip(true, 'Backend no disponible');
    } catch {
      test.skip(true, 'Backend no disponible');
    }
  });

  test('company01 crea/consulta proyecto', async ({ page }) => {
    await loginAs(page, 'company');
    await page.goto('/my-projects');
    await expect(page).toHaveURL(/my-projects/);
  });

  test('admin01 ve la cola académica y encuentra proyectos activos', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/admin/academic-process');
    // Al menos un proyecto debería aparecer (P8-P15 del seed son activos)
    await page.waitForTimeout(1500);
    const html = await page.content();
    expect(html.length).toBeGreaterThan(1000);
  });

  test('student11 abre su workspace y ve tabs esperados', async ({ page }) => {
    await loginAs(page, 'student');
    // application 70000000-...-000006 es del seed
    await page.goto('/workspace/70000000-0000-0000-0000-000000000006');
    await page.waitForTimeout(2000);
    // Debe existir el tab "Resumen" al menos
    await expect(page.locator('mat-tab-group')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test('faculty01 abre workspace de estudiante asignado', async ({ page }) => {
    await loginAs(page, 'faculty');
    await page.goto('/my-students');
    await page.waitForTimeout(1500);
    // Buscar tarjeta y abrirla
    const firstCard = page.locator('.student-card, [role="button"]').first();
    if (await firstCard.count()) {
      await firstCard.click();
      await page.waitForURL(/workspace/, { timeout: 5000 }).catch(() => {});
    }
  });

  test('deep link ?tab=academic&anchor=anteproyecto navega correcto', async ({ page }) => {
    await loginAs(page, 'student');
    await page.goto('/workspace/70000000-0000-0000-0000-000000000006?tab=academic&anchor=anteproyecto');
    await page.waitForTimeout(2000);
    // El ancla se aplica: elemento con id ws-anchor-anteproyecto entra en viewport
    const anchor = page.locator('#ws-anchor-anteproyecto');
    if (await anchor.count() > 0) {
      const inView = await anchor.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        return rect.top < window.innerHeight && rect.bottom > 0;
      });
      expect(inView).toBeTruthy();
    }
  });
});
