import { test, expect } from '@playwright/test';

test('login and verify home page loads correctly', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');

    // Fill in credentials
    await page.fill('input[type="email"]', 'yukifujita0113@gmail.com');
    await page.fill('input[type="password"]', 'yuma1327');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for the home page to load
    await page.waitForURL('**/');

    // Check if a header for the report cards exists (checking if data fetched successfully)
    // The home page has "達成したTODO" or "学習内容" depending on the data
    await page.waitForLoadState('networkidle');

    // We expect at least the AppLayout to render some common elements like a heading or streak
    const heading = page.locator('h1', { hasText: 'ホーム' });
    await expect(heading).toBeVisible();

    // Take screenshot of the authenticated home page
    await page.screenshot({ path: 'home-authenticated.png', fullPage: true });
});
