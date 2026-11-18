import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

/**
 * Núcleo de renderização: renderer, cena, iluminação industrial,
 * ambiente da bancada e laço de animação com escala de tempo.
 */
export class Stage {
  constructor(container, labelLayer) {
    this.container = container;
    this.labelLayer = labelLayer;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.localClippingEnabled = true; // usado na visualização em corte da brasagem
    container.appendChild(this.renderer.domElement);

    this.labelRenderer = new CSS2DRenderer();
    Object.assign(this.labelRenderer.domElement.style, {
      position: 'absolute', inset: '0', pointerEvents: 'none'
    });
    labelLayer.appendChild(this.labelRenderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0d0f12);
    this.scene.fog = new THREE.Fog(0x0d0f12, 700, 1900);

    this.camera = new THREE.PerspectiveCamera(45, 1, 0.5, 4000);
    this.camera.position.set(-150, 160, 260);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.maxPolarAngle = Math.PI * 0.495;
    this.controls.minDistance = 25;
    this.controls.maxDistance = 900;
    this.controls.target.set(0, 5, 0);

    this.clock = new THREE.Clock();
    this.timeScale = 1;
    this.paused = false;
    this._updaters = new Set();
    this._fixed = [];
    this.quality = 'medium';

    this.#buildLights();
    this.#buildRoom();

    this._onResize = () => this.resize();
    window.addEventListener('resize', this._onResize);
    this.resize();
  }

  /* ---------------- iluminação industrial ---------------- */
  #buildLights() {
    const hemi = new THREE.HemisphereLight(0x8fa3bd, 0x30281e, 0.55);
    this.scene.add(hemi);

    const key = new THREE.DirectionalLight(0xfff2df, 2.6);
    key.position.set(-180, 320, 160);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -350;
    key.shadow.camera.right = 350;
    key.shadow.camera.top = 350;
    key.shadow.camera.bottom = -350;
    key.shadow.camera.far = 1200;
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 1.2;
    this.scene.add(key);
    this.keyLight = key;

    const fill = new THREE.DirectionalLight(0x9db8d8, 0.7);
    fill.position.set(200, 140, -220);
    this.scene.add(fill);

    const rim = new THREE.DirectionalLight(0x6d7f96, 0.5);
    rim.position.set(60, 80, -300);
    this.scene.add(rim);
  }

  /* ---------------- sala / piso ---------------- */
  #buildRoom() {
    // Piso de concreto escuro com grade discreta (textura procedural)
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    const g = c.getContext('2d');
    g.fillStyle = '#191b1f';
    g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 9000; i++) {
      g.fillStyle = `rgba(${20 + Math.random() * 40 | 0},${20 + Math.random() * 40 | 0},${24 + Math.random() * 40 | 0},0.25)`;
      g.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
    }
    g.strokeStyle = 'rgba(70,76,86,0.55)';
    g.lineWidth = 2;
    g.strokeRect(1, 1, 510, 510);
    g.beginPath(); g.moveTo(256, 0); g.lineTo(256, 512); g.moveTo(0, 256); g.lineTo(512, 256); g.stroke();
    const floorTex = new THREE.CanvasTexture(c);
    floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
    floorTex.repeat.set(6, 6);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(3000, 3000),
      new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.95, metalness: 0.05 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -60;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Parede ao fundo com painéis metálicos
    const wall = new THREE.Mesh(
      new THREE.PlaneGeometry(2600, 900),
      new THREE.MeshStandardMaterial({ color: 0x2b313a, roughness: 0.85, metalness: 0.3, emissive: 0x2b323d, emissiveIntensity: 1.0 })
    );
    wall.position.set(0, 330, -520);
    wall.receiveShadow = true;
    this.scene.add(wall);

    // Faixa de sinalização (laranja) na parede — organização da área de trabalho
    const stripe = new THREE.Mesh(
      new THREE.PlaneGeometry(2600, 26),
      new THREE.MeshStandardMaterial({ color: 0xff7a1a, emissive: 0x602800, roughness: 0.6 })
    );
    stripe.position.set(0, 560, -518);
    this.scene.add(stripe);
  }

  /* ---------------- registro de atualizáveis ---------------- */
  /** obj: { update(dt, t) } */
  addUpdater(obj) { this._updaters.add(obj); return obj; }
  removeUpdater(obj) { this._updaters.delete(obj); }
  addFixed(fn) { this._fixed.push(fn); }

  setQuality(q) {
    this.quality = q;
    const dpr = window.devicePixelRatio || 1;
    if (q === 'low') {
      this.renderer.setPixelRatio(Math.min(dpr, 0.75));
      this.renderer.shadowMap.enabled = false;
      this.keyLight.shadow.mapSize.set(1024, 1024);
    } else if (q === 'medium') {
      this.renderer.setPixelRatio(Math.min(dpr, 1.25));
      this.renderer.shadowMap.enabled = true;
      this.keyLight.shadow.mapSize.set(2048, 2048);
    } else {
      this.renderer.setPixelRatio(Math.min(dpr, 2));
      this.renderer.shadowMap.enabled = true;
      this.keyLight.shadow.mapSize.set(4096, 4096);
    }
    this.keyLight.shadow.map?.dispose?.();
    this.keyLight.shadow.map = null;
    this.resize();
  }

  resize() {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.labelRenderer.setSize(w, h);
  }

  start() {
    this.renderer.setAnimationLoop(this._tick.bind(this));
  }

  _tick() {
    const raw = Math.min(this.clock.getDelta(), 0.05);
    const dt = this.paused ? 0 : raw * this.timeScale;
    const t = this.clock.elapsedTime;

    // OrbitControls sempre ativos (mesmo em pausa, para inspeção)
    this.controls.update();

    for (const u of this._updaters) u.update(dt, t, raw);
    for (const fn of this._fixed) fn(dt, t, raw);

    this.renderer.render(this.scene, this.camera);
    this.labelRenderer.render(this.scene, this.camera);
  }
}
