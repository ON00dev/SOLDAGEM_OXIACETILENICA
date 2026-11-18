import { chromium } from 'playwright';
const url = process.argv[2] ?? 'http://localhost:4173/';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('console', m => { if (m.type() === 'error') console.log('[console]', m.text()); });
page.on('pageerror', e => console.log('[pageerror]', e.message));

await page.goto(url, { waitUntil: 'networkidle' });
await page.click('#btn-start');
await page.waitForTimeout(1000);

console.log('carregando m8...');
await page.click('.module-item[data-id="m8"]');
await page.waitForTimeout(800);
console.log('m8 carregado, testando transporte...');
try {
  await page.click('#btn-play', { timeout: 5000 });
  console.log('play ok');
  await page.waitForTimeout(2000);
  await page.click('#btn-next', { timeout: 5000 });
  console.log('next ok');
  await page.waitForTimeout(1000);
  await page.click('#btn-prev', { timeout: 5000 });
  console.log('prev ok');
  await page.click('#btn-restart', { timeout: 5000 });
  console.log('restart ok');
} catch (e) {
  console.log('FALHA:', e.message.split('\n')[0]);
  await page.screenshot({ path: 'smoke-m8.png' });
}
await page.screenshot({ path: 'smoke-m8.png' });
await browser.close();
