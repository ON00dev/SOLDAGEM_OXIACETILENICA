import * as THREE from 'three';

const COLORS = [0xd43d3b, 0x247cbb];
const SEGMENTS = 40;
const SIDES = 8;
const RADIUS = 1.15;

/** Mangueiras didáticas com terminais fixos e folga com resposta amortecida. */
export function connectHoses(parent, outlets, torch) {
  const hoses = outlets.map((outlet, i) => makeHose(parent, outlet, torch.inlets[i], i));
  return {
    update(dt) { for (const hose of hoses) hose.update(dt); },
    dispose() { for (const hose of hoses) hose.dispose(); }
  };
}

function makeHose(parent, outlet, inlet, index) {
  const side = index === 0 ? -1 : 1;
  const start = new THREE.Vector3();
  const bend = new THREE.Vector3();
  const slack = new THREE.Vector3();
  const shoulder = new THREE.Vector3();
  const lead = new THREE.Vector3();
  const end = new THREE.Vector3();
  const curve = new THREE.CatmullRomCurve3([start, bend, slack, shoulder, lead, end]);
  const twist = new THREE.Vector3();
  const target = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const binormal = new THREE.Vector3();
  const radial = new THREE.Vector3();
  const velocity = new THREE.Vector3();
  const centers = Array.from({ length: SEGMENTS + 1 }, () => new THREE.Vector3());

  function updateCurve(dt, snap = false) {
    parent.worldToLocal(outlet.getWorldPosition(start));
    parent.worldToLocal(inlet.getWorldPosition(end));
    parent.worldToLocal(inlet.localToWorld(lead.set(0, 10, 0)));
    bend.copy(start).add(twist.set(side * 11, 8, -8));
    slack.set(start.x + side * 12, -35, start.z - 1 + side * 5);
    target.set(
      THREE.MathUtils.lerp(start.x, lead.x, 0.68) + side * 9,
      Math.max(16, lead.y * 0.47),
      THREE.MathUtils.lerp(slack.z, lead.z, 0.17) - 6 + side * 5
    );
    if (snap) shoulder.copy(target);
    // Subpassos mantêm o amortecimento estável também em reprodução acelerada.
    const steps = Math.ceil(dt / (1 / 60));
    for (let i = 0; i < steps; i++) {
      const step = dt / steps;
      velocity.addScaledVector(twist.subVectors(target, shoulder), 48 * step);
      velocity.multiplyScalar(Math.exp(-8 * step));
      shoulder.addScaledVector(velocity, step);
    }
  }

  updateCurve(0, true);
  const geometry = new THREE.TubeGeometry(curve, SEGMENTS, RADIUS, SIDES);
  const positions = geometry.attributes.position.setUsage(THREE.DynamicDrawUsage);
  const normals = geometry.attributes.normal.setUsage(THREE.DynamicDrawUsage);
  const material = new THREE.MeshStandardMaterial({ color: COLORS[index], roughness: 0.78 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = index === 0 ? 'Mangueira de acetileno' : 'Mangueira de oxigênio';
  mesh.frustumCulled = false;
  parent.add(mesh);

  function renderTube() {
    for (let i = 0; i <= SEGMENTS; i++) curve.getPoint(i / SEGMENTS, centers[i]);
    normal.set(1, 0, 0);
    for (let i = 0; i <= SEGMENTS; i++) {
      const center = centers[i];
      tangent.subVectors(centers[Math.min(i + 1, SEGMENTS)], centers[Math.max(i - 1, 0)]).normalize();
      normal.addScaledVector(tangent, -normal.dot(tangent)).normalize();
      binormal.crossVectors(tangent, normal);
      for (let j = 0; j <= SIDES; j++) {
        const angle = 2 * Math.PI * j / SIDES;
        radial.copy(normal).multiplyScalar(-Math.cos(angle)).addScaledVector(binormal, Math.sin(angle));
        const vertex = i * (SIDES + 1) + j;
        normals.setXYZ(vertex, radial.x, radial.y, radial.z);
        radial.multiplyScalar(RADIUS).add(center);
        positions.setXYZ(vertex, radial.x, radial.y, radial.z);
      }
    }
    positions.needsUpdate = normals.needsUpdate = true;
  }

  return {
    update(dt) { updateCurve(dt); renderTube(); },
    dispose() { mesh.removeFromParent(); geometry.dispose(); material.dispose(); }
  };
}
