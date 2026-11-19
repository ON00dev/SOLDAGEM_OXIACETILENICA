import * as THREE from 'three';
import { clamp, lerp, damp, smoothstep, flicker } from '../core/utils.js';
import { ThermalGrid, GLSL_HEAT_RAMP } from './thermal.js';
import { buildTorch } from '../env/torch.js';
import { buildRod } from '../env/rod.js';

// Dimensionamento (unidades locais da estação)
const PLATE_LEN = 240;      // comprimento de cada chapa (X)
const PLATE_W = 70;         // largura de cada chapa (Z)
const SEAM_START = -105;
const SEAM_END = 105;
const PATH_LEN = SEAM_END - SEAM_START;
const GRID_W = 128, GRID_H = 64;
const GRID_MIN = [-PLATE_LEN / 2, -PLATE_W];
const GRID_SIZE = [PLATE_LEN, PLATE_W * 2];
const BEAD_COUNT = 108;

/**
 * Estação de soldagem: duas chapas em junta de topo + maçarico + vareta +
 * grade térmica + poça de fusão + cordão progressivo.
 * Coordenadas locais: junta ao longo do eixo X em z=0; topo das chapas em y=thick.
 */
export class WeldStation {
  constructor({
    name = 'Estação',
    thick = 3,
    parent = null,
    offset = [0, 0, 0]
  } = {}) {
    this.name = name;
    this.thick = thick;
    this.group = new THREE.Group();
    this.group.position.set(...offset);
    if (parent) parent.add(this.group);

    // ---------- estado operacional ----------
    this.cfg = {
      speed: 20,           // unidades/s de avanço
      standoff: 10,        // distância bico→peça
      lean: 38,            // inclinação (graus; + = chama para +X)
      feed: 0.7,           // alimentação de vareta 0..1
      rodMode: 'ahead',    // 'ahead' | 'behind' | 'none'
      weave: 1.6,          // amplitude de oscilação transversal
      flamePower: 1.0,     // multiplicador de energia (tipo de chama)
      oxLevel: 0,          // oxidação visual acumulada
      beadJitter: 0,       // irregularidade da alimentação (geometria do cordão)
      manualTorch: false,  // posicionamento coreografado pela demonstração
      running: false
    };
    this.flameHold = false;
    this.progress = 0;
    this.done = false;
    this.onDone = null;
    this.metrics = { samples: [], burnThrough: false, startedAt: null, flameTime: { neutral: 0, oxidizing: 0, carburizing: 0 } };
    this._meltTimer = 0;
    this._hole = null;

    this.#buildPlates();
    this.#buildBead();
    this.#buildPool();
    this.#buildSparks();
    this.heat = new ThermalGrid(GRID_W, GRID_H, GRID_MIN, GRID_SIZE);
    this.torch = buildTorch(this.group);
    this.rod = buildRod(this.group);
    this.rodModeNone();
  }

  /* ================= construção ================= */

  #buildPlates() {
    const t = this.thick;
    const matA = this.#makePlateMaterial();
    const matB = this.#makePlateMaterial();
    const geoA = new THREE.BoxGeometry(PLATE_LEN, t, PLATE_W - 0.4);
    const geoB = new THREE.BoxGeometry(PLATE_LEN, t, PLATE_W - 0.4);

    this.plateA = new THREE.Mesh(geoA, matA);
    this.plateA.position.set(0, t / 2, -(PLATE_W / 2 + 0.2));
    this.plateB = new THREE.Mesh(geoB, matB);
    this.plateB.position.set(0, t / 2, (PLATE_W / 2 + 0.2));
    for (const p of [this.plateA, this.plateB]) {
      p.castShadow = p.receiveShadow = true;
      this.group.add(p);
    }
    this.plateMats = [matA, matB];
    this.plateOrigins = [this.plateA.position.clone(), this.plateB.position.clone()];

