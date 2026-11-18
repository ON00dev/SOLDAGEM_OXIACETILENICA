import * as THREE from 'three';
import { Stage } from './core/stage.js';
import { CameraDirector } from './core/cameras.js';
import { FlameAudio } from './core/audio.js';
import { buildBench } from './env/bench.js';
import { DemoController } from './engine/demo.js';
import { UI } from './ui/ui.js';

/* ============================================================
   Laboratório Virtual — Soldagem Oxiacetilênica (OAW)
   Ponto de entrada: monta cena, ambiente, controlador e UI.
   ============================================================ */

const viewport = document.getElementById('viewport');
const labelLayer = document.getElementById('label-layer');

const app = { uiHud: () => app.ui?.hudUpdate?.() };

// --- núcleo 3D ---
app.stage = new Stage(viewport, labelLayer);
app.world = new THREE.Group();
app.stage.scene.add(app.world);
app.director = new CameraDirector(app.stage);
app.audio = new FlameAudio();

// --- ambiente ---
app.bench = buildBench(app.world);

// --- simulação + interface ---
app.ctrl = new DemoController(app);
app.ctrl.onScenarioBuilt = () => app.ui?.onScenarioBuilt?.();
app.ui = new UI(app);

// --- laço de animação ---
app.stage.addFixed((dt, t) => {
  app.ctrl.update(dt, t);
  app.director.update(dt);
});

app.stage.setQuality('medium');
app.stage.start();

// --- módulo inicial ---
app.ui.loadModule('m1');
app.director.set('overview', true);

// --- splash ---
const splash = document.getElementById('splash');
document.getElementById('btn-start').addEventListener('click', () => {
  splash.classList.add('hidden');
  setTimeout(() => splash.remove(), 600);
});

// expõe para depuração no console
window.OAW = app;
