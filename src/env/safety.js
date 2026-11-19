import * as THREE from 'three';
import { buildTorch } from './torch.js';

const FLOOR_Y = -60;

function mesh(parent, geometry, material, x, y, z) {
  const part = new THREE.Mesh(geometry, material);
  part.position.set(x, y, z);
  part.castShadow = true;
  parent.add(part);
  return part;
}

function ellipsoid(parent, material, x, y, z, sx, sy, sz) {
  const part = mesh(parent, new THREE.SphereGeometry(1, 16, 12), material, x, y, z);
  part.scale.set(sx, sy, sz);
  return part;
}

function limb(parent, material, from, to, topRadius, bottomRadius) {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const axis = b.clone().sub(a);
  const part = mesh(parent, new THREE.CylinderGeometry(topRadius, bottomRadius, axis.length(), 14), material, 0, 0, 0);
  part.position.copy(a).lerp(b, 0.5);
  part.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis.normalize());
  return part;
}

function buildOperator() {
  const operator = new THREE.Group();
  operator.name = 'Operador com EPI';
  operator.position.set(-25, FLOOR_Y, -112);
  const cloth = new THREE.MeshStandardMaterial({ color: 0x3f5368, roughness: 0.93 });
  const trousers = new THREE.MeshStandardMaterial({ color: 0x2d3846, roughness: 0.96 });
  const leather = new THREE.MeshStandardMaterial({ color: 0x926951, roughness: 0.9 });
  const suede = new THREE.MeshStandardMaterial({ color: 0xeab174, roughness: 0.95 });
  const boot = new THREE.MeshStandardMaterial({ color: 0x26292e, roughness: 0.85 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xac7656, roughness: 0.83 });
  const lens = new THREE.MeshStandardMaterial({ color: 0x132b28, emissive: 0x081811, roughness: 0.22 });

  ellipsoid(operator, trousers, 0, 54, 0, 12, 9, 7);
  ellipsoid(operator, cloth, 0, 75, 0, 16, 22, 8.5);
  const apron = ellipsoid(operator, leather, 0, 68, 7, 12, 20, 3);
  apron.rotation.x = -0.08;
  for (const sign of [-1, 1]) {
    const x = sign * 7;
    limb(operator, trousers, [x, 52, 0], [x, 28, 1], 5, 6);
    limb(operator, trousers, [x, 29, 1], [x, 7, -1], 4.5, 5.1);
    ellipsoid(operator, boot, x, 4, 2.5, 5.4, 4, 8);
    limb(operator, leather, [sign * 7, 82, 7], [sign * 10, 91, 4], 1.25, 1.25);

    const shoulder = [sign * 14, 85, 0];
    const elbow = [sign * 19, 72, 12];
    const wrist = [sign * 15, 74, 29];
    ellipsoid(operator, cloth, ...shoulder, 6, 6, 6);
    limb(operator, cloth, shoulder, elbow, 4.6, 5.1);
    limb(operator, cloth, elbow, wrist, 3.2, 4.6);
    limb(operator, suede, [sign * 17, 73.6, 23], wrist, 3.45, 4.1);
    const glove = new THREE.Group();
    glove.name = 'Luva de raspa';
    glove.position.set(sign * 14.5, 74, 31);
    operator.add(glove);
    ellipsoid(glove, suede, 0, 0, 0, 3.4, 2.55, 4.4);
    for (let i = 0; i < 4; i++) {
      const finger = ellipsoid(glove, suede, (i - 1.5) * 1.45, -0.6, 3, 0.94, 1.25, 3 - i * 0.22);
      finger.rotation.x = -0.33;
    }
    ellipsoid(glove, suede, -sign * 3, -0.7, 1, 1.35, 1.3, 2.7).rotation.y = sign * 0.5;
  }

  limb(operator, skin, [0, 89, 0], [0, 98, 0], 3.8, 4.1);
  ellipsoid(operator, skin, 0, 104, 0.5, 7.2, 9.7, 6.5);
  ellipsoid(operator, cloth, 0, 109, -0.65, 7.65, 6.2, 6.8);
  ellipsoid(operator, boot, 0, 104, 0.9, 7.35, 1.6, 6.65);
  ellipsoid(operator, skin, 0, 102, 6.5, 1.65, 2.1, 1.55);
  for (const sign of [-1, 1]) {
    ellipsoid(operator, boot, sign * 3.55, 105, 6.5, 3.7, 2.9, 1.65);
    ellipsoid(operator, lens, sign * 3.55, 105, 7.65, 2.85, 2.03, 0.85);
  }
  return operator;
}

