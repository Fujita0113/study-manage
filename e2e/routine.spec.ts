import { test, expect } from '@playwright/test';

test.describe('Routine Page', () => {

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

    test('should render active and deleted tabs', async ({ page }) => {
        // Navigate to routine page
        await page.goto('/routine');
        await page.waitForLoadState('networkidle');

        // Check heading
        const heading = page.locator('main h1', { hasText: 'マイルーティン' });
        await expect(heading).toBeVisible();

        // Check tabs
        const activeTab = page.locator('button', { hasText: /実施中/ });
        const deletedTab = page.locator('button', { hasText: /削除済み/ });

        await expect(activeTab).toBeVisible();
        await expect(deletedTab).toBeVisible();

        // Take a screenshot
        await page.screenshot({ path: 'routine-page.png', fullPage: true });
    });

    test('should add a new routine successfully', async ({ page }) => {
        await page.goto('/routine');
        await page.waitForLoadState('networkidle');

        // Generate a random ID to prevent collisions
        const randomId = Math.floor(Math.random() * 100000);
        const testContent = `テスト用ルーティン ${randomId}`;

        // Fill the form
        await page.fill('input[type="time"]', '12:00');
        await page.fill('input[type="text"][placeholder="例: 朝のコーヒーを淹れて15分読書"]', testContent);

        // Submit
        await page.click('button:has-text("追加")');

        // Verify the new routine is in the list
        const routineItem = page.locator('p', { hasText: testContent });
        await expect(routineItem).toBeVisible({ timeout: 10000 });
    });
});
