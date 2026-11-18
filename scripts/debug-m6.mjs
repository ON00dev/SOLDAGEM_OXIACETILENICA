import { chromium } from 'playwright';
const url = process.argv[2] ?? 'http://localhost:4173/';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
page.on('console', m => { if (['error', 'warning'].includes(m.type())) console.log(`[${m.type()}]`, m.text().slice(0, 800)); });
page.on('pageerror', e => console.log('[pageerror]', e.message));
await page.goto(url, { waitUntil: 'networkidle' });
await page.click('#btn-start');
await page.waitForTimeout(1000);
await page.click('.module-item[data-id="m6"]');
await page.waitForTimeout(800);
await page.click('#btn-next'); await page.waitForTimeout(600); // corte
await page.selectOption('#camera-select', 'front');
await page.waitForTimeout(1500);
await page.screenshot({ path: 'shots/m6-front.png' });
await browser.close();
