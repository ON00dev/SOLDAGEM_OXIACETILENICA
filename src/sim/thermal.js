import * as THREE from 'three';
import { clamp } from '../core/utils.js';

/**
 * Grade térmica simplificada (2D) sobre a superfície das chapas.
 *
 * Modelo didático:
 *  - fonte de calor localizada injeta energia com distribuição gaussiana;
 *  - difusão por aproximação de Jacobi (2 passes por passo de simulação);
 *  - resfriamento exponencial para o ambiente.
 *
 * Armazenamento: textura de 8 bits (0–255) com escala interna 0–1,6
 * (1,0 = temperatura de fusão normalizada). Precisão ≈ 0,006 — suficiente
 * para a representação didática.
 *
 * Limitações (documentadas): não resolve condução 3D, dinâmica de fluidos
 * nem metalurgia. Mantém relações qualitativas: mais tempo/energia no ponto
 * → maior região acima da fusão; avanço mais rápido → trilha térmica mais
 * estreita; distância maior → aquecimento mais fraco.
 */
const MAX_T = 1.6;

export class ThermalGrid {
  /**
   * @param {number} w células em X
   * @param {number} h células em Z
   * @param {[number,number]} min canto mínimo em coords locais da estação
   * @param {[number,number]} size tamanho coberto (x,z)
   */
  constructor(w, h, min, size) {
    this.w = w; this.h = h;
    this.min = min; this.size = size;
    this.data = new Uint8Array(w * h);
    this.tmp = new Uint8Array(w * h);
    this.texture = new THREE.DataTexture(this.data, w, h, THREE.RedFormat, THREE.UnsignedByteType);
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.wrapS = this.texture.wrapT = THREE.ClampToEdgeWrapping;
    this.texture.needsUpdate = true;
    this._diffK = 0.085;    // condutividade didática
    this._coolK = 0.35;     // resfriamento por segundo (constante de tempo)
    this.peak = 0;
    this.fused = new Uint8Array(w); // colunas que já atingiram fusão (memória da passada)
  }

  /** temperatura normalizada (0 = frio, 1.0 = fusão, até 1.6 = sobreaquecido) */
  get(x, j) { return this.data[j * this.w + x] / 255 * MAX_T; }
  set(x, j, v) { this.data[j * this.w + x] = clamp(v / MAX_T, 0, 1) * 255; }

  /** mapeia coords locais (x,z) para índices de célula */
  toCell(x, z) {
    const cx = clamp(Math.round((x - this.min[0]) / this.size[0] * (this.w - 1)), 0, this.w - 1);
    const cz = clamp(Math.round((z - this.min[1]) / this.size[1] * (this.h - 1)), 0, this.h - 1);
    return [cx, cz];
  }

  /**
   * Injeta calor gaussiano no ponto local (x,z).
   * @param {number} x,z coordenadas locais da estação
   * @param {number} radius raio efetivo (células) — cresce com a distância bico-peça
   * @param {number} power energia por segundo na célula central (1,0 = fusão)
   */
  inject(x, z, radius, power) {
    const [cx, cz] = this.toCell(x, z);
    const r = Math.max(1, radius);
    const r2 = r * r;
    const x0 = Math.max(0, (cx - r * 2.4) | 0), x1 = Math.min(this.w - 1, (cx + r * 2.4) | 0);
    const z0 = Math.max(0, (cz - r * 2.4) | 0), z1 = Math.min(this.h - 1, (cz + r * 2.4) | 0);
    for (let j = z0; j <= z1; j++) {
      for (let i = x0; i <= x1; i++) {
        const dx = i - cx, dz = j - cz;
        const d2 = (dx * dx + dz * dz) / r2;
        if (d2 > 5.5) continue;
        const g = Math.exp(-d2);
        const idx = j * this.w + i;
        const v = this.get(i, j) + power * g;
        this.set(i, j, Math.min(MAX_T, v));
      }
    }
  }

  /** amostra temperatura interpolada (nearest) em coords locais */
  sample(x, z) {
    const [cx, cz] = this.toCell(x, z);
    return this.get(cx, cz);
  }

