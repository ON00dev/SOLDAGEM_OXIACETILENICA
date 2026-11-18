/**
 * Teste de fumaça automatizado: carrega o app, percorre os 8 módulos,
 * executa as demonstrações e coleta erros de console / páginas travadas.
 * Uso: node scripts/smoke.mjs [url]
 */
import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://localhost:4173/';
const errors = [];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(`[console] ${msg.text()}`);
});
page.on('pageerror', (err) => errors.push(`[pageerror] ${err.message}`));

await page.goto(url, { waitUntil: 'networkidle' });
await page.click('#btn-start');
await page.waitForTimeout(1500);

// verifica WebGL ativo
const webgl = await page.evaluate(() => {
  const c = document.createElement('canvas');
  return !!c.getContext('webgl2') || !!c.getContext('webgl');
});
console.log('WebGL disponível:', webgl);

const moduleIds = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8'];
for (const id of moduleIds) {
  await page.click(`.module-item[data-id="${id}"]`);
  await page.waitForTimeout(600);
  // reproduz algumas etapas
  for (let i = 0; i < 3; i++) {
    await page.click('#btn-play');
    await page.waitForTimeout(2500);
  }
  await page.click('#btn-next');
  await page.waitForTimeout(500);
  await page.click('#btn-prev');
  await page.waitForTimeout(500);
  await page.click('#btn-restart');
  await page.waitForTimeout(800);
  console.log(`Módulo ${id}: ok`);
}

// câmeras
for (const cam of ['top', 'side', 'torch', 'pool', 'chase', 'overview']) {
  await page.selectOption('#camera-select', cam);
  await page.waitForTimeout(400);
}
console.log('Câmeras: ok');

// modo prática (módulo 7 tem cenário de junta)
await page.click('.module-item[data-id="m7"]');
await page.waitForTimeout(500);
await page.selectOption('#mode-select', 'practice');
await page.waitForTimeout(500);
await page.click('#btn-run-practice');
await page.waitForTimeout(9000);
await page.click('#btn-eval-practice');
await page.waitForTimeout(500);
const score = await page.textContent('.practice-score').catch(() => null);
console.log('Prática — score:', score);

// modo apresentador + teclado
await page.selectOption('#mode-select', 'demo');
await page.keyboard.press('KeyP');
await page.waitForTimeout(400);
await page.keyboard.press('Space');
await page.waitForTimeout(1000);
await page.keyboard.press('ArrowRight');
await page.waitForTimeout(400);
await page.keyboard.press('KeyP');
console.log('Apresentador: ok');

// qualidade gráfica
for (const q of ['low', 'high', 'medium']) {
  await page.selectOption('#quality-select', q);
  await page.waitForTimeout(500);
}
console.log('Qualidade: ok');

// screenshot final para inspeção visual
await page.screenshot({ path: 'smoke-final.png' });

console.log('\n=== ERROS CAPTURADOS ===');
console.log(errors.length ? errors.join('\n') : '(nenhum)');
await browser.close();
process.exit(errors.length ? 1 : 0);
