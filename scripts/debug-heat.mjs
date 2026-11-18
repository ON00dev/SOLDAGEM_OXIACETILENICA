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
await page.click('#btn-run-practice');
await page.waitForTimeout(300);
await page.click('.preset-btns[data-param="mixPresets"] button:nth-child(1)');
await page.locator('.param-row[data-param="speed"] input[type=range]').fill('18');
await page.waitForTimeout(20000);
const info = await page.evaluate(() => {
  const st = window.OAW.ctrl.stations[0];
  const heat = st.heat;
  // amostra a temperatura ao longo da junta (z=0) a cada ~10 células
  const zs = [];
  for (let x = -105; x <= 105; x += 15) zs.push([x, +heat.sample(x, 0).toFixed(2)]);
  const seam = heat.fusionCoverage(-105, 105);
  const hole = st._hole ? st._hole.position.toArray().map(v => +v.toFixed(1)) : null;
  return {
    progress: +st.progress.toFixed(3), done: st.done, running: st.cfg.running,
    hole, seamCov: +seam.toFixed(3),
    flamePower: st.cfg.flamePower, standoff: st.cfg.standoff,
    z0: zs,
    fpsNote: 'dt por frame: ' + (window.OAW.stage.paused ? 'pausado' : 'rodando')
  };
});
console.log(JSON.stringify(info, null, 1));
await browser.close();
