import { test, expect } from '@playwright/test';

test.describe('Weekly Review Page', () => {

    test.beforeEach(async ({ page }) => {
        // Navigate to login page
        await page.goto('/login');

        // Fill in credentials
        await page.fill('input[type="email"]', 'yukifujita0113@gmail.com');
        await page.fill('input[type="password"]', 'yuma1327');

        // Submit form
        await page.click('button[type="submit"]');

        // Wait for the home page to load
        await page.waitForURL('**/');
        await page.waitForLoadState('networkidle');
    });

    test('should render all sections of the weekly review page', async ({ page }) => {
        // Go to Weekly Review Page
        await page.goto('/weekly-review');
        await page.waitForLoadState('networkidle');

        // Verify page header
        const pageHeader = page.locator('h1.text-2xl', { hasText: '週次振り返り' });
        await expect(pageHeader).toBeVisible();

        // Verify Summary Section
        const summaryHeader = page.locator('h2', { hasText: '今週のサマリー' });
        await expect(summaryHeader).toBeVisible();

        // Verify Todo Analysis Section
        const analysisHeader = page.locator('h2', { hasText: 'TODO別達成状況' });
        await expect(analysisHeader).toBeVisible();

        // Verify Goal Editing Section
        const goalHeader = page.locator('h2', { hasText: '目標の調整' });
        await expect(goalHeader).toBeVisible();

        // Verify Change Memo Section
        const memoTopHeader = page.locator('h3', { hasText: 'チェンジメモ' });
        await expect(memoTopHeader).toBeVisible();
    });

    test('should allow adding a new change memo', async ({ page }) => {
        await page.goto('/weekly-review');
        await page.waitForLoadState('networkidle');

        const memoHeader = page.locator('h3', { hasText: 'チェンジメモ' });
        await expect(memoHeader).toBeVisible();

        // Find the textarea for the memo
        const memoTextarea = page.locator('textarea[placeholder*="例: 最近残業が多くて"]');
        await expect(memoTextarea).toBeVisible();

        // Type a new memo
        const testMemo = `Playwright E2E Test Memo ${Date.now()}`;
        await memoTextarea.fill(testMemo);

        // Click save button (Add)
        const saveButton = page.locator('button', { hasText: 'メモを保存' });
        await expect(saveButton).toBeVisible();
        await saveButton.click();

        // Verify the success message appears
        const successMessage = page.locator('span', { hasText: '保存しました' });
        await expect(successMessage).toBeVisible();
    });
});
