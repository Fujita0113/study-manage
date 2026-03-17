import { test, expect } from '@playwright/test';

test.describe('Record Page Batch Check', () => {

    test.beforeEach(async ({ page }) => {
        // ログイン処理
        await page.goto('/login');
        await page.fill('input[type="email"]', 'yukifujita0113@gmail.com');
        await page.fill('input[type="password"]', 'yuma1327');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/');
        await page.waitForLoadState('networkidle');
    });

    test('should toggle all todos in a level when heading checkbox is clicked', async ({ page }) => {
        // 記録画面へ
        await page.goto('/record');
        await page.waitForLoadState('networkidle');

        // --- Bronzeセクションのテスト ---
        const levelLabel = 'Bronze';
        const batchCheckbox = page.getByLabel(`${levelLabel}を一括チェック`);
        await expect(batchCheckbox).toBeVisible();

        // 1. 一括チェックをオンにする
        await batchCheckbox.click();

        // 状態反映待ち
        await page.waitForTimeout(1000);

        // セクションを特定（h3タグとその親のdiv.rounded-lg）
        const bronzeSection = page.locator('div.rounded-lg', { has: page.getByRole('heading', { name: levelLabel, exact: true }) }).first();
        // そのセクション内の TODO リスト部分にあるチェックボックスのみを対象にする
        const todoCheckboxes = bronzeSection.locator('div.space-y-1 input[type="checkbox"]');
        const count = await todoCheckboxes.count();

        console.log(`Found ${count} todos in ${levelLabel} section`);

        // 全てのTODOがチェックされているか検証
        for (let i = 0; i < count; i++) {
            await expect(todoCheckboxes.nth(i)).toBeChecked({ timeout: 5000 });
        }
        await expect(batchCheckbox).toBeChecked();

        // 2. 一括チェックをオフにする
        await batchCheckbox.click();
        await page.waitForTimeout(1000);

        for (let i = 0; i < count; i++) {
            await expect(todoCheckboxes.nth(i)).not.toBeChecked({ timeout: 5000 });
        }
        await expect(batchCheckbox).not.toBeChecked();

        // 3. 個別に全てチェックして、見出しが自動でオンになるか確認
        if (count > 0) {
            for (let i = 0; i < count; i++) {
                await todoCheckboxes.nth(i).click({ force: true });
            }
            await page.waitForTimeout(500);
            await expect(batchCheckbox).toBeChecked();
        }
    });

    test('should not have batch checkbox in Recovery section', async ({ page }) => {
        await page.goto('/record');
        await page.waitForLoadState('networkidle');

        const recoverySection = page.locator('section', { has: page.locator('h2', { hasText: 'Recovery' }) });

        if (await recoverySection.count() > 0) {
            const headingInput = recoverySection.locator('h2 input[type="checkbox"]');
            await expect(headingInput).not.toBeVisible();
        }
    });
});
