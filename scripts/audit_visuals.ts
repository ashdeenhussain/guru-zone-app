import { chromium, devices } from 'playwright';
import fs from 'fs';
import path from 'path';

async function run() {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    const baseUrl = 'http://localhost:3000';
    const screenshotDir = path.join(process.cwd(), 'artifacts', 'audit_screenshots');
    if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
    }

    try {
        console.log('Navigating to homepage...');
        await page.goto(baseUrl);
        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(screenshotDir, 'home_desktop.png'), fullPage: true });

        // Mobile view
        console.log('Checking mobile view...');
        const mobileContext = await browser.newContext({ ...devices['iPhone 12'] });
        const mobilePage = await mobileContext.newPage();
        await mobilePage.goto(baseUrl);
        await mobilePage.waitForTimeout(2000);
        await mobilePage.screenshot({ path: path.join(screenshotDir, 'home_mobile.png'), fullPage: true });
        await mobilePage.close();

        // Login
        console.log('Logging in...');
        await page.goto(`${baseUrl}/login`); // Adjust path if needed
        // Find login selectors
        // Assuming typical fields based on prev context or common patterns
        // If it fails, I'll check the login page structure first
        try {
            await page.fill('input[type="email"]', 'test_user1@test.com');
            await page.fill('input[type="password"]', 'password123');
            await page.click('button[type="submit"]');
            await page.waitForURL('**/dashboard', { timeout: 5000 });
        } catch (e) {
            console.log('Login failed or different selectors needed. Taking error screenshot.');
            await page.screenshot({ path: path.join(screenshotDir, 'login_error.png') });
        }

        console.log('Audit Dashboard...');
        await page.screenshot({ path: path.join(screenshotDir, 'dashboard.png'), fullPage: true });

        console.log('Audit Tournaments...');
        await page.goto(`${baseUrl}/tournaments`);
        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(screenshotDir, 'tournaments.png'), fullPage: true });

        console.log('Audit Shop...');
        await page.goto(`${baseUrl}/shop`);
        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(screenshotDir, 'shop.png'), fullPage: true });

    } catch (err) {
        console.error('Audit failed:', err);
    } finally {
        await browser.close();
    }
}

run();
