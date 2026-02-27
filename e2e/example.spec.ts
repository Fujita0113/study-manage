import { test, expect } from '@playwright/test';

test('homepage has title', async ({ page }) => {
    await page.goto('/');

    // Create a basic assertion to check if the page loads correctly
    // Usually Next.js apps will have a title, or we can look for specific text
    await expect(page).toHaveTitle(/./);

    // Or check for a basic header
    // await expect(page.locator('h1')).toBeVisible();
});
