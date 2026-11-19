import * as THREE from 'three';
import { Flame } from './flame.js';

/**
 * Maçarico oxiacetilênico de solda (tipo balanceado).
 * Geometria: bico (ponta de cobre), cabeça/misturador, corpo, manoplas de
 * válvula de oxigênio e acetileno, tubos curvos e conexões de mangueira.
 *
 * Convenção local: ponta do bico na origem (0,0,0), chama aponta para -Y,
 * corpo estende-se para +Y. O posicionamento/inclinação é feito pelo grupo.
 */
export function buildTorch(scene) {
  const group = new THREE.Group();

  const brass = new THREE.MeshStandardMaterial({ color: 0xc9a35a, roughness: 0.32, metalness: 0.95 });
  const copper = new THREE.MeshStandardMaterial({ color: 0xb46a3c, roughness: 0.35, metalness: 0.95 });
  const steelM = new THREE.MeshStandardMaterial({ color: 0x9aa0a8, roughness: 0.3, metalness: 0.95 });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x191b1e, roughness: 0.9, metalness: 0.05 });
  const knurlBlue = new THREE.MeshStandardMaterial({ color: 0x2d5f9e, roughness: 0.5, metalness: 0.6 });
  const knurlRed = new THREE.MeshStandardMaterial({ color: 0x9e2d2d, roughness: 0.5, metalness: 0.6 });

  const add = (mesh) => { mesh.castShadow = true; group.add(mesh); return mesh; };

  // --- Bico (ponta) — perfis de lathe: afilado, com "espigão" ---
  const tipPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.55, 0.4),
    new THREE.Vector2(0.9, 1.6),
    new THREE.Vector2(1.05, 3.2),
    new THREE.Vector2(1.15, 4.6),
    new THREE.Vector2(1.5, 5.4),
    new THREE.Vector2(1.5, 6.4)
  ];
  const tip = add(new THREE.Mesh(new THREE.LatheGeometry(tipPts, 20), copper));
  tip.position.y = 0;

  // Anel de fixação do bico (porca estriada)
  const nut = add(new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 1.4, 6), steelM));
  nut.position.y = 7.0;

  // --- Cabeça / tubo misturador ---
  const neck = add(new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.3, 7, 14), brass));
  neck.position.y = 10.5;

  // Corpo principal
  const body = add(new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.55, 16, 14), brass));
  body.position.y = 21.5;

  // Manoplas das válvulas (O2 azul, acetileno vermelho — didático e coerente com mangueiras)
  const mkValve = (y, z, mat, sign) => {
    const stem = add(new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 3.4, 8), steelM));
    stem.rotation.x = Math.PI / 2;
    stem.position.set(0, y, z * sign);
    const knob = add(new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 2.4, 8), mat));
    knob.rotation.x = Math.PI / 2;
    knob.position.set(0, y, z * sign + 2.6 * sign);
    return knob;
  };
  mkValve(20, 2.4, knurlBlue, 1);    // oxigênio
  mkValve(16.5, 2.4, knurlRed, 1);   // acetileno

  // Cabo/manopla traseira (emborrachada com anéis)
  const grip = add(new THREE.Mesh(new THREE.CylinderGeometry(1.65, 1.65, 15, 14), rubber));
  grip.position.y = 36.5;
  for (let i = 0; i < 5; i++) {
    const ring = add(new THREE.Mesh(new THREE.TorusGeometry(1.72, 0.16, 6, 18), rubber));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 31 + i * 2.7;
  }

  // Conexão traseira + dois tubos curvos para as mangueiras
  const back = add(new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 4, 12), steelM));
  back.position.y = 45.5;

  const hoseMatOx = new THREE.MeshStandardMaterial({ color: 0x1f5c8e, roughness: 0.85, metalness: 0.1 });
  const hoseMatAc = new THREE.MeshStandardMaterial({ color: 0x8e1f1f, roughness: 0.85, metalness: 0.1 });
  const up = new THREE.Vector3(0, 1, 0);
  const mkTail = (side, mat) => {
    const pts = [
      new THREE.Vector3(0, 45.5, side * 0.9),
      new THREE.Vector3(0, 48.5, side * 2.6),
      new THREE.Vector3(0, 50.5, side * 5.2),
      new THREE.Vector3(0, 52.2, side * 7.2)
    ];
    const curve = new THREE.CatmullRomCurve3(pts);
    add(new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.85, 8), mat));
    const conn = add(new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 3, 8), steelM));
    conn.position.set(0, 52.6, side * 7.8);
    conn.quaternion.setFromUnitVectors(up, pts[3].clone().sub(pts[2]).normalize());
    const outlet = new THREE.Object3D();
    outlet.position.y = 1.5;
    conn.add(outlet);
    return outlet;
  };
  const inlets = [mkTail(-1, hoseMatAc), mkTail(1, hoseMatOx)];

  // --- Chama (shaders) presa ao bico ---
  const flame = new Flame();
  group.add(flame.group);

  // Luz da chama ilumina peças e bancada
  const flameLight = new THREE.PointLight(0xffb46a, 0, 260, 2);
  flameLight.position.set(0, -6, 0);
  group.add(flameLight);

  scene.add(group);

  const api = {
    group,
    inlets,
    flame,
    flameLight,
    /**
     * Posiciona a ponta do bico no ponto de foco com inclinação.
     * @param {THREE.Vector3} focus ponto onde a chama incide
     * @param {number} standoff distância vertical bico→peça
     * @param {number} leanDeg inclinação em torno de Z (positivo: chama para +X)
     */
    place(focus, standoff, leanDeg, weaveZ = 0) {
      group.position.set(focus.x, focus.y + standoff, focus.z + weaveZ);
      group.rotation.z = THREE.MathUtils.degToRad(leanDeg);
      // leve ajuste: a ponta gira em torno da própria origem
    },
    setFlameIntensity(v) {
      // intensidade da luz acompanha a chama (com flicker aplicado pelo Flame)
      flameLight.intensity = v * 900;
    },
    dispose() { scene.remove(group); }
  };
  return api;
}
