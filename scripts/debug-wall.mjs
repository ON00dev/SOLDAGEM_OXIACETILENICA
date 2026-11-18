import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
page.on('pageerror', e => console.log('[pageerror]', e.message));
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
await page.click('#btn-start');
await page.waitForTimeout(800);
const info = await page.evaluate(() => {
  const scene = window.OAW.stage.scene;
  const out = { fog: scene.fog && { near: scene.fog.near, far: scene.fog.far }, bg: scene.background && scene.background.getHexString(), meshes: [] };
  scene.traverse(o => {
    if (o.isMesh && (o.geometry?.type === 'PlaneGeometry')) {
      const mat = Array.isArray(o.material) ? o.material[0] : o.material;
      out.meshes.push({
        pos: o.position.toArray().map(v => Math.round(v)),
        size: [o.geometry.parameters.width, o.geometry.parameters.height],
        color: mat.color?.getHexString(),
        emissive: mat.emissive?.getHexString(),
        emissiveIntensity: mat.emissiveIntensity,
        visible: o.visible
      });
    }
  });
  return out;
});
console.log(JSON.stringify(info, null, 1));
await browser.close();
