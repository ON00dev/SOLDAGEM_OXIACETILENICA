import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
page.on('pageerror', e => console.log('[pageerror]', e.message));
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
await page.click('#btn-start');
await page.waitForTimeout(1000);
await page.click('.module-item[data-id="m7"]');
await page.waitForTimeout(500);
await page.selectOption('#mode-select', 'practice');
await page.waitForTimeout(400);
await page.click('#btn-run-practice');
for (let i = 0; i < 6; i++) {
  await page.waitForTimeout(2000);
  const s = await page.evaluate(() => {
    const st = window.OAW.ctrl.stations[0];
    return { progress: +st.progress.toFixed(3), done: st.done, running: st.cfg.running, speed: st.cfg.speed, samples: st.metrics.samples.length };
  });
  console.log(i, JSON.stringify(s));
}
await browser.close();
