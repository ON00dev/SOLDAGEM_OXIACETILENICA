import * as THREE from 'three';

/**
 * Vareta de adição (metal de adição) para soldagem oxiacetilênica.
 * A ponta fica na origem e o corpo estende-se para +Y — incline/posicione o grupo.
 * O consumo é representado reduzindo-se a escala Y (a vareta "encurta").
 */
export function buildRod(scene, { color = 0xa8adb5, length = 90 } = {}) {
  const group = new THREE.Group();
  const steel = new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.9 });
  const hot = new THREE.MeshStandardMaterial({
    color, roughness: 0.35, metalness: 0.9,
    emissive: 0x000000, emissiveIntensity: 1
  });

  const FULL_LEN = length;
  const geo = new THREE.CylinderGeometry(1.05, 1.15, FULL_LEN, 12);
  geo.translate(0, FULL_LEN / 2, 0); // ponta em y=0, corpo sobe
  const mesh = new THREE.Mesh(geo, hot);
  mesh.castShadow = true;
  group.add(mesh);

  scene.add(group);

  const api = {
    group, mesh,
    FULL_LEN,
    /** coloca a ponta em `tip` com inclinação leanDeg (corpo pende para -X se positivo) */
    place(tip, leanDeg, twistDeg = 0) {
      group.position.copy(tip);
      group.rotation.z = THREE.MathUtils.degToRad(leanDeg);
      group.rotation.y = THREE.MathUtils.degToRad(twistDeg);
    },
    /** fração consumida 0..1 */
    setConsumption(f) {
      const s = Math.max(0.12, 1 - f * 0.8);
      mesh.scale.y = s;
    },
    reset() {
      mesh.scale.y = 1;
      hot.emissive.setHex(0x000000);
    },
    /** aquecimento visual da ponta */
    setTipHeat(t01) {
      const e = THREE.MathUtils.clamp((t01 - 0.35) / 0.65, 0, 1);
      hot.emissive.setRGB(e * 1.2, e * 0.45 * e + 0.05, e * e * 0.08);
    },
    dispose() { scene.remove(group); }
  };
  return api;
}
