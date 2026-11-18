import * as THREE from 'three';
import { damp, deg2rad } from './utils.js';

/**
 * Câmeras predefinidas + câmeras de acompanhamento.
 * Presets "fixos" são posicionamentos; "tracking" seguem alvos dinâmicos.
 */
export class CameraDirector {
  constructor(stage) {
    this.stage = stage;
    this.camera = stage.camera;
    this.controls = stage.controls;
    this.mode = 'overview';
    this._targetPos = new THREE.Vector3();
    this._targetLook = new THREE.Vector3();
    this._tracking = null;   // função que retorna {pos, look}
    this._lerpK = 3.2;
    this._userFree = false;
  }

  /** Definições expostas ao seletor de câmera da UI */
  static presetsInfo = [
    { id: 'overview', label: 'Visão geral da bancada' },
    { id: 'top', label: 'Visão superior' },
    { id: 'side', label: 'Visão lateral' },
    { id: 'front', label: 'Frontal — junta' },
    { id: 'torch', label: 'Aproximada — maçarico' },
    { id: 'pool', label: 'Poça de fusão (acompanhamento)' },
    { id: 'chase', label: 'Acompanhamento do maçarico' },
    { id: 'compare', label: 'Comparação lado A / lado B' },
    { id: 'cylinders', label: 'Cilindros de gás' },
    { id: 'extinguisher', label: 'Área de prevenção de incêndio' },
    { id: 'braze', label: 'Brasagem — visão geral' },
    { id: 'brazeClose', label: 'Brasagem — junta (corte)' },
    { id: 'brazeCut', label: 'Brasagem — face de corte' }
  ];

  /** Centro do interesse atual — os módulos informam (ex.: estação A) */
  anchor = { torch: new THREE.Vector3(0, 20, 0), pool: new THREE.Vector3(0, 3, 0) };

  set(id, immediate = false) {
    this.mode = id;
    this._tracking = null;
    const c = this.camera, look = this.controls.target;
    const setCam = (pos, tgt, k = 3.2) => {
      this._tracking = null;
      this._lerpK = k;
      this._targetPos.copy(pos);
      this._targetLook.copy(tgt);
      if (immediate) { c.position.copy(pos); look.copy(tgt); }
    };

    switch (id) {
      case 'overview':
        setCam(new THREE.Vector3(-170, 170, 280), new THREE.Vector3(0, 0, 0));
        break;
      case 'top':
        setCam(new THREE.Vector3(0, 330, 0.01), new THREE.Vector3(0, 0, 0), 2.5);
        break;
      case 'side':
        setCam(new THREE.Vector3(0, 34, 230), new THREE.Vector3(0, 4, 0), 2.5);
        break;
      case 'front':
        setCam(new THREE.Vector3(0, 30, -230), new THREE.Vector3(0, 4, 0), 2.5);
        break;
      case 'compare':
        setCam(new THREE.Vector3(0, 250, 600), new THREE.Vector3(0, 12, 0), 2.2);
        break;
      case 'cylinders':
        setCam(new THREE.Vector3(-60, 80, 90), new THREE.Vector3(-130, 45, -120), 2.5);
        break;
      case 'extinguisher':
        setCam(new THREE.Vector3(120, 90, -260), new THREE.Vector3(240, 45, -500), 2.5);
        break;
      case 'braze':
        setCam(new THREE.Vector3(25, 75, 205), new THREE.Vector3(0, 20, 0), 2.5);
        break;
      case 'brazeClose':
        setCam(new THREE.Vector3(70, 45, 115), new THREE.Vector3(0, 24, 0), 2.5);
        break;
      case 'brazeCut':
        setCam(new THREE.Vector3(0, 34, 165), new THREE.Vector3(0, 24, 0), 2.5);
        break;
      case 'torch':
      case 'pool':
      case 'chase':
        this._tracking = id;
        if (immediate) this._applyTracking(immediate);
        break;
    }
  }

  /** Câmeras de acompanhamento seguem a âncora informada pelo módulo */
  _applyTracking(snap = false) {
    const a = this.anchor;
    const c = this.camera;
    if (this._tracking === 'pool') {
      this._targetPos.set(a.pool.x - 26, a.pool.y + 22, a.pool.z + 44);
      this._targetLook.copy(a.pool);
    } else if (this._tracking === 'torch') {
      this._targetPos.set(a.torch.x - 40, a.torch.y + 26, a.torch.z + 60);
      this._targetLook.copy(a.torch);
    } else if (this._tracking === 'chase') {
      this._targetPos.set(a.torch.x - 70, a.torch.y + 34, a.torch.z + 8);
      this._targetLook.copy(a.torch);
    }
    if (snap) {
      c.position.copy(this._targetPos);
      this.controls.target.copy(this._targetLook);
    }
  }

  update(dt) {
    if (this._tracking) this._applyTracking();
    const c = this.camera;
    const k = 1 - Math.exp(-this._lerpK * dt * 60 * 0.02 * 60); // suavização estável
    c.position.lerp(this._targetPos, this._tracking ? Math.min(1, dt * 3.0) : Math.min(1, dt * this._lerpK));
    // target: aproxima suavemente
    const tgt = this.controls.target;
    tgt.lerp(this._targetLook, this._tracking ? Math.min(1, dt * 3.0) : Math.min(1, dt * this._lerpK));
    if (this._tracking) c.lookAt(tgt);
  }
}

export const deg = deg2rad;
