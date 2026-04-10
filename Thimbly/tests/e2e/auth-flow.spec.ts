import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('unauthenticated users are redirected to login', async ({ page }) => {
    await page.goto('/editor');
    // Ensure the redirect happened
    await expect(page).toHaveURL(/.*\/login/);
    await expect(page.locator('text="Sign In with Mock Data"')).toBeVisible();
  });

  test('user can log in and view the editor', async ({ page }) => {
    // We mock the Supabase Auth response
    await page.route('**/auth/v1/token?grant_type=password', async (route) => {
      const json = {
        access_token: 'mock-access-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-refresh-token',
        user: { id: 'user-123', email: 'test@example.com', role: 'authenticated' },
      };
      await route.fulfill({ json });
    });

    await page.route('**/auth/v1/user', async (route) => {
      await route.fulfill({
        json: { id: 'user-123', email: 'test@example.com', role: 'authenticated' }
      });
    });

    await page.goto('/login');
    await page.click('text="Sign In with Mock Data"');

    await expect(page).toHaveURL(/.*\/editor/);
    await expect(page.locator('text="Thimbly"').first()).toBeVisible();
    await expect(page.locator('text="Sign Out"')).toBeVisible();
  });
});
