import { chromium } from '@playwright/test';
import { AUTH_STATE_PATH } from '../../playwright.config';

// Required env vars:
//   CLERK_TEST_EMAIL    — email of the dedicated test Clerk user
//   CLERK_TEST_PASSWORD — password of the dedicated test Clerk user
//   TEST_BASE_URL       — (optional) defaults to http://localhost:3000

export default async function globalSetup() {
  const baseURL = process.env.TEST_BASE_URL ?? 'http://localhost:3000';

  if (!process.env.CLERK_TEST_EMAIL || !process.env.CLERK_TEST_PASSWORD) {
    throw new Error('CLERK_TEST_EMAIL and CLERK_TEST_PASSWORD must be set');
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(`${baseURL}/sign-in`);

  // Clerk sign-in: step 1 — identifier
  await page.waitForSelector('input[name="identifier"]', { timeout: 20_000 });
  await page.fill('input[name="identifier"]', process.env.CLERK_TEST_EMAIL);
  await page.click('button[type="submit"]');

  // Clerk sign-in: step 2 — password
  await page.waitForSelector('input[type="password"]', { timeout: 10_000 });
  await page.fill('input[type="password"]', process.env.CLERK_TEST_PASSWORD);
  await page.click('button[type="submit"]');

  // Wait for successful redirect
  await page.waitForURL((url) => !url.pathname.includes('sign-in'), { timeout: 20_000 });

  await page.context().storageState({ path: AUTH_STATE_PATH });
  await browser.close();
}
