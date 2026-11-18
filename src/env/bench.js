import * as THREE from 'three';

/**
 * Bancada de soldagem industrial: tampo metálico ripado, estrutura,
 * cilindros de gás com mangueiras coloridas (convenção: vermelha = acetileno,
 * verde = oxigênio) e válvulas de retenção (dispositivos contra retrocesso).
 */
export function buildBench(scene) {
  const g = new THREE.Group();
  scene.add(g);

  const steel = new THREE.MeshStandardMaterial({ color: 0x3c4046, roughness: 0.5, metalness: 0.85 });
  const darkSteel = new THREE.MeshStandardMaterial({ color: 0x2a2d32, roughness: 0.65, metalness: 0.7 });
  const castIron = new THREE.MeshStandardMaterial({ color: 0x34363a, roughness: 0.8, metalness: 0.4 });

  const box = (w, h, d, mat, x, y, z, rx = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.rotation.x = rx;
    m.castShadow = m.receiveShadow = true;
    g.add(m);
    return m;
  };

  // Tampo ripado (barras com vãos — característico de bancada de solda)
  const topY = 0;
  for (let i = 0; i < 14; i++) {
    const bar = box(430, 3, 9, steel, 0, topY, -84 + i * 13);
  }
  // Longarinas sob o tampo
  box(430, 6, 8, darkSteel, 0, topY - 5, -88);
  box(430, 6, 8, darkSteel, 0, topY - 5, 88);
  box(430, 6, 8, darkSteel, 0, topY - 5, 0);

  // Pernas e travessas
  for (const sx of [-200, 200]) {
    for (const sz of [-88, 88]) {
      box(9, 56, 9, darkSteel, sx, topY - 32, sz);
    }
  }
  box(392, 5, 5, darkSteel, 0, topY - 50, -88);
  box(392, 5, 5, darkSteel, 0, topY - 50, 88);

  // Torno de bancada (representação simplificada mas reconhecível)
  const vise = new THREE.Group();
  const viseBody = new THREE.Mesh(new THREE.BoxGeometry(16, 10, 12), castIron);
  viseBody.castShadow = true;
  const viseJaw = new THREE.Mesh(new THREE.BoxGeometry(3, 12, 12), castIron);
  viseJaw.position.x = 7; viseJaw.castShadow = true;
  const viseScrew = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 10, 12), steel);
  viseScrew.rotation.z = Math.PI / 2;
  viseScrew.position.set(2, 0, 0);
  vise.add(viseBody, viseJaw, viseScrew);
  vise.position.set(-185, topY + 8, 60);
  g.add(vise);

  // ---------- Cilindros de gás ----------
  const cylinders = new THREE.Group();
  const mkCylinder = (color, x, z, labelColor) => {
    const cg = new THREE.Group();
    // corpo: lathe com ombro superior
    const pts = [];
    pts.push(new THREE.Vector2(0, 0));
    pts.push(new THREE.Vector2(13, 0));
    pts.push(new THREE.Vector2(13, 6));
    pts.push(new THREE.Vector2(11.5, 9));
    pts.push(new THREE.Vector2(11.5, 92));
    pts.push(new THREE.Vector2(13, 95));
    pts.push(new THREE.Vector2(6, 98));
    pts.push(new THREE.Vector2(6, 101));
    pts.push(new THREE.Vector2(0, 101));
    const body = new THREE.Mesh(
      new THREE.LatheGeometry(pts, 28),
      new THREE.MeshStandardMaterial({ color, roughness: 0.42, metalness: 0.55 })
    );
    body.castShadow = true;
    // válvula
    const valve = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 7, 16), new THREE.MeshStandardMaterial({ color: 0x8a8f97, roughness: 0.35, metalness: 0.9 }));
    valve.position.y = 104;
    const handwheel = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.9, 8, 20), new THREE.MeshStandardMaterial({ color: 0xb03636, roughness: 0.5, metalness: 0.6 }));
    handwheel.rotation.x = Math.PI / 2;
    handwheel.position.y = 108;
    // dispositivo contra retrocesso de chama (válvula de segurança na saída)
    const arrestor = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 6, 12), new THREE.MeshStandardMaterial({ color: 0xd9b45a, roughness: 0.3, metalness: 0.9 }));
    arrestor.position.set(0, 112, 0);
    cg.add(body, valve, handwheel, arrestor);
    cg.position.set(x, -59, z);
    // corrente de fixação dos cilindros (segurança)
    const chain = new THREE.Mesh(new THREE.TorusGeometry(14.5, 0.7, 6, 30), new THREE.MeshStandardMaterial({ color: 0x555a62, roughness: 0.6, metalness: 0.8 }));
    chain.rotation.x = Math.PI / 2;
    chain.position.y = 60;
    cg.add(chain);
    cylinders.add(cg);
    return { cg, arrestor, y: 112 - 59 };
  };

  // Acetileno (vermelho) e Oxigênio (verde) — cores das mangueiras seguem a mesma convenção
  const ac = mkCylinder(0x8e1f1f, -150, -128, '#c84848');
  const ox = mkCylinder(0x1f5c8e, -110, -128, '#3a8ac0');
  cylinders.position.set(0, 0, 0);
  g.add(cylinders);

  // Mangueiras até próximo da bancada (curvas suaves)
  const hoseMat = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, metalness: 0.1 });
  const mkHose = (from, to, color) => {
    const mid = new THREE.Vector3().lerpVectors(from, to, 0.5);
    mid.y = Math.min(from.y, to.y) - 14;
    const curve = new THREE.CatmullRomCurve3([from, mid, to]);
    const hose = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 1.5, 8), hoseMat(color));
    hose.castShadow = true;
    g.add(hose);
  };
  // partem das válvulas de segurança e descem para trás da bancada
  mkHose(new THREE.Vector3(-150, 53, -128), new THREE.Vector3(-60, -50, -110), 0x8e1f1f);
  mkHose(new THREE.Vector3(-110, 53, -128), new THREE.Vector3(-40, -50, -112), 0x1f5c8e);

  // Extintor na parede (módulo de segurança) — com suporte visível
  const ext = new THREE.Group();
  const extBody = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 24, 16), new THREE.MeshStandardMaterial({ color: 0xb5251d, roughness: 0.35, metalness: 0.5 }));
  const extTop = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 5, 10), new THREE.MeshStandardMaterial({ color: 0x333, metalness: 0.8, roughness: 0.3 }));
  extTop.position.y = 14;
  const extBase = new THREE.Mesh(new THREE.CylinderGeometry(5, 5.2, 1.6, 16), new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.6, metalness: 0.6 }));
  extBase.position.y = -12.6;
  // Suporte de parede (cantoneira + abraçadeiras) para o extintor não "flutuar"
  const bracketMat = new THREE.MeshStandardMaterial({ color: 0x4a5058, roughness: 0.5, metalness: 0.7 });
  const extBracket = new THREE.Mesh(new THREE.BoxGeometry(10, 26, 1.4), bracketMat);
  extBracket.position.set(0, 0, -4.6);
  const strapTop = new THREE.Mesh(new THREE.TorusGeometry(4.9, 0.5, 8, 20), bracketMat);
  strapTop.rotation.x = Math.PI / 2;
  strapTop.position.y = 7;
  const strapBottom = strapTop.clone();
  strapBottom.position.y = -6;
  ext.add(extBody, extTop, extBase, extBracket, strapTop, strapBottom);
  ext.position.set(240, 40, -500);
  ext.rotation.z = 0.06;
  g.add(ext);

  return { group: g, arrestors: [ac.arrestor, ox.arrestor], cylinders: cylinders.position };
}