    // gabaritos/morsas nas extremidades (fixação das chapas)
    const clampMat = new THREE.MeshStandardMaterial({ color: 0x4b5058, roughness: 0.5, metalness: 0.8 });
    for (const x of [-PLATE_LEN / 2 + 14, PLATE_LEN / 2 - 14]) {
      for (const side of [-1, 1]) {
        const c = new THREE.Mesh(new THREE.BoxGeometry(16, t + 6, 10), clampMat);
        c.position.set(x, (t + 6) / 2, side * (PLATE_W + 2));
        c.castShadow = c.receiveShadow = true;
        this.group.add(c);
        const screw = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 8, 10), clampMat);
        screw.position.set(x, t + 10, side * (PLATE_W + 2));
        this.group.add(screw);
      }
    }
  }

  /** material das chapas: PBR + resposta térmica injetada via onBeforeCompile */
  #makePlateMaterial() {
    const mat = new THREE.MeshStandardMaterial({
      color: 0x868d97, metalness: 0.82, roughness: 0.46
    });
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uHeat = { value: null };
      shader.uniforms.uMin = { value: new THREE.Vector2(GRID_MIN[0], GRID_MIN[1]) };
      shader.uniforms.uSize = { value: new THREE.Vector2(GRID_SIZE[0], GRID_SIZE[1]) };
      shader.uniforms.uOx = { value: 0 };

      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vLP;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLP = position;');

      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>