  /** passo de difusão + resfriamento (subdividido para ser independente de framerate) */
  step(dt, inject = null) {
    // difusão é sensível ao passo: subdivide dt em fatias ≈8 ms (como dt=1/120
    // ≈ 2 passes/frame a 60 fps). Sem isso, dt grande (câmera lenta/abas em
    // segundo plano) suprime a difusão e superaquece a poça.
    const n = clamp(Math.round(dt / 0.008), 1, 40);
    const ddt = dt / n;
    for (let s = 0; s < n; s++) {
      if (inject) inject(ddt); // fonte térmica distribuída entre as fatias
      this.#diffuse(ddt);
    }
  }

  #diffuse(dt) {
    const { w, h, data, tmp } = this;
    const k = this._diffK;
    const cool = Math.exp(-this._coolK * dt);
    for (let pass = 0; pass < 2; pass++) {
      for (let j = 0; j < h; j++) {
        const jm = Math.max(0, j - 1) * w, jp = Math.min(h - 1, j + 1) * w, jw = j * w;
        for (let i = 0; i < w; i++) {
          const c = data[jw + i];
          const lap = (data[jw + Math.max(0, i - 1)] + data[jw + Math.min(w - 1, i + 1)]
            + data[jm + i] + data[jp + i]) * 0.25 - c;
          tmp[jw + i] = clamp((c / 255 + k * lap * 4 / 255) * cool, 0, 1) * 255;
        }
      }
      data.set(tmp);
    }
    let peak = 0;
    for (let i = 0; i < data.length; i++) if (data[i] > peak) peak = data[i];
    this.peak = peak / 255 * MAX_T;
    // registra (latch) colunas que atingiram fusão em algum momento da passada
    const zc = Math.round((0 - this.min[1]) / this.size[1] * (this.h - 1));
    for (let i = 0; i < this.w; i++) {
      if (this.fused[i]) continue;
      for (let dz = -2; dz <= 2; dz++) {
        const j = clamp(zc + dz, 0, this.h - 1);
        if (this.data[j * this.w + i] >= 255 / MAX_T) { this.fused[i] = 1; break; }
      }
    }
    this.texture.needsUpdate = true;
  }

  /**
   * fração da faixa central que ATINGIU a fusão em algum momento (memória da
   * passada — independe do resfriamento posterior). Usada pelo modo prática.
   * @param {number} [x0] limite inicial em coords locais (opcional — padrão: toda a grade)
   * @param {number} [x1] limite final em coords locais
   */
  fusionCoverage(x0, x1) {
    const i0 = x0 === undefined ? 0 : clamp(Math.ceil((x0 - this.min[0]) / this.size[0] * (this.w - 1)), 0, this.w - 1);
    const i1 = x1 === undefined ? this.w - 1 : clamp(Math.floor((x1 - this.min[0]) / this.size[0] * (this.w - 1)), 0, this.w - 1);
    const span = Math.max(1, i1 - i0 + 1);
    let fused = 0;
    for (let i = i0; i <= i1; i++) fused += this.fused[i];
    return fused / span;
  }

  reset() {
    this.data.fill(0); this.tmp.fill(0); this.fused.fill(0);
    this.texture.needsUpdate = true; this.peak = 0;
  }
}

/** rampa de cor térmica (metal frio → incandescência → fusão) em GLSL */
export const GLSL_HEAT_RAMP = /* glsl */`
  vec3 heatRamp(float t) {
    vec3 c = vec3(0.0);
    c = mix(c, vec3(0.35, 0.06, 0.02), smoothstep(0.12, 0.4, t));
    c = mix(c, vec3(0.95, 0.22, 0.03), smoothstep(0.4, 0.65, t));
    c = mix(c, vec3(1.0, 0.6, 0.12), smoothstep(0.65, 0.82, t));
    c = mix(c, vec3(1.0, 0.92, 0.72), smoothstep(0.82, 0.97, t));
    return c;
  }
`;

/** cor térmica no lado CPU (varetas, poça) */
export function heatColor(t) {
  const stops = [
    [0.12, 0x591005], [0.4, 0x8f2106], [0.65, 0xf23808],
    [0.82, 0xff9922], [0.97, 0xffeab8]
  ];
  const c = new THREE.Color(0x000000);
  for (let i = 0; i < stops.length - 1; i++) {
    const [a, ca] = stops[i], [b, cb] = stops[i + 1];
    if (t >= a && t <= b) {
      c.set(ca).lerp(new THREE.Color(cb), (t - a) / (b - a));
      return c;
    }
  }
  if (t >= stops[stops.length - 1][0]) c.set(stops[stops.length - 1][1]);
  return c;
}
