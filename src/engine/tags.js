import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import * as THREE from 'three';

/** Etiquetas 3D (HTML sobreposto via CSS2DRenderer) e seta de direção. */
export class TagSet {
  constructor() {
    this.map = {};
    this.userPref = true; // preferência global (botão "Etiquetas")
  }

  add(name, text, parent, pos, cls = '') {
    // substitui etiqueta anterior (evita acúmulo de elementos órfãos no DOM)
    const old = this.map[name];
    if (old) {
      old.element?.remove();
      old.removeFromParent?.();
    }
    const div = document.createElement('div');
    div.className = 'tag3d ' + cls;
    div.textContent = text;
    const o = new CSS2DObject(div);
    o.position.set(pos[0], pos[1], pos[2]);
    o.visible = false;
    parent.add(o);
    this.map[name] = o;
    return o;
  }

  show(name, on = true) {
    const t = this.map[name];
    if (!t) return;
    const basic = ['torch', 'rod', 'pool', 'seam'].includes(name);
    t.visible = on && (!basic || this.userPref);
  }

  showOnly(names) {
    for (const k of Object.keys(this.map)) this.show(k, names.includes(k));
  }

  hideAll() { this.showOnly([]); }

  setUserPref(v) {
    this.userPref = v;
    for (const k of ['torch', 'rod', 'pool', 'seam']) this.show(k, true);
  }
}

/** Seta de direção de avanço sobre a junta */
export function makeDirectionArrow(parent, y) {
  const arrow = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(-140, y, 0),
    48, 0xff7a1a, 10, 6
  );
  arrow.visible = false;
  parent.add(arrow);
  return arrow;
}
