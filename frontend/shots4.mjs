import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:5177/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
await page.screenshot({ path: './color-hero.png' });

await page.evaluate(() => document.getElementById('technical-focus-section')?.scrollIntoView({block:'start'}));
await page.waitForTimeout(600);
await page.evaluate(() => window.scrollBy(0, -260));
await page.waitForTimeout(500);
await page.screenshot({ path: './color-metrics.png' });
await page.evaluate(() => window.scrollBy(0, 300));
await page.waitForTimeout(500);
await page.screenshot({ path: './color-focus.png' });

// scroll to very bottom
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(700);
await page.screenshot({ path: './color-bottom.png' });

await browser.close();
console.log('done');