uniform sampler2D uHeat;
uniform vec2 uMin;
uniform vec2 uSize;
uniform float uOx;
varying vec3 vLP;
vec3 vHeatGlow;
float vHeatVal;
${GLSL_HEAT_RAMP}`)
        .replace('#include <color_fragment>', `#include <color_fragment>
{
  vec2 hUv = (vLP.xz - uMin) / uSize;
  float h = clamp(texture2D(uHeat, hUv).r, 0.0, 1.0);
  vec3 hCol = heatRamp(h);
  float scaleAmt = uOx * smoothstep(0.04, 0.35, h) * (1.0 - smoothstep(0.5, 0.9, h));
  diffuseColor.rgb = mix(diffuseColor.rgb, hCol, clamp(h * 1.6, 0.0, 0.92));
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.24, 0.16, 0.11), clamp(scaleAmt, 0.0, 0.8));
  vHeatGlow = hCol;
  vHeatVal = h;
}`)
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
totalEmissiveRadiance += vHeatGlow * smoothstep(0.28, 0.92, vHeatVal) * 1.5;`);

      mat.userData.uniforms = shader.uniforms;
    };
    return mat;
  }

  #buildBead() {
    const geo = new THREE.SphereGeometry(1, 18, 12);
    const mat = new THREE.MeshStandardMaterial({ color: 0x9aa1ab, metalness: 0.85, roughness: 0.4 });
    mat.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nattribute vec4 aData;\nvarying vec4 vData;\nvarying vec3 vLocalPos;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvData = aData;\nvLocalPos = position;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>
          varying vec4 vData;
          varying vec3 vLocalPos;
          ${GLSL_HEAT_RAMP}`)
        .replace('#include <color_fragment>', `#include <color_fragment>
          diffuseColor.rgb = mix(diffuseColor.rgb, heatRamp(vData.x), smoothstep(0.05, 0.55, vData.x));
          // defeitos visuais do cordão (didáticos):
          // 1 = oxidado (frágil)  2 = carbonizado/poroso  3 = fusão incompleta (fraco)  4 = rebaixado/deformado
          float dCode = vData.y, dAmt = vData.z;
          if (dAmt > 0.02) {
            vec3 dCol = vec3(0.45, 0.52, 0.62);
            if (dCode > 1.5 && dCode < 2.5) dCol = vec3(0.05, 0.045, 0.04);
            else if (dCode > 2.5 && dCode < 3.5) dCol = vec3(0.30, 0.17, 0.12);
            else if (dCode > 3.5) dCol = vec3(0.22, 0.16, 0.12);
            diffuseColor.rgb = mix(diffuseColor.rgb, dCol, clamp(dAmt, 0.0, 1.0) * 0.92);
            // porosidade visual: pontos escuros na superfície carbonizada
            float h = fract(sin(dot(floor(vLocalPos * 7.0), vec3(12.9898, 78.233, 37.719))) * 43758.5);
            float pores = step(0.80, h) * step(1.5, dCode) * step(dCode, 2.5);
            diffuseColor.rgb *= 1.0 - pores * dAmt * 0.85;
          }`)
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
          totalEmissiveRadiance += heatRamp(vData.x) * smoothstep(0.2, 0.85, vData.x) * 1.35 * (1.0 - clamp(vData.z, 0.0, 1.0));`);
      mat.userData.uniforms = shader.uniforms;
    };
    this.bead = new THREE.InstancedMesh(geo, mat, BEAD_COUNT);
    this.bead.castShadow = true;
    this.bead.frustumCulled = false;
    const aData = new Float32Array(BEAD_COUNT * 4);
    this.beadGeoAttr = new THREE.InstancedBufferAttribute(aData, 4);
    geo.setAttribute('aData', this.beadGeoAttr);
    this.beadData = aData;    // por cordão: [0]=calor [1]=código de defeito [2]=intensidade [3]=reservado
    this.beadState = new Float32Array(BEAD_COUNT); // fração depositada 0..1
    this.beadHeat = new Float32Array(BEAD_COUNT);
    this._m4 = new THREE.Matrix4();
    this._q = new THREE.Quaternion();
    this._v3 = new THREE.Vector3();
    this._s3 = new THREE.Vector3();
    this.beadHeightBase = 1.1;
    this.#updateBead();
    this.group.add(this.bead);
  }

  #updateBead() {
    const spacing = PATH_LEN / (BEAD_COUNT - 1);
    const baseH = this.beadHeightBase * (1 + this.cfg.feed * 0.9);
    for (let i = 0; i < BEAD_COUNT; i++) {
      const g = this.beadState[i];
      if (g <= 0.001) {
        this._m4.makeScale(0, 0, 0);
      } else {
        const x = SEAM_START + i * spacing;
        let h = baseH * g;
        // irregularidade de alimentação (defeito didático)
        if (this.cfg.beadJitter > 0) {
          const j = 1 + this.cfg.beadJitter *
            (0.6 * Math.sin(i * 0.83) + 0.4 * Math.sin(i * 0.29 + 1.7));
          h *= Math.max(0.15, j);
        }
        this._m4.compose(
          this._v3.set(x, this.thick + h * 0.55, 0),
          this._q,
          this._s3.set(1.7 * (0.3 + 0.7 * g), Math.max(0.001, h), 2.0 * (0.3 + 0.7 * g))
        );
      }
      this.bead.setMatrixAt(i, this._m4);
    }
    this.bead.instanceMatrix.needsUpdate = true;
    this.beadGeoAttr.needsUpdate = true;
  }

  #buildPool() {
    // poça de fusão: casca laranja + núcleo claro + brilho aditivo
    const glowTex = (() => {
      const c = document.createElement('canvas'); c.width = c.height = 128;
      const g = c.getContext('2d');
      const rg = g.createRadialGradient(64, 64, 4, 64, 64, 64);
      rg.addColorStop(0, 'rgba(255,190,110,0.9)');
      rg.addColorStop(0.4, 'rgba(255,120,30,0.35)');
      rg.addColorStop(1, 'rgba(255,90,10,0)');
      g.fillStyle = rg; g.fillRect(0, 0, 128, 128);
      return new THREE.CanvasTexture(c);
    })();
    this.poolGroup = new THREE.Group();
    this.poolOuter = new THREE.Mesh(
      new THREE.SphereGeometry(1, 24, 16),
      new THREE.MeshBasicMaterial({ color: 0xff8a2a, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    this.poolCore = new THREE.Mesh(
      new THREE.SphereGeometry(1, 18, 12),
      new THREE.MeshBasicMaterial({ color: 0xfff3d0, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    this.poolGlow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false
    }));
    this.poolGlow.scale.set(14, 14, 1);
    this.poolLight = new THREE.PointLight(0xff9a40, 0, 90, 2);
    this.poolGroup.add(this.poolOuter, this.poolCore, this.poolGlow, this.poolLight);
    this.poolGroup.visible = false;
    this.group.add(this.poolGroup);
  }

  #buildSparks() {
    const N = 70;
    this.sparkN = N;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) pos[i * 3 + 1] = -999; // fora da cena até serem emitidas
    this.sparkVel = new Float32Array(N * 3);
    this.sparkLife = new Float32Array(N);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xffc06a, size: 1.5, transparent: true, opacity: 0.9,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true
    });
    this.sparks = new THREE.Points(geo, mat);
    this.sparks.frustumCulled = false;
    this.group.add(this.sparks);
    this._sparkTimer = 0;
  }

  /* ================= configuração / ciclo de vida ================= */

  rodModeNone() {
    this.rod.group.visible = this.cfg.rodMode !== 'none' && this.cfg.feed > 0.01;
  }

  configure(cfg) {
    Object.assign(this.cfg, cfg);
    this.rodModeNone();
  }

  get flameOn() { return !this.done && (this.cfg.running || this.flameHold); }

  reset() {
    this.progress = 0;
    this.done = false;
    this.flameHold = false;
    this.torch.flame.intensity = 0;
    this.metrics = { samples: [], burnThrough: false, startedAt: null, flameTime: { neutral: 0, oxidizing: 0, carburizing: 0 } };
    this._meltTimer = 0;
    this.heat.reset();
    this.beadState.fill(0);
    this.beadHeat.fill(0);
    this.beadData.fill(0);
    this.#updateBead();
    if (this._hole) { this.group.remove(this._hole); this._hole = null; }
    this.cfg.oxLevel = 0;
    this.rod.reset();
    this.rodModeNone();
    this.poolGroup.visible = false;
    this.#apply(0, 0);
  }

  /** recoloca tudo em p (0..1) e integra o estado térmico rapidamente */
  seek(p) {
    this.reset();
    const dt = 1 / 30;
    const saved = this.cfg.running;
    this.cfg.running = true;
    const target = p * PATH_LEN / Math.max(1, this.cfg.speed);
    let acc = 0;
    while (this.progress < p && acc < target + 1) {
      this.update(dt);
      acc += dt;
    }
    this.cfg.running = saved && !this.done;
  }

  /* ================= simulação ================= */

  /**
   * Passo de simulação.
   * @param {number} dt delta em segundos (já escalado pela velocidade da animação)
   */
  update(dt) {
    const cfg = this.cfg;
    const t = performance.now() / 1000;
    let completed = false;

    // --- avanço do maçarico ---
    if (cfg.running && !this.done) {
      this.progress = clamp(this.progress + (cfg.speed * dt) / PATH_LEN, 0, 1);
      if (this.progress >= 1) {
        this.done = true;
        cfg.running = false;
        this.flameHold = false;
        this.torch.flame.intensity = 0;
        completed = true;
      }
      // amostragem de métricas (modo prática)
      if (this.metrics.startedAt !== null) {
        const last = this.metrics.samples[this.metrics.samples.length - 1];
        if (!last || t - last.t > 0.12) {
          this.metrics.samples.push({ t, speed: cfg.speed, standoff: cfg.standoff, feed: cfg.feed });
        }
      }
    }

    const x = lerp(SEAM_START, SEAM_END, this.progress);
    const weaveZ = Math.sin(this.progress * PATH_LEN / 9) * cfg.weave * 0.35;

    this.#apply(x, weaveZ, dt);
    // injeção térmica subdividida junto com a difusão (independente de framerate)
    const src = this.#thermalSource();
    this.heat.step(Math.max(dt, 1 / 240), (ddt) => {
      if (src.power > 0) this.heat.inject(x, weaveZ, src.radiusCells, src.power * ddt);
    });
    this.#updateVisuals(dt, x, weaveZ);
    if (completed) this.onDone?.();
  }

  /**
   * Fonte térmica corrente (sem injeção): potência (unidade/s) e raio (células).
   * A injeção em si é feita por heat.step(), subdividida junto com a difusão
   * para que o resultado não dependa do framerate.
   */
  #thermalSource() {
    const cfg = this.cfg;
    const falloff = clamp(Math.pow(9 / Math.max(3, cfg.standoff), 2), 0.12, 1.8);
    // Calibração (ver scripts/calibrate.mjs): chama neutra + velocidade ≈16–20
    // → fusão completa sem perfuração; velocidade ≥26 → falta de fusão;
    // bico muito próximo (≤6) → superaquecimento/perfuração; distante (≥16) → frio.
    const power = this.flameOn ? 11.5 * cfg.flamePower * falloff : 0;
    const radiusCells = 2.0 + cfg.standoff * 0.09 + (this.torch.flame.type === 'carburizing' ? 0.6 : 0);
    return { power, radiusCells };
  }

  /** posiciona maçarico e vareta (sem injeção térmica) */
  #apply(x, weaveZ, dt = 0) {
    const cfg = this.cfg;
    const topY = this.thick;

    this.torch.flame.intensity = damp(this.torch.flame.intensity, this.flameOn ? 1 : 0, 8, dt);
    // posicionamento manual (ex.: aproximação coreografada)
    if (cfg.manualTorch) return;

    this.torch.place(this._v3a.set(x, topY, weaveZ), cfg.standoff, cfg.lean, 0);

    // --- vareta ---
    if (cfg.rodMode !== 'none') {
      const dir = cfg.rodMode === 'ahead' ? 1 : -1;
      const poolLive = this.heat.sample(x, 0) > 0.85;
      const rodX = x + dir * 7.5;
      const dip = poolLive ? Math.sin(this.progress * PATH_LEN / 4.5) : 0;
      const tipY = topY + (dip > 0 ? lerp(2.6, -0.5, dip) : 2.6);
      this.rod.place(this._v3b.set(rodX, tipY, weaveZ + dir * 2.2), dir * 34 + (dir === 1 ? -14 : 14), dir * 12);
      this.rod.setTipHeat(this.heat.sample(rodX - dir * 2, 0) * 0.9);
      const totalFeed = this.progress * PATH_LEN * cfg.feed * 0.05;
      this.rod.setConsumption(clamp(totalFeed / this.rod.FULL_LEN, 0, 0.9));
    } else {
      this.rod.group.visible = false;
    }
  }

  /** atualiza poça, cordão, faíscas e luzes */
  #updateVisuals(dt, x, weaveZ) {
    this.torch.flame.update(dt, performance.now() / 1000);
    const topY = this.thick;
    const s = this.heat.sample(x, weaveZ);
    const poolT = smoothstep(0.82, 1.15, s);

    // ----- poça de fusão -----
    this.poolGroup.visible = poolT > 0.02;
    if (this.poolGroup.visible) {
      const w = 2.2 + poolT * 2.6;
      const d = 1.8 + poolT * 2.0;
      const h = 0.9 + poolT * 0.7;
      this.poolOuter.scale.set(w, h, d);
      this.poolCore.scale.set(w * 0.55, h * 0.6, d * 0.55);
      this.poolOuter.position.set(x, topY + 0.2, weaveZ);
      this.poolCore.position.copy(this.poolOuter.position);
      this.poolGlow.position.set(x, topY + 1.4, weaveZ);
      this.poolGlow.material.opacity = 0.25 + poolT * 0.6;
      this.poolLight.position.set(x, topY + 6, weaveZ);
      this.poolLight.intensity = 500 * poolT * (0.85 + 0.3 * flicker(performance.now() / 1000, 1.4));
    }

    // ----- cordão: depósito progressivo + formação de defeitos -----
    const spacing = PATH_LEN / (BEAD_COUNT - 1);
    const poolHalf = 4 + poolT * 5;
    let dirty = false;
    const ftype = this.torch.flame.type;
    const active = this.flameOn;
    for (let i = 0; i < BEAD_COUNT; i++) {
      const bx = SEAM_START + i * spacing;
      const dd = Math.abs(bx - x);
      // o metal de adição só se deposita onde o próprio metal base está fundido
      const tfuse = this.heat.sample(bx, 0);
      if (dd < poolHalf && tfuse >= 0.92 && this.beadState[i] < 1) {
        this.beadState[i] = Math.min(1, this.beadState[i] + dt * 2.5);
        // cordão fraco: depositou sobre metal apenas marginalmente fundido
        if (tfuse < 1.0 && ftype === 'neutral') {
          const amt = Math.min(1, (1.0 - tfuse) / 0.2 + 0.15);
          if (amt > this.beadData[i * 4 + 2]) {
            this.beadData[i * 4 + 1] = 3;
            this.beadData[i * 4 + 2] = amt;
          }
        }
        dirty = true;
      }
      if (this.beadState[i] > 0) {
        // temperatura do cordão acompanha a grade térmica (resfriamento coerente)
        const target = this.heat.sample(bx, 0);
        const cur = this.beadData[i * 4];
        const nv = cur + (target - cur) * Math.min(1, dt * 4);
        if (Math.abs(nv - cur) > 0.004) { this.beadData[i * 4] = nv; dirty = true; }

        // ----- defeitos por exposição durante a passada -----
        // 1 oxidado (chama oxidante) · 2 carbonizado/poroso (carburante) ·
        // 4 rebaixado/deformado (poça superaquecida)
        if (active && dd < poolHalf) {
          let code = 0, amt = this.beadData[i * 4 + 2];
          if (ftype === 'oxidizing') { code = 1; amt = Math.min(1, amt + dt * 0.55); }
          else if (ftype === 'carburizing') { code = 2; amt = Math.min(1, amt + dt * 0.5); }
          else if (target > 1.26) { code = 4; amt = Math.min(1, amt + dt * 0.55); }
          if (code) {
            // pior defeito vence (códigos ordenados por gravidade relativa)
            const prev = this.beadData[i * 4 + 1];
            if (!prev || code > prev || amt > this.beadData[i * 4 + 2]) {
              this.beadData[i * 4 + 1] = code;
              this.beadData[i * 4 + 2] = Math.max(amt, this.beadData[i * 4 + 2]);
              dirty = true;
            }
          }
        }
      }
    }
    if (dirty) this.#updateBead();

    // ----- faíscas -----
    this.#updateSparks(dt, x, weaveZ, topY, poolT);

    // ----- perfuração (excesso de aporte térmico em chapa fina) -----
    if (s > 1.32 && this.thick <= 4) {
      this._meltTimer += dt;
      if (this._meltTimer > 2.2 && !this._hole) this.#makeHole(x, weaveZ);
    } else {
      this._meltTimer = Math.max(0, this._meltTimer - dt * 0.5);
    }

    // ----- oxidação acumulada (chama oxidante) -----
    if (this.torch.flame.type === 'oxidizing' && active) {
      this.cfg.oxLevel = Math.min(1, this.cfg.oxLevel + dt * 0.05);
    }
    // tempo de exposição por tipo de chama (insumo da avaliação prática)
    if (active && this.metrics.startedAt !== null) {
      this.metrics.flameTime ??= { neutral: 0, oxidizing: 0, carburizing: 0 };
      this.metrics.flameTime[ftype] += dt;
    }    for (const m of this.plateMats) {
      const u = m.userData.uniforms;
      if (u) {
        u.uHeat.value = this.heat.texture;
        u.uOx.value = this.cfg.oxLevel;
      }
    }

    // ----- luz da chama -----
    const fl = flicker(performance.now() / 1000, 0.2);
    this.torch.setFlameIntensity(this.torch.flame.intensity * fl);
  }

  #updateSparks(dt, x, z, topY, poolT) {
    const pos = this.sparks.geometry.attributes.position.array;
    this._sparkTimer -= dt;
    if (poolT > 0.4 && this._sparkTimer <= 0) {
      this._sparkTimer = 0.05 + Math.random() * 0.1;
      for (let k = 0; k < 3; k++) {
        const i = Math.floor(Math.random() * this.sparkN);
        if (this.sparkLife[i] > 0) continue;
        pos[i * 3] = x + (Math.random() - 0.5) * 3;
        pos[i * 3 + 1] = topY + 0.5;
        pos[i * 3 + 2] = z + (Math.random() - 0.5) * 2;
        this.sparkVel[i * 3] = (Math.random() - 0.5) * 18;
        this.sparkVel[i * 3 + 1] = 14 + Math.random() * 18;
        this.sparkVel[i * 3 + 2] = (Math.random() - 0.5) * 14;
        this.sparkLife[i] = 0.4 + Math.random() * 0.35;
      }
    }
    for (let i = 0; i < this.sparkN; i++) {
      if (this.sparkLife[i] > 0) {
        this.sparkLife[i] -= dt;
        this.sparkVel[i * 3 + 1] -= 55 * dt;
        pos[i * 3] += this.sparkVel[i * 3] * dt;
        pos[i * 3 + 1] += this.sparkVel[i * 3 + 1] * dt;
        pos[i * 3 + 2] += this.sparkVel[i * 3 + 2] * dt;
        if (this.sparkLife[i] <= 0) { pos[i * 3 + 1] = -999; }
      }
    }
    this.sparks.geometry.attributes.position.needsUpdate = true;
    this.sparks.visible = true;
  }

  #makeHole(x, z) {
    this.metrics.burnThrough = true;
    const g = new THREE.Group();
    const hole = new THREE.Mesh(
      new THREE.CircleGeometry(4.5, 24),
      new THREE.MeshBasicMaterial({ color: 0x060607 })
    );
    hole.rotation.x = -Math.PI / 2;
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(4.6, 0.7, 8, 24),
      new THREE.MeshStandardMaterial({ color: 0x331408, emissive: 0xff4d00, emissiveIntensity: 0.7, roughness: 0.6, metalness: 0.5 })
    );
    rim.rotation.x = -Math.PI / 2;
    g.add(hole, rim);
    g.position.set(x, this.thick + 0.05, z);
    this._hole = g;
    this.group.add(g);
  }

  /* ================= dados para avaliação prática ================= */

  evaluate() {
    const m = this.metrics;
    const cov = this.heat.fusionCoverage(SEAM_START, SEAM_END);
    let speedMean = 0, feedMean = 0, standMean = 0;
    const n = m.samples.length || 1;
    for (const s of m.samples) { speedMean += s.speed; feedMean += s.feed; standMean += s.standoff; }
    speedMean /= n; feedMean /= n; standMean /= n;
    let speedVar = 0, feedVar = 0;
    for (const s of m.samples) {
      speedVar += (s.speed - speedMean) ** 2;
      feedVar += (s.feed - feedMean) ** 2;
    }
    speedVar = Math.sqrt(speedVar / n) / Math.max(1, speedMean);
    feedVar = Math.sqrt(feedVar / n) / Math.max(0.2, feedMean);

    // estatística de defeitos ao longo do cordão (fração do comprimento afetada)
    let deposited = 0, ox = 0, carb = 0, cold = 0, sunk = 0;
    for (let i = 0; i < BEAD_COUNT; i++) {
      if (this.beadState[i] < 0.5) continue;
      deposited++;
      const code = this.beadData[i * 4 + 1], amt = this.beadData[i * 4 + 2];
      if (amt < 0.25) continue;
      if (code === 1) ox++;
      else if (code === 2) carb++;
      else if (code === 3) cold++;
      else if (code === 4) sunk++;
    }
    const den = Math.max(1, deposited);
    const ft = m.flameTime ?? { neutral: 0, oxidizing: 0, carburizing: 0 };
    const ftTotal = Math.max(0.001, ft.neutral + ft.oxidizing + ft.carburizing);

    return {
      coverage: cov,
      burnThrough: m.burnThrough,
      speedMean, feedMean, standMean,
      speedVar, feedVar,
      oxLevel: this.cfg.oxLevel,
      flame: this.torch.flame.typeName,
      runSeconds: ftTotal,
      flameShare: { neutral: ft.neutral / ftTotal, oxidizing: ft.oxidizing / ftTotal, carburizing: ft.carburizing / ftTotal },
      bead: {
        ox: ox / den, carb: carb / den, cold: cold / den, sunk: sunk / den,
        deposited: deposited / BEAD_COUNT
      }
    };
  }

  /** âncoras para câmeras de acompanhamento (coords de mundo) */
  anchors() {
    const x = lerp(SEAM_START, SEAM_END, this.progress);
    this.group.updateMatrixWorld();
    const torch = new THREE.Vector3(x, this.thick + this.cfg.standoff, 0);
    const pool = new THREE.Vector3(x, this.thick, 0);
    torch.applyMatrix4(this.group.matrixWorld);
    pool.applyMatrix4(this.group.matrixWorld);
    return { torch, pool };
  }

  _v3a = new THREE.Vector3();
  _v3b = new THREE.Vector3();
}
