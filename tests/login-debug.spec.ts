import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test('Minimal Login Test', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('#email', 'sim_host@test.com');
    await page.fill('#password', 'SimPassword123!');
    await page.click('button[type="submit"]');

    // Wait for redirect
    await page.waitForURL(url => url.pathname === '/dashboard', { timeout: 30000 });
    await expect(page.locator('text=Welcome')).toBeVisible();
});
