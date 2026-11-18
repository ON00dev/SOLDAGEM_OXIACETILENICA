import { chromium } from 'playwright';
const url = process.argv[2] ?? 'http://localhost:4173/';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
page.on('pageerror', e => console.log('[pageerror]', e.message));
await page.goto(url, { waitUntil: 'networkidle' });
await page.click('#btn-start');
await page.waitForTimeout(1200);

// m1 — pausado na poça
await page.click('.module-item[data-id="m1"]');
await page.waitForTimeout(500);
await page.click('#btn-play');
await page.waitForTimeout(14000);
await page.selectOption('#camera-select', 'pool');
await page.waitForTimeout(1500);
await page.screenshot({ path: 'shots/m1-pool.png' });

// m2 — três chamas
await page.click('.module-item[data-id="m2"]');
await page.waitForTimeout(600);
await page.click('#btn-play');
await page.waitForTimeout(3000);
await page.selectOption('#camera-select', 'torch');
await page.waitForTimeout(1200);
await page.screenshot({ path: 'shots/m2-neutra.png' });
await page.click('#btn-next');
await page.waitForTimeout(2500);
await page.screenshot({ path: 'shots/m2-oxidante.png' });
await page.click('#btn-next');
await page.waitForTimeout(2500);
await page.screenshot({ path: 'shots/m2-carburante.png' });

// m3 — esquerda
await page.click('.module-item[data-id="m3"]');
await page.waitForTimeout(500);
await page.click('#btn-play');
await page.waitForTimeout(9000);
await page.selectOption('#camera-select', 'chase');
await page.waitForTimeout(1500);
await page.screenshot({ path: 'shots/m3-esquerda.png' });

// m4 — comparação
await page.click('.module-item[data-id="m4"]');
await page.waitForTimeout(600);
await page.click('#btn-play');
await page.waitForTimeout(15000);
await page.screenshot({ path: 'shots/m4-compare.png' });

// m6 — brasagem
await page.click('.module-item[data-id="m6"]');
await page.waitForTimeout(600);
for (let i = 0; i < 4; i++) { await page.click('#btn-next'); await page.waitForTimeout(400); }
await page.click('#btn-play');
await page.waitForTimeout(6000);
await page.screenshot({ path: 'shots/m6-braze-aquecimento.png' });
await page.waitForTimeout(9000);
await page.screenshot({ path: 'shots/m6-braze-fluxo.png' });

console.log('screenshots ok');
await browser.close();
