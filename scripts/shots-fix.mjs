import { chromium } from 'playwright';
const url = process.argv[2] ?? 'http://localhost:4173/';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
page.on('pageerror', e => console.log('[pageerror]', e.message));
page.on('console', m => { if (m.type() === 'error') console.log('[console.error]', m.text()); });
await page.goto(url, { waitUntil: 'networkidle' });
await page.click('#btn-start');
await page.waitForTimeout(1200);

// m4 — comparação
await page.click('.module-item[data-id="m4"]');
await page.waitForTimeout(600);
await page.click('#btn-play');
await page.waitForTimeout(15000);
await page.screenshot({ path: 'shots/m4-compare.png' });

// m8 — segurança (extintor)
await page.click('.module-item[data-id="m8"]');
await page.waitForTimeout(600);
await page.selectOption('#camera-select', 'extinguisher');
await page.waitForTimeout(1500);
await page.screenshot({ path: 'shots/m8-extinguisher.png' });

console.log('screenshots ok');
await browser.close();
