import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function run() {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    const screenshotDir = path.join(process.cwd(), 'artifacts', 'audit');
    if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    console.log('Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(screenshotDir, 'home.png'), fullPage: true });
    
    console.log('Navigating to http://localhost:3000/login...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(screenshotDir, 'login.png') });

    await browser.close();
    console.log('Audit complete.');
}

run();
