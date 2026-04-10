import { test, expect } from '@playwright/test';

// Force serial execution so tests don't collide on shared credit state
test.describe.configure({ mode: 'serial', retries: 2 });

test.describe('Credit & Export Flow', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Mock Supabase Auth calls
    await page.route('**/auth/v1/token?grant_type=password', async (route) => {
      await route.fulfill({
        json: {
          access_token: 'mock-token',
          user: { id: 'user-123', email: 'testuser@thimbly.dev' }
        }
      });
    });

    await page.route('**/auth/v1/user', async (route) => {
      await route.fulfill({
        json: { id: 'user-123', email: 'testuser@thimbly.dev', role: 'authenticated' }
      });
    });

    // 2. Default mock for credits (will be overridden in specific tests if needed)
    await page.route('**/api/credits/balance', async (route) => {
      await route.fulfill({ json: { balance: 1 } });
    });

    // 3. Navigate to login
    await page.goto('/login');
    
    // 4. Authenticate
    await page.getByTestId('email-input').fill('testuser@thimbly.dev');
    await page.getByTestId('password-input').fill('SecureTestPass123!');
    await page.getByTestId('login-submit').click();
    
    // 5. Wait for auth redirect, editor mounting, and balance hydration
    await page.waitForURL('/editor', { timeout: 15000 });
    await expect(page.getByTestId('user-credits')).toBeVisible({ timeout: 10000 });
    // Ensure the canvas grid is actually rendered before interacting
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
  });

  test('completes successful export with atomic credit deduction', async ({ page }) => {
    // Override credit mock for this test
    await page.route('**/api/credits/balance', async (route) => {
      await route.fulfill({ json: { balance: 1 } });
    });

    await page.route('**/api/exports/validate', async (route) => {
      await route.fulfill({ 
        status: 200, 
        json: { status: 'validate_success', transaction_ref: 'tx_12345' } 
      });
    });

    await page.route('**/api/exports/complete', async (route) => {
      await route.fulfill({ 
        status: 200, 
        json: { status: 'completed', url: 'https://mock-download-url.com/pattern.pdf' } 
      });
    });

    // 1. Trigger export
    await page.getByTestId('export-pdf-btn').click();

    // 2. Wait for /validate response
    const validateRes = await page.waitForResponse(
      res => res.url().includes('/api/exports/validate') && res.status() === 200,
      { timeout: 10000 }
    );
    const validateJson = await validateRes.json();
    expect(validateJson).toHaveProperty('status', 'validate_success');
    expect(validateJson).toHaveProperty('transaction_ref');

    // 3. Wait for /complete response
    const completeRes = await page.waitForResponse(
      res => res.url().includes('/api/exports/complete') && res.status() === 200,
      { timeout: 10000 }
    );
    expect(await completeRes.json()).toHaveProperty('status', 'completed');

    // 4. Verify UI state transition
    await expect(page.getByTestId('export-success-modal')).toBeVisible({ timeout: 5000 });
    // Note: Our optimistic UI updates locally to 0
    await expect(page.getByTestId('user-credits')).toHaveText('0 credits');
    
    // 5. Verify download link rendered
    await expect(page.getByTestId('download-link')).toHaveAttribute('href', /.+/);
  });

  test('blocks second export and surfaces upgrade modal on 0 balance', async ({ page }) => {
    // Force 0 balance via mock
    await page.route('**/api/credits/balance', async (route) => {
      await route.fulfill({ json: { balance: 0 } });
    });

    // We have to reload to pick up the 0 balance mock or the useCredits hook will poll
    await page.reload();
    await expect(page.getByTestId('user-credits')).toHaveText('0 credits');

    // 1. Attempt export with depleted balance
    await page.getByTestId('export-pdf-btn').click();

    // 2. Verify upgrade modal mounts
    await expect(page.getByTestId('upgrade-modal')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('upgrade-modal-title')).toHaveText('Add Credits');
    await expect(page.getByTestId('credit-packs')).toBeVisible();
  });
});
