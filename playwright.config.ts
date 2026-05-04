import { defineConfig, devices } from '@playwright/test';
import path from 'path';

export const AUTH_STATE_PATH = path.join(__dirname, 'tests/.auth/user.json');

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'html',
  timeout: 90_000,
  globalSetup: './tests/e2e/global-setup.ts',
  use: {
    baseURL: process.env.TEST_BASE_URL ?? 'http://localhost:3000',
    storageState: AUTH_STATE_PATH,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 15_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
