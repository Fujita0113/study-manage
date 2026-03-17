import { test, expect } from '@playwright/test';

test.describe('Study Timer E2E Test', () => {

    test.beforeEach(async ({ page }) => {
        // Login
        await page.goto('/login');
        await page.fill('input[type="email"]', 'yukifujita0113@gmail.com');
        await page.fill('input[type="password"]', 'yuma1327');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/');
        await page.waitForLoadState('networkidle');
    });

    test('should show timer and increment on record page', async ({ page }) => {
        // Go to Record Page
        await page.goto('/record');
        await page.waitForLoadState('networkidle');

        // Verify Timer section exists
        const timerHeader = page.locator('span', { hasText: "Today's Study Time" });
        await expect(timerHeader).toBeVisible();

        const timerDisplay = page.locator('div.text-5xl.font-mono');
        await expect(timerDisplay).toBeVisible();

        // Initial time check (e.g. 00:00:0X)
        const initialTime = await timerDisplay.innerText();

        // Wait for 2 seconds
        await page.waitForTimeout(2000);

        const newTime = await timerDisplay.innerText();
        expect(newTime).not.toBe(initialTime);

        // Reload page and check if time is persisted
        await page.reload();
        await page.waitForLoadState('networkidle');
        const reloadedTime = await timerDisplay.innerText();
        // reloadedTime should be equal or slightly greater than newTime
        const [h1, m1, s1] = newTime.split(':').map(Number);
        const [h2, m2, s2] = reloadedTime.split(':').map(Number);
        const t1 = h1 * 3600 + m1 * 60 + s1;
        const t2 = h2 * 3600 + m2 * 60 + s2;
        expect(t2).toBeGreaterThanOrEqual(t1);
    });

    test('should save study time in daily record', async ({ page }) => {
        await page.goto('/record');
        await page.waitForLoadState('networkidle');

        // Enter journal to allow saving
        await page.fill('textarea[placeholder*="今日感じたこと"]', 'Timer E2E Test');

        // Wait a bit to accumulate some time
        await page.waitForTimeout(1000);

        // Save Record
        await page.click('button:has-text("確定してロックする"), button:has-text("変更を保存する")');

        // Should return to home page
        await page.waitForURL('**/');
        await page.waitForLoadState('networkidle');

        // Return to record page to see if time was loaded from DB
        await page.goto('/record');
        await page.waitForLoadState('networkidle');

        const timerDisplay = page.locator('div.text-5xl.font-mono');
        const savedTimeStr = await timerDisplay.innerText();
        const [h, m, s] = savedTimeStr.split(':').map(Number);
        const totalSeconds = h * 3600 + m * 60 + s;
        expect(totalSeconds).toBeGreaterThan(0);
    });
});
