import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
page.on('pageerror', e => console.log('[pageerror]', e.message));
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
await page.click('#btn-start');
await page.waitForTimeout(1000);
await page.evaluate(() => { window.OAW.stage.timeScale = 4; });
await page.click('.module-item[data-id="m7"]');
await page.waitForTimeout(500);
await page.selectOption('#mode-select', 'practice');
await page.waitForTimeout(400);
await page.click('.preset-btns[data-param="mixPresets"] button:nth-child(1)');
await page.locator('.param-row[data-param="speed"] input[type=range]').fill('18');
await page.click('#btn-run-practice');
await page.waitForTimeout(20000);
const info = await page.evaluate(() => {
  const st = window.OAW.ctrl.stations[0];
  const ev = st.evaluate();
  // frações depositadas em faixas ao longo do cordão
  const bins = [];
  for (let b = 0; b < 6; b++) {
    let n = 0, dep = 0;
    for (let i = b * 18; i < (b + 1) * 18; i++) { n++; if (st.beadState[i] > 0.5) dep++; }
    bins.push((dep / n).toFixed(2));
  }
  return { deposited: +ev.bead.deposited.toFixed(3), bins, done: st.done, progress: +st.progress.toFixed(3) };
});
console.log(JSON.stringify(info));
await browser.close();