function buildExtractor(parent, source) {
  const fan = new THREE.Group();
  fan.name = 'Ventilador de exaustão';
  fan.position.set(82, 27, -112);
  parent.add(fan);
  fan.rotation.y = Math.atan2(source.x - fan.position.x, source.z - fan.position.z);
  const frame = new THREE.MeshStandardMaterial({ color: 0xb17628, roughness: 0.55, metalness: 0.25 });
  const grille = new THREE.MeshStandardMaterial({ color: 0x626b76, roughness: 0.56, metalness: 0.28 });
  const duct = new THREE.MeshStandardMaterial({ color: 0x313a42, roughness: 0.78 });
  const blades = new THREE.MeshStandardMaterial({ color: 0xb0b8bc, roughness: 0.53, metalness: 0.25 });
  mesh(fan, new THREE.BoxGeometry(33, 4, 28), duct, 0, -85, 0);
  mesh(fan, new THREE.CylinderGeometry(3, 5, 67, 12), grille, 0, -50, 0);
  mesh(fan, new THREE.CylinderGeometry(12, 16, 13, 32), duct, 0, 0, -7).rotation.x = Math.PI / 2;
  mesh(fan, new THREE.CylinderGeometry(16.5, 16.5, 9, 36, 1, true), frame, 0, 0, 0).rotation.x = Math.PI / 2;
  mesh(fan, new THREE.TorusGeometry(15.3, 1.4, 10, 40), frame, 0, 0, 4);
  const rotor = new THREE.Group();
  fan.add(rotor);
  ellipsoid(rotor, grille, 0, 0, 1, 3.8, 3.8, 3);
  for (let i = 0; i < 5; i++) {
    const angle = i * Math.PI * 2 / 5;
    const blade = ellipsoid(rotor, blades, Math.cos(angle) * 8, Math.sin(angle) * 8, 0, 6.8, 2.5, 0.8);
    blade.rotation.z = angle + 0.22;
  }
  for (const radius of [4.7, 8, 11.6, 14.6]) {
    mesh(fan, new THREE.TorusGeometry(radius, 0.27, 6, 36), grille, 0, 0, 5.3);
  }
  for (let i = 0; i < 4; i++) {
    mesh(fan, new THREE.BoxGeometry(29, 0.58, 0.55), grille, 0, 0, 5.3).rotation.z = i * Math.PI / 4;
  }
  return { fan, rotor };
}

function makeFumeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d');
  for (const [x, y, r] of [[28, 25, 24], [40, 30, 22], [31, 40, 23]]) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
    gradient.addColorStop(0, 'rgba(255,255,255,0.88)');
    gradient.addColorStop(0.53, 'rgba(255,255,255,0.35)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
  }
  return new THREE.CanvasTexture(canvas);
}

export function buildSafetyScene(parent) {
  const group = new THREE.Group();
  parent.add(group);
  const operator = buildOperator();
  group.add(operator);
  const source = new THREE.Vector3(29, 4, -54);
  const { fan, rotor } = buildExtractor(group, source);
  const steel = new THREE.MeshStandardMaterial({ color: 0x717b86, roughness: 0.58, metalness: 0.65 });
  for (const offset of [-10, 10]) {
    mesh(group, new THREE.BoxGeometry(32, 2.5, 19), steel, source.x, 2.7, source.z + offset);
  }
  const torch = buildTorch(group);
  torch.place(source, 8, -18);

  const fumes = new THREE.Group();
  fumes.name = 'Fumos metálicos';
  fumes.visible = false;
  group.add(fumes);
  const texture = makeFumeTexture();
  const path = new THREE.QuadraticBezierCurve3(
    source, new THREE.Vector3(30, 37, -60), fan.position.clone().lerp(source, 0.09)
  );
  const particles = Array.from({ length: 22 }, () => {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, color: 0xcbd1d7, depthWrite: false }));
    fumes.add(sprite);
    return sprite;
  });
  let elapsed = 0;
  return {
    operator, fan, fumes, torch,
    update(dt, showFumes) {
      fumes.visible = showFumes;
      if (!showFumes) return;
      elapsed += dt;
      rotor.rotation.z -= dt * 9;
      for (const [i, sprite] of particles.entries()) {
        const phase = (elapsed * 0.55 + i / particles.length) % 1;
        const spread = Math.sin(phase * Math.PI) * 5;
        path.getPoint(phase, sprite.position);
        sprite.position.x += Math.sin(i * 2.2 + elapsed * 3) * spread;
        sprite.position.z += Math.cos(i * 2.2 + elapsed * 3) * spread;
        sprite.scale.setScalar(5 + 14 * Math.sin(phase * Math.PI));
        sprite.material.opacity = Math.sin(phase * Math.PI) * 0.38;
        sprite.material.rotation = i * 1.7 + elapsed * 0.4;
      }
    },
    dispose() {
      const geometries = new Set(), materials = new Set();
      group.traverse((part) => {
        if (part.isMesh) geometries.add(part.geometry);
        if (part.material) materials.add(part.material);
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      texture.dispose();
      group.removeFromParent();
    }
  };
}
