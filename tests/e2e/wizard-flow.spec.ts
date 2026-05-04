import { test, expect, Page } from '@playwright/test';
import path from 'path';
import { getLatestBoardForUser, deleteBoard } from './helpers/db';

// Required env vars (in addition to what global-setup needs):
//   CLERK_TEST_USER_ID — Clerk userId of the test account (found in Clerk dashboard)
//   DATABASE_URL       — Neon connection string

const TEST_AREAS = ['career', 'health'] as const;
const TEST_STYLE = 'vibrant';

const TEST_GOALS = {
  career: {
    objective: 'Launch a business generating $10k/month',
    habit: 'Work on my business for 1 focused hour before 9am',
  },
  health: {
    objective: 'Get lean, strong, and feel energetic every single day',
    habit: 'Move my body for 30 minutes every morning',
  },
} as const;

const PHOTO_FIXTURE = path.join(__dirname, '../fixtures/test-photo.png');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function completeStep1(page: Page) {
  // Select life areas
  for (const area of TEST_AREAS) {
    await page.locator(`[data-testid="area-${area}"]`).click();
  }

  // DreamExplorer is open by default for a fresh session.
  // Navigate through all 5 prompts, selecting the first chip on each.
  for (let i = 0; i < 5; i++) {
    const suggestionsContainer = page.locator('[data-testid="explorer-suggestions"]');
    await suggestionsContainer.waitFor({ state: 'visible' });

    // Click the first suggestion chip
    await suggestionsContainer.locator('[role="button"]').first().click();

    if (i < 4) {
      await page.locator('[data-testid="explorer-next"]').click();
    } else {
      // Last prompt: "Complete ✨" appears because ≥2 prompts are answered
      await page.locator('[data-testid="explorer-complete"]').click();
    }
  }

  // After completing the explorer, the textarea is shown with combined dreams
  await page.locator('textarea#dreams').waitFor({ state: 'visible' });

  await page.locator('[data-testid="step1-next"]').click();
}

async function completeStep2(page: Page) {
  // Upload test photo via the hidden file input
  await page.locator('[data-testid="photo-file-input"]').setInputFiles(PHOTO_FIXTURE);

  // Wait for upload to Vercel Blob (the spinner disappears and a thumbnail appears)
  await page.waitForFunction(() => {
    const spinner = document.querySelector('.animate-spin');
    return !spinner;
  }, { timeout: 30_000 });

  // Select vibrant style
  await page.locator(`[data-testid="style-${TEST_STYLE}"]`).click();

  await page.locator('[data-testid="step2-next"]').click();
}

async function completeStep3(page: Page) {
  for (const area of TEST_AREAS) {
    await page.locator(`[data-testid="goal-${area}-objective"]`).fill(TEST_GOALS[area].objective);
    await page.locator(`[data-testid="goal-${area}-habit"]`).fill(TEST_GOALS[area].habit);
  }
}

// ---------------------------------------------------------------------------
// Test
// ---------------------------------------------------------------------------

test('complete wizard flow saves correct data to the database', async ({ page }) => {
  const userId = process.env.CLERK_TEST_USER_ID;
  if (!userId) throw new Error('CLERK_TEST_USER_ID must be set');

  // Clear any leftover wizard session state from prior runs
  await page.goto('/create');
  await page.evaluate(() => sessionStorage.removeItem('manifesta-wizard'));
  await page.reload();
  await page.waitForLoadState('networkidle');

  // ── Step 1: Dream Life ────────────────────────────────────────────────────
  await completeStep1(page);

  // ── Step 2: Photos & Style ────────────────────────────────────────────────
  await completeStep2(page);

  // ── Step 3: Goals & Habits ────────────────────────────────────────────────
  await completeStep3(page);

  // Listen for the boards POST *before* clicking generate, so we don't race
  const boardSaveResponse = page.waitForResponse(
    (r) => r.url().includes('/api/boards') && r.request().method() === 'POST',
    { timeout: 20_000 },
  );

  await page.locator('[data-testid="generate-board"]').click();

  // Confirm the API call succeeded
  const resp = await boardSaveResponse;
  expect(resp.status()).toBe(200);

  const { board: savedBoard } = await resp.json() as { board?: { id: string } };
  expect(savedBoard?.id).toBeTruthy();

  // ── Step 4: board is shown ────────────────────────────────────────────────
  await page.waitForLoadState('networkidle');

  // ── DB validation ─────────────────────────────────────────────────────────
  const board = await getLatestBoardForUser(userId);
  expect(board).not.toBeNull();

  // Selected areas
  expect(board!.selected_areas).toContain('career');
  expect(board!.selected_areas).toContain('health');
  expect(board!.selected_areas).toHaveLength(TEST_AREAS.length);

  // Style
  expect(board!.style).toBe(TEST_STYLE);

  // Dreams (set by DreamExplorer — non-empty)
  expect(board!.dreams.length).toBeGreaterThan(10);

  // Goals
  const careerGoal = board!.goals.find((g) => g.area === 'career');
  const healthGoal = board!.goals.find((g) => g.area === 'health');

  expect(careerGoal?.objective).toBe(TEST_GOALS.career.objective);
  expect(careerGoal?.habit).toBe(TEST_GOALS.career.habit);
  expect(healthGoal?.objective).toBe(TEST_GOALS.health.objective);
  expect(healthGoal?.habit).toBe(TEST_GOALS.health.habit);

  // Uploaded photo URL saved
  expect(Array.isArray(board!.photo_urls)).toBe(true);
  expect(board!.photo_urls!.length).toBeGreaterThanOrEqual(1);
  expect(board!.photo_urls![0]).toMatch(/^https?:\/\//);

  // Manifesto was generated
  expect(board!.manifesto).toBeTruthy();
  expect(board!.manifesto!.length).toBeGreaterThan(20);

  // ── Cleanup ───────────────────────────────────────────────────────────────
  await deleteBoard(board!.id);
});
