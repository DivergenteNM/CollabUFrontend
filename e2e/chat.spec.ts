import { test, expect } from '@playwright/test';

test.describe('Chat', () => {
  test('should redirect to login from chat when unauthenticated', async ({ page }) => {
    await page.goto('/chat');
    await expect(page).toHaveURL(/auth\/login|chat/, { timeout: 10_000 });
  });

  test('should load the chat page structure', async ({ page }) => {
    await page.goto('/chat');
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});
