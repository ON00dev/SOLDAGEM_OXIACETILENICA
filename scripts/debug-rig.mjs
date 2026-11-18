import { chromium } from 'playwright';
const browser = await chromium.launch();
const p = await browser.newPage();
await p.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
await p.click('#btn-start');
await p.waitForTimeout(800);
await p.click('.module-item[data-id="m6"]');
await p.waitForTimeout(500);
for (let i = 0; i < 4; i++) { await p.click('#btn-next'); await p.waitForTimeout(300); }
await p.click('#btn-play');
await p.waitForTimeout(3500);
const info = await p.evaluate(() => {
  const rig = OAW.ctrl.rig;
  return {
    rodTip: rig.rod.group.position.toArray().map(v => +v.toFixed(1)),
    rodVisible: rig.rod.group.visible,
    torchPos: rig.torch.group.position.toArray().map(v => +v.toFixed(1)),
    flameIntensity: +rig.torch.flame.intensity.toFixed(2),
    heatLevel: +rig.heatLevel.toFixed(2), flow: +rig.flow.toFixed(2), alloy: +rig.alloy.toFixed(2),
    tubeTopWorldY: 24 + 11.2
  };
});
console.log(JSON.stringify(info, null, 1));
await browser.close();
