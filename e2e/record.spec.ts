import { test, expect } from '@playwright/test';

test.describe('Record Page Routine Check', () => {

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

    test('should render routines on record page and save them', async ({ page }) => {
        // First add a dummy routine to Ensure there is at least one
        await page.goto('/routine');
        await page.waitForLoadState('networkidle');
        const randomId = Math.floor(Math.random() * 100000);
        const testContent = `E2Eテスト用ルーティン ${randomId}`;
        await page.fill('input[type="time"]', '12:00');
        await page.fill('input[type="text"]', testContent);
        await page.click('button:has-text("追加")');
        // Verify added
        await expect(page.locator('p', { hasText: testContent })).toBeVisible({ timeout: 10000 });

        // Go to Record Page
        await page.goto('/record');
        await page.waitForLoadState('networkidle');

        // Verify Routine section exists
        const routineSectionHeader = page.locator('h2', { hasText: 'マイルーティン' });
        await expect(routineSectionHeader).toBeVisible();

        // Verify our routine is there
        const routineItem = page.locator('span', { hasText: testContent });
        await expect(routineItem).toBeVisible();

        // Check the routine checkbox using the label clicking
        await routineItem.click();

        // Verify at least one level achieved or text entered so we can save
        // We will just enter journal text to bypass bronze requirement
        await page.fill('textarea[placeholder*="今日感じたこと"]', 'E2Eテスト記録');

        // Save Record
        await page.click('button:has-text("確定してロックする"), button:has-text("変更を保存する")');

        // Should return to home page
        await page.waitForURL('**/');
        await page.waitForLoadState('networkidle');

        // Wait for Home page elements
        const heading = page.locator('h1', { hasText: 'ホーム' });
        await expect(heading).toBeVisible();
    });
});
