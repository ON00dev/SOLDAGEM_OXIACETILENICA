import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
page.on('pageerror', e => console.log('[pageerror]', e.message));
page.on('console', m => { if (m.type() === 'error') console.log('[console.error]', m.text()); });
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
await page.click('#btn-start');
await page.waitForTimeout(1000);

// headless renderiza lento (dt limitado a 0,05 s/frame) — acelera o tempo da simulação
await page.evaluate(() => { window.OAW.stage.timeScale = 4; });

// ---- PASSADA RUIM: chama oxidante + velocidade alta ----
await page.click('.module-item[data-id="m7"]');
await page.waitForTimeout(500);
await page.selectOption('#mode-select', 'practice');
await page.waitForTimeout(400);
await page.click('#btn-run-practice');
await page.waitForTimeout(300);
await page.click('.preset-btns[data-param="mixPresets"] button:nth-child(2)');
await page.locator('.param-row[data-param="speed"] input[type=range]').fill('38');
await page.waitForTimeout(4000);
await page.waitForTimeout(8000); // deixa a passada terminar sozinha
await page.screenshot({ path: 'shots/practice-bad-bead.png' });
const badDone = await page.evaluate(() => window.OAW.ctrl.stations[0].done);
console.log('bad done:', badDone);
await page.click('#btn-eval-practice');
await page.waitForTimeout(400);
console.log('=== PASSADA RUIM ===');
console.log((await page.textContent('#practice-result')).slice(0, 1500));
await page.screenshot({ path: 'shots/practice-bad-result.png' });

// ---- PASSADA BOA: chama neutra + velocidade moderada (parâmetros antes de iniciar) ----
await page.click('.preset-btns[data-param="mixPresets"] button:nth-child(1)');
await page.locator('.param-row[data-param="speed"] input[type=range]').fill('18');
await page.click('#btn-run-practice');
await page.waitForTimeout(20000);
const goodDone = await page.evaluate(() => window.OAW.ctrl.stations[0].done);
console.log('good done:', goodDone);
await page.click('#btn-eval-practice');
await page.waitForTimeout(400);
console.log('=== PASSADA BOA ===');
console.log((await page.textContent('#practice-result')).slice(0, 1500));
await page.screenshot({ path: 'shots/practice-good-result.png' });

console.log('ok');
await browser.close();
