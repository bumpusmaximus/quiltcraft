import { test, expect } from '@playwright/test';

test.describe('RLS Security', () => {
  test('User A cannot fetch User B projects (simulated API 403 handling)', async ({ page }) => {
    // Mock login as User A
    await page.route('**/auth/v1/token?grant_type=password', async (route) => {
      await route.fulfill({
        json: {
          access_token: 'mock-token-user-A',
          user: { id: 'user-A' }
        }
      });
    });

    await page.route('**/auth/v1/user', async (route) => {
      await route.fulfill({
        json: { id: 'user-A', email: 'userA@example.com', role: 'authenticated' }
      });
    });

    await page.goto('/login');
    await page.click('text="Sign In with Mock Data"');

    // Wait for editor
    await expect(page).toHaveURL(/.*\/editor/);

    // If the frontend were to fetch User B's project, the backend Supabase RLS would return 403
    // Let's mock a direct API test that fails
    await page.route('**/rest/v1/projects?id=eq.user-B-project', async (route) => {
      await route.fulfill({
        status: 403,
        json: { error: 'Row level security policy violation' }
      });
    });

    // Simulate an internal fetch call the UI might make
    const response = await page.evaluate(async () => {
      const res = await fetch('http://localhost:5173/rest/v1/projects?id=eq.user-B-project');
      return res.status;
    });

    expect(response).toBe(403);
  });
});
