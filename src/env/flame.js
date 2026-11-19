import * as THREE from 'three';
import { clamp, lerp, flicker } from '../core/utils.js';

/**
 * Chama oxiacetilênica com shaders GLSL.
 *
 * Estrutura representada (didática):
 *  - cone interno (luminoso, branco-azulado) — região de maior temperatura;
 *  - envoltório externo (azul-violeta translúcido);
 *  - penacho intermediário de acetileno (esbranquiçado) — SOMENTE quando há
 *    excesso de acetileno (chama carburante).
 *
 * O parâmetro `mixRatio` é a proporção RELATIVA O₂:C₂H₂ usada apenas como
 * ilustração didática (não corresponde a regulagem real de manômetro).
 *   ~1,0 → neutra | > ~1,1 → oxidante | < ~0,95 → carburante
 */

const flameVert = /* glsl */`
  uniform float uTime;
  uniform float uFlicker;
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vViewDir;

  float hash(float n){ return fract(sin(n) * 43758.5453123); }

  void main() {
    vUv = uv;
    vec3 p = position;
    // cintilação axial: ondas sobem pela chama
    float ang = atan(p.x, p.z);
    float w = sin(uTime * (6.0 + 10.0 * uFlicker) - p.y * 1.4 + hash(ang) * 6.28)
            * (1.0 - uv.y) * 0.55 * uFlicker;
    p.x += w * 0.5;
    p.z += w * 0.4;
    // variação de raio (respiração)
    float breathe = 1.0 + 0.10 * uFlicker * sin(uTime * 9.0 + uv.y * 8.0);
    p.xz *= breathe;

    vec4 wp = modelMatrix * vec4(p, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vViewDir = normalize(cameraPosition - wp.xyz);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

function flameFrag(opacity) {
  return /* glsl */`
    uniform float uTime;
    uniform float uOpacity;
    uniform vec3 uColor;
    uniform vec3 uHot;
    varying vec2 vUv;
    varying vec3 vNormalW;
    varying vec3 vViewDir;

    void main() {
      float t = vUv.y;                 // 0 = base (bico) … 1 = ponta
      // gradiente: quente na base -> cor da região -> transparente na ponta
      vec3 col = mix(uHot, uColor, smoothstep(0.05, 0.6, t));
      // turbulência
      float n = sin(t * 24.0 - uTime * 14.0) * 0.5 + 0.5;
      col *= 0.88 + 0.24 * n;
      // silhueta volumétrica: bordas mais transparentes (fake-Fresnel)
      float edge = abs(dot(normalize(vNormalW), normalize(vViewDir)));
      float soft = smoothstep(0.0, 0.55, edge);
      // perfil axial: base forte, ponta esvanece
      float axial = (1.0 - smoothstep(0.65, 1.0, t)) * (0.55 + 0.45 * (1.0 - t));
      float a = ${opacity.toFixed(3)} * axial * soft * uOpacity;
      gl_FragColor = vec4(col, a);
      #include <colorspace_fragment>
    }
  `;
}

function makeFlameMaterial(hot, color, opacity) {
  return new THREE.ShaderMaterial({
    vertexShader: flameVert,
    fragmentShader: flameFrag(opacity),
    uniforms: {
      uTime: { value: 0 },
      uFlicker: { value: 1 },
      uOpacity: { value: 1 },
      uColor: { value: new THREE.Color(color) },
      uHot: { value: new THREE.Color(hot) }
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide
  });
}

/** perfil lathe: pontos (raio, y) de base y=0 descendo até -len */
function lathe(profile, seg = 24) {
  const pts = profile.map(([r, y]) => new THREE.Vector2(Math.max(r, 0.001), y));
  return new THREE.LatheGeometry(pts, seg);
}

export class Flame {
  constructor() {
    this.group = new THREE.Group();

    // Cone interno: base alarga no bico, ápice para baixo
    this.matCone = makeFlameMaterial(0xc6e2ff, 0x8bc5ff, 0.9);
    this.cone = new THREE.Mesh(lathe([[0.5, 0], [0.95, -0.6], [0.8, -2.2], [0.35, -4.4], [0.02, -6.2]]), this.matCone);
    this.cone.renderOrder = 31;

    // Envoltório externo
    this.matEnv = makeFlameMaterial(0x3281ff, 0x3d61ff, 0.7);
    this.env = new THREE.Mesh(
      lathe([[0.6, 0], [1.5, -1.2], [2.1, -4], [2.2, -7.5], [1.7, -11.5], [0.9, -14.5], [0.05, -15.5]]),
      this.matEnv
    );
    this.env.renderOrder = 29;

    // Penacho de acetileno (só na carburante) — entre o cone e o envoltório
    this.matFeather = makeFlameMaterial(0xe4efff, 0xf4eddb, 0.64);
    this.feather = new THREE.Mesh(
      lathe([[0.55, 0], [1.15, -1.8], [1.28, -4.5], [0.9, -8], [0.35, -11], [0.02, -12.5]]),
      this.matFeather
    );
    this.feather.renderOrder = 30;

    this.group.add(this.env, this.feather, this.cone);
    this.group.visible = false;

    this.time = 0;
    this.intensity = 0;         // 0..1 (visível / acesa)
    this.currentMix = 1.0;

    // comprimentos-alvo (escala y do mesh × comprimento base do perfil)
    this._s = { cone: { l: 1, r: 1 }, env: { l: 1, r: 1 }, feather: { l: 0, r: 1 } };
    this.setMix(1.0);           // inicia na chama neutra
  }

  /**
   * Define a mistura relativa O₂:C₂H₂ (ilustrativa).
   * @param {number} ratio 0.80 … 1.35
   */
  setMix(ratio) {
    this.currentMix = clamp(ratio, 0.8, 1.35);
    const m = this.currentMix;
    let cone, env, feather, coneR, envR, featherR;

    if (m < 0.97) {
      // carburante: penacho cresce com o excesso de acetileno
      cone = 1.05; env = 1.12;
      feather = lerp(0.58, 1, (0.97 - m) / 0.17);
      coneR = 0.95; envR = 1.1; featherR = 1.0;
      this.type = 'carburizing';
    } else if (m > 1.08) {
      // oxidante: cone interno mais curto e pontiagudo, envoltório compacto
      cone = clamp(1 - (m - 1.08) * 1.6, 0.55, 0.68); env = 0.78; feather = 0;
      coneR = 0.85; envR = 0.85; featherR = 0;
      this.type = 'oxidizing';
    } else {
      // neutra: cone interno bem definido, sem penacho
      const k = clamp((m - 0.97) / 0.11, 0, 1); // 0..1 dentro da faixa neutra
      cone = lerp(1.0, 0.9, k); env = lerp(1.05, 0.95, k); feather = 0;
      coneR = 1; envR = 1; featherR = 0;
      this.type = 'neutral';
    }
    this._target = { cone, env, feather, coneR, envR, featherR };
    // fatores de intensidade por camada, definidos pelo tipo de chama (didático):
    //  - neutra:   cone + envoltório completos, sem penacho;
    //  - oxidante: cone mais curto/compacto e envoltório mais fechado;
    //  - carburante: penacho intermediário de acetileno predominante.
    this._layer = this.type === 'oxidizing'
      ? { cone: 0.85, env: 0.75, feather: 0 }
      : this.type === 'carburizing'
        ? { cone: 0.8, env: 0.85, feather }
        : { cone: 1, env: 1, feather: 0 };

    // cores características
    this.matCone.uniforms.uColor.value.set(m > 1.08 ? 0x9fccff : 0x8bc5ff);
    this.matEnv.uniforms.uColor.value.set(m > 1.08 ? 0x5e83ff : m < 0.97 ? 0x546dff : 0x4268ff);
  }

  get typeName() { return { neutral: 'neutra', oxidizing: 'oxidante', carburizing: 'carburante' }[this.type] || '—'; }

  /** temperatura aproximada da região de trabalho (didática) */
  get workingTempC() {
    return this.type === 'neutral' ? 3150 : this.type === 'oxidizing' ? 3300 : 3000;
  }

  update(dt, t) {
    this.time = t;
    const fl = flicker(t, 0.2) * 0.5 + flicker(t, 2.7) * 0.5;
    for (const mat of [this.matCone, this.matEnv, this.matFeather]) {
      mat.uniforms.uTime.value = t;
      mat.uniforms.uFlicker.value = fl;
    }
    // aparição/apagamento suave + fatores de camada por tipo de chama
    this.intensity = clamp(this.intensity, 0, 1);
    this.group.visible = this.intensity > 0.01;
    const lf = this._layer;
    this.matCone.uniforms.uOpacity.value = this.intensity * lf.cone;
    this.matEnv.uniforms.uOpacity.value = this.intensity * lf.env;
    this.matFeather.uniforms.uOpacity.value = this.intensity * lf.feather;

    // interpolação dos comprimentos
    const k = Math.min(1, dt * 6);
    const s = (mesh, cur, length, radius) => {
      cur.l = lerp(cur.l, length, k);
      cur.r = lerp(cur.r, radius, k);
      mesh.scale.set(cur.r, cur.l, cur.r);
    };
    const { cone, env, feather, coneR, envR, featherR } = this._target;
    s(this.cone, this._s.cone, cone, coneR);
    s(this.env, this._s.env, env, envR);
    s(this.feather, this._s.feather, feather, featherR);
    this.feather.visible = this._s.feather.l > 0.02 && (this.intensity * lf.feather) > 0.05;
  }

  /** ponto onde a chama "incide" no espaço local do maçarico (y negativo) */
  get impingeY() {
    return -(this._s.env.l * 14.0);
  }
}
