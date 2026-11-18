import { chromium } from 'playwright';
const url = process.argv[2] ?? 'http://localhost:4173/';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
page.on('pageerror', e => console.log('[pageerror]', e.message));
await page.goto(url, { waitUntil: 'networkidle' });
await page.click('#btn-start');
await page.waitForTimeout(1000);
await page.click('.module-item[data-id="m6"]');
await page.waitForTimeout(600);

// etapa 2: corte
await page.click('#btn-next'); await page.waitForTimeout(2500);
await page.screenshot({ path: 'shots/m6-corte.png' });
// etapa 3: aquecimento
await page.click('#btn-next'); await page.click('#btn-play');
await page.waitForTimeout(7000);
await page.screenshot({ path: 'shots/m6-aquec.png' });
// etapa 5: escoamento
await page.click('#btn-next'); await page.click('#btn-play'); // etapa 4
await page.waitForTimeout(5000);
await page.click('#btn-next'); await page.click('#btn-play'); // etapa 5
await page.waitForTimeout(5000);
await page.screenshot({ path: 'shots/m6-fluxo.png' });
console.log('ok');
await browser.close();
