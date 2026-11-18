import * as THREE from 'three';
import { GLSL_HEAT_RAMP } from '../sim/thermal.js';
import { buildTorch } from './torch.js';
import { buildRod } from './rod.js';
import { clamp, damp, lerp, smoothstep } from '../core/utils.js';

/**
 * Cenário de brasagem oxiacetilênica: conexão entre dois tubos de cobre
 * com luva (fitting) de latão. Recursos didáticos:
 *  - visualização em corte (clipping plane) para mostrar o preenchimento
 *    interno da folga capilar;
 *  - consumível de brasagem que funde e escoa pela folga por capilaridade;
 *  - o metal base NÃO atinge fusão — só o consumível funde.
 */
export class BrazeRig {
  constructor(parent) {
    this.group = new THREE.Group();
    parent.add(this.group);
    this.group.position.set(0, 24, 0); // eixo dos tubos a 24 unidades do tampo

    this.cutaway = false;
    this.heatLevel = 0;   // 0..1 aquecimento do conjunto
    this.flow = 0;        // 0..1 escoamento/preenchimento capilar
    this.alloy = 0;       // 0..1 fusão do consumível
    this.time = 0;

    this.#build();
  }

  #build() {
    const g = this.group;

    // materiais com aquecimento por proximidade da chama (shader)
    const mkCopperMat = (color) => {
      const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.9, roughness: 0.34 });
      mat.onBeforeCompile = (shader) => {
        shader.uniforms.uHeatLevel = { value: 0 };
        shader.uniforms.uHeatPos = { value: new THREE.Vector3(0, 0, 0) };
        shader.uniforms.uHeatR = { value: 60 };
        shader.uniforms.uFlow = { value: 0 };
        shader.vertexShader = shader.vertexShader
          .replace('#include <common>', '#include <common>\nvarying vec3 vWP;')
          .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWP = (modelMatrix * vec4(position, 1.0)).xyz;');
        shader.fragmentShader = shader.fragmentShader
          .replace('#include <common>', `#include <common>
uniform float uHeatLevel;
uniform vec3 uHeatPos;
uniform float uHeatR;
uniform float uFlow;
varying vec3 vWP;
${GLSL_HEAT_RAMP}`)
          .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
{
  float d = distance(vWP, uHeatPos);
  float t = clamp(uHeatLevel * (1.0 - d / uHeatR), 0.0, 1.0);
  totalEmissiveRadiance += heatRamp(t) * smoothstep(0.05, 0.8, t) * 1.1;
  // brilho do consumível fundido fluindo na folga
  float flowGlow = smoothstep(0.4, 1.0, uFlow) * exp(-abs(vWP.x) * 0.12);
  totalEmissiveRadiance += vec3(1.0, 0.65, 0.25) * flowGlow * 0.8 * uHeatLevel;
}`);
        mat.userData.uniforms = shader.uniforms;
      };
      return mat;
    };

    const copperMat = mkCopperMat(0xb87333);
    const brassMat = mkCopperMat(0xc9a35a);
    for (const m of [copperMat, brassMat]) m.side = THREE.DoubleSide; // interior visível no corte
    const cutMat = new THREE.MeshStandardMaterial({ color: 0xe8c49a, metalness: 0.5, roughness: 0.55, side: THREE.DoubleSide });
    this.mats = [copperMat, brassMat];

    const R_TUBE = 9, R_BORE = 9.4, R_FIT = 11.2, FIT_LEN = 44;

    // tubos (abertos para dentro da luva)
    const tubeGeo = new THREE.CylinderGeometry(R_TUBE, R_TUBE, 80, 28, 1, true);
    tubeGeo.rotateZ(Math.PI / 2);
    this.tubeL = new THREE.Mesh(tubeGeo, copperMat);
    this.tubeL.position.x = -(FIT_LEN / 2 + 40 - 2);
    this.tubeR = new THREE.Mesh(tubeGeo.clone(), copperMat);
    this.tubeR.position.x = (FIT_LEN / 2 + 40 - 2);
    // tampas internas dos tubos (evita ver através)
    const capGeo = new THREE.CylinderGeometry(R_TUBE, R_TUBE, 1, 28);
    capGeo.rotateZ(Math.PI / 2);
    const capL = new THREE.Mesh(capGeo, copperMat); capL.position.x = -(FIT_LEN / 2 + 80 - 3);
    const capR = new THREE.Mesh(capGeo.clone(), copperMat); capR.position.x = (FIT_LEN / 2 + 80 - 3);

    // luva (fitting) com furo real: perfil revolucionado — parede externa,
    // paredes das pontas e furo interno (folga capilar visível no corte)
    const fitProfile = [
      new THREE.Vector2(R_BORE, -FIT_LEN / 2),
      new THREE.Vector2(R_FIT, -FIT_LEN / 2),
      new THREE.Vector2(R_FIT, FIT_LEN / 2),
      new THREE.Vector2(R_BORE, FIT_LEN / 2),
      new THREE.Vector2(R_BORE, -FIT_LEN / 2)
    ];
    const fitGeo = new THREE.LatheGeometry(fitProfile, 30);
    fitGeo.rotateZ(Math.PI / 2);
    const fitting = new THREE.Mesh(fitGeo, brassMat);
    fitting.name = 'fitting';

    // faces de corte (meia-coroa no plano z=0, visível quando o corte está ativo)
    const sectionGeo = new THREE.RingGeometry(R_BORE, R_FIT, 32, 1, Math.PI, Math.PI);
    this.sectionL = new THREE.Mesh(sectionGeo, cutMat);
    this.sectionL.position.z = 0.01;
    this.sectionR = new THREE.Mesh(sectionGeo.clone(), cutMat);
    this.sectionR.position.z = 0.01;
    this.sections = [this.sectionL, this.sectionR];

    // consumível de brasagem (liga à base de cobre/fósforo ou prata — didático)
    const alloyGeo = new THREE.CylinderGeometry((R_TUBE + R_BORE) / 2 + 0.05, (R_TUBE + R_BORE) / 2 + 0.05, FIT_LEN * 0.96, 26, 1, true);
    alloyGeo.rotateZ(Math.PI / 2);
    this.alloyMat = new THREE.MeshStandardMaterial({
      color: 0xd8b45a, metalness: 0.75, roughness: 0.35,
      emissive: 0x000000, transparent: true, opacity: 0.95, side: THREE.DoubleSide
    });
    this.alloyMesh = new THREE.Mesh(alloyGeo, this.alloyMat);
    this.alloyMesh.visible = false;

    for (const m of [this.tubeL, this.tubeR, capL, capR, fitting, this.alloyMesh]) {
      m.castShadow = m.receiveShadow = true;
      g.add(m);
    }
    g.add(this.sectionL, this.sectionR);
    this.sectionsVisible(false);

    // apoios em V (tubo em local y=-9; tampo da bancada em y=-24 relativo)
    const standMat = new THREE.MeshStandardMaterial({ color: 0x3a3e45, roughness: 0.6, metalness: 0.7 });
    for (const x of [-70, 70]) {
      const stand = new THREE.Mesh(new THREE.BoxGeometry(14, 13, 30), standMat);
      stand.position.set(x, -15.5, 0);
      stand.castShadow = stand.receiveShadow = true;
      g.add(stand);
      const groove = new THREE.Mesh(new THREE.CylinderGeometry(R_TUBE + 0.6, R_TUBE + 0.6, 14, 20, 1, false, 0, Math.PI), standMat);
      groove.rotation.z = Math.PI / 2;
      groove.position.set(x, -9, 0);
      g.add(groove);
    }

    // maçarico + vareta de consumível
    this.torch = buildTorch(this.group);
    this.torch.group.position.set(0, 30, 0);
    this.rod = buildRod(this.group, { color: 0xd8b45a, length: 70 });
    this.rodGroup = this.rod.group;
  }

  sectionsVisible(v) {
    for (const s of this.sections) s.visible = v;
  }

  /** atualiza materiais conforme estado (corte, aquecimento, escoamento) */
  #apply() {
    // corte no plano z=0: remove a metade z>0 (câmera lateral vê o interior)
    const clip = this.cutaway ? [new THREE.Plane(new THREE.Vector3(0, 0, -1), 0)] : null;
    for (const m of this.mats) m.clippingPlanes = clip;
    this.alloyMat.clippingPlanes = clip;

    for (const m of this.mats) {
      const u = m.userData.uniforms;
      if (u) {
        u.uHeatLevel.value = this.heatLevel;
        u.uHeatPos.value.copy(this._heatPos || (this._heatPos = new THREE.Vector3(0, 0, 0)));
        u.uHeatR.value = 70;
        u.uFlow.value = this.flow;
      }
    }
    // consumível: brilho conforme fusão
    this.alloyMat.emissive.setRGB(this.alloy * 0.9, this.alloy * 0.4, this.alloy * 0.1);
    this.alloyMesh.visible = this.flow > 0.01 || this.alloy > 0.5;
    const grow = clamp(this.flow, 0.02, 1);
    this.alloyMesh.scale.x = grow;
    this.alloyMesh.position.x = 0;
  }

  /**
   * Define o estado do rig (chamado pelo controlador da demonstração).
   * @param {object} s { heatLevel, flow, alloy, torch:{x, standoff, lean, on}, rod:{x, y, consumption}, cutaway }
   */
  set(s = {}) {
    this._last = this._last || {};
    Object.assign(this._last, JSON.parse(JSON.stringify(s)));
    if (s.heatLevel !== undefined) this.heatLevel = s.heatLevel;
    if (s.flow !== undefined) this.flow = s.flow;
    if (s.alloy !== undefined) this.alloy = s.alloy;
    if (s.cutaway !== undefined) { this.cutaway = s.cutaway; this.sectionsVisible(s.cutaway); }
    if (s.torch) {
      this.torch.place(new THREE.Vector3(s.torch.x, this.group.position.y + 9, 0), s.torch.standoff ?? 14, s.torch.lean ?? 30);
      this.torchOn = s.torch.on ?? true;
      this._heatPos = new THREE.Vector3(s.torch.x, this.group.position.y + 6, 0);
    }
    if (s.rod) {
      this.rod.group.visible = true;
      this.rod.place(new THREE.Vector3(s.rod.x, this.group.position.y + R_OD() + s.rod.y, 3.5), 42, 0);
      this.rod.setConsumption(s.rod.consumption ?? 0);
      this.rod.setTipHeat(clamp(this.heatLevel * 1.1, 0, 1));
    }
    this.#apply();
  }

  update(dt, t) {
    this.time = t;
    this.torch.flame.update(dt, t);
    const on = this.torchOn ? 1 : 0;
    this.torch.flame.intensity = damp(this.torch.flame.intensity, on, 8, dt);
    this.torch.setFlameIntensity(on * (0.8 + 0.3 * Math.sin(t * 21)));
    this.torch.flameLight.intensity = on * (550 + 350 * this.heatLevel);
  }

  /** estado completo serializável (snapshots do controlador) */
  capture() {
    return JSON.parse(JSON.stringify({
      ...this._last,
      heatLevel: this.heatLevel, flow: this.flow, alloy: this.alloy, cutaway: this.cutaway
    }));
  }

  restore(s) {
    if (!s || !s.torch) { this.reset(); return; }
    this.set(s);
  }

  anchors() {
    return {
      torch: new THREE.Vector3(0, this.group.position.y + 26, 0),
      pool: new THREE.Vector3(0, this.group.position.y + 6, 0)
    };
  }

  reset() {
    this.heatLevel = 0; this.flow = 0; this.alloy = 0;
    this.cutaway = false; this.sectionsVisible(false);
    this.rod.reset();
    this.rodGroup.visible = true;
    this.#apply();
  }
}

function R_OD() { return 11.2; } // raio externo da luva — topo do conjunto
