import { test, expect } from '@playwright/test';

test('take screenshot of the home page', async ({ page }) => {
    // webServer設定によって自動的にlocalhost:3000が立ち上がります
    await page.goto('/');

    // ページが完全にロードされるのを少し待つ
    await page.waitForLoadState('networkidle');

    // ルートディレクトリに screenshot.png としてスクリーンショットを保存（ページ全体）
    await page.screenshot({ path: 'screenshot.png', fullPage: true });
});
