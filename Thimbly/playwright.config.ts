import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Disable global parallelism for state-dependent tests
  retries: 2,           // Auto-retry flaky network assertions
  workers: 1,           // Force 1 worker for serial dependency
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'cd frontend && npm run dev',
    port: 5173,
    reuseExistingServer: true,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
