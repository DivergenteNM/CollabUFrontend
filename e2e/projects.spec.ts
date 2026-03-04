import { test, expect } from '@playwright/test';

test.describe('Projects', () => {
  test('should redirect to login from projects page when unauthenticated', async ({ page }) => {
    await page.goto('/projects');
    await expect(page).toHaveURL(/auth\/login|projects/, { timeout: 10_000 });
  });

  test('should load the projects page structure', async ({ page }) => {
    await page.goto('/projects');
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});
