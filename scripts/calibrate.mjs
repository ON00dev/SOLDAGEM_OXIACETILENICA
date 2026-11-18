import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
page.on('pageerror', e => console.log('[pageerror]', e.message));
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
await page.click('#btn-start');
await page.waitForTimeout(1000);
await page.click('.module-item[data-id="m7"]');
await page.waitForTimeout(500);

const rows = await page.evaluate(() => {
  const st = window.OAW.ctrl.stations[0];
  const out = [];
  for (const power of [11.5, 13, 14.5]) {
    const row = {};
    for (const speed of [12, 18, 22, 26, 34]) {
      st.reset();
      st.configure({ speed, standoff: 10, lean: 38, feed: 0.7, rodMode: 'ahead', weave: 1.6, flamePower: power / 10.5, running: true });
      const dt = 1 / 60;
      for (let i = 0; i < Math.ceil(60 * (210 / speed) + 120); i++) st.update(dt);
      const ev = st.evaluate();
      row[speed] = {
        cov: +st.heat.fusionCoverage(-105, 105).toFixed(2),
        dep: +ev.bead.deposited.toFixed(2),
        hole: st.metrics.burnThrough ? 1 : 0,
        sunk: +ev.bead.sunk.toFixed(2)
      };
    }
    out.push(row);
  }
  return out;
});
const bases = [11.5, 13, 14.5];
rows.forEach((row, i) => console.log('base', bases[i], JSON.stringify(row)));
await browser.close();
