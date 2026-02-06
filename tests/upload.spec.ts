
import { test, expect } from '@playwright/test';
import path from 'path';

const BASE_URL = 'http://localhost:3000';

test.describe('Cloudinary Image Upload', () => {
    test.setTimeout(120000); // 2 minutes timeout

    test('User can upload profile picture', async ({ page }) => {
        // 1. Login
        await page.goto(`${BASE_URL}/login`);
        await page.fill('input[type="email"]', 'testuser@example.com');
        await page.fill('input[type="password"]', 'Password123!');
        await page.click('button[type="submit"]');

        // Wait for redirect to dashboard
        await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 60000 });

        // 2. Go to Profile
        await page.goto(`${BASE_URL}/dashboard/profile`);

        // 3. Click Edit
        await page.click('button:has-text("Edit Profile")');

        // 4. Upload Image
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(path.join(__dirname, 'test-image.png'));

        // Wait for upload loader to disappear
        await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 30000 });

        // 5. Save
        await page.click('button:has-text("Save Changes")');

        // 6. Verify success - ProfileClient redirects to /dashboard
        await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 60000 });

        console.log('Profile upload test passed');
    });

    test('Admin can upload tournament banner', async ({ page }) => {
        // 1. Login as Admin
        await page.goto(`${BASE_URL}/login`);
        await page.fill('input[type="email"]', 'testadmin@example.com');
        await page.fill('input[type="password"]', 'Password123!');
        await page.click('button[type="submit"]');

        // Admin redirects to /admin
        await page.waitForURL(`${BASE_URL}/admin`, { timeout: 60000 });

        // 2. Go to Admin Tournaments
        await page.goto(`${BASE_URL}/admin/tournaments`);

        // 3. Create Tournament
        await page.click('button:has-text("Create")');

        // 4. Fill Form
        await page.fill('input[placeholder="Name"]', 'Banner Test');

        // Upload Banner
        const fileInput = page.locator('input[type="file"]').first();
        await fileInput.setInputFiles(path.join(__dirname, 'test-image.png'));

        // Wait for upload
        await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 30000 });

        // Verify Preview exists
        await expect(page.locator('img[alt="Uploaded preview"]')).toBeVisible();

        console.log('Tournament banner upload preview verified');
    });
});
