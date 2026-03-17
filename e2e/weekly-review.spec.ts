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
        const pageHeader = page.locator('h1', { hasText: '週次振り返り' });
        await expect(pageHeader).toBeVisible();

        // Verify Difficulty Memo Section
        const memoHeader = page.locator('h2', { hasText: '今週の難易度メモ' });
        await expect(memoHeader).toBeVisible();

        // Verify Goal Tuning Section
        const tuningHeader = page.locator('h2', { hasText: '目標のチューニング' });
        await expect(tuningHeader).toBeVisible();

        // Verify Gold Validity Check Section
        const goldHeader = page.locator('h2', { hasText: 'Gold目標の妥当性チェック' });
        await expect(goldHeader).toBeVisible();
    });

    test('should show Bronze/Silver edit restriction on non-Monday', async ({ page }) => {
        await page.goto('/weekly-review');
        await page.waitForLoadState('networkidle');

        // Check if Monday restriction message is shown (when not Monday)
        const today = new Date();
        if (today.getDay() !== 1) {
            const restrictionMsg = page.locator('p', { hasText: 'Bronze/Silver目標の変更は毎週月曜日に行えます' });
            await expect(restrictionMsg).toBeVisible();
        }
    });

    test('should show complete review button if not completed', async ({ page }) => {
        await page.goto('/weekly-review');
        await page.waitForLoadState('networkidle');

        // Check for the review complete button or completed status
        const completeButton = page.locator('button', { hasText: '振り返り完了' });
        const completedBadge = page.locator('span', { hasText: 'この週の振り返りは完了済みです' });

        // Either button or completed badge should exist
        const hasButton = await completeButton.isVisible().catch(() => false);
        const hasBadge = await completedBadge.isVisible().catch(() => false);
        expect(hasButton || hasBadge).toBeTruthy();
    });
});
