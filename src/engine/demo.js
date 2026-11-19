import { WeldStation } from '../sim/station.js';
import { BrazeRig } from '../env/braze.js';
import { connectHoses } from '../env/hoses.js';
import { buildSafetyScene } from '../env/safety.js';
import { TagSet, makeDirectionArrow } from './tags.js';

/**
 * Controlador de demonstrações: constrói o cenário do módulo, percorre as
 * etapas com legendas sincronizadas, gerencia câmeras e integra o modo prática.
 *
 * Estados das etapas são registrados em snapshots, permitindo avançar,
 * retroceder e reiniciar com reprodução coerente da simulação.
 */
export class DemoController {
  constructor(app) {
    this.app = app; // { stage, world, director, audio, ui }
    this.module = null;
    this.scenario = null;
    this.stepIndex = 0;
    this.stepTime = 0;
    this.playing = false;
    this.mode = 'demo';
    this.tags = new TagSet();
    this.arrow = null;
    this.snapshots = [];
    this.practiceRunning = false;
  }

  /* ================= cenário ================= */

  load(def) {
    this.clearScenario();
    this.module = def;
    this.stepIndex = 0;
    this.stepTime = 0;
    this.playing = false;
    this.snapshots = [];
    this.practiceRunning = false;
    this.scenario = this.#buildScenario(def);
    this.onScenarioBuilt?.();
    this.#enterStep(0);
  }

  #buildScenario(def) {
    const s = this.#buildScenarioInner(def);
    const torches = s.stations.map(st => st.torch);
    const torch = s.rig?.torch ?? s.safety?.torch;
    if (torch) torches.push(torch);
    if (torches.length > 1) s.comparisonSupply = this.app.bench.addComparisonSupply();
    s.hoses = torches.map((tool, index) => connectHoses(
      this.app.world, index === 0 ? this.app.bench.outlets : s.comparisonSupply.outlets, tool
    ));
    return s;
  }

  #buildScenarioInner(def) {
    const world = this.app.world;
    const base = def.baseCfg || {};
    this.arrow = null;
    switch (def.scenario) {
      case 'butt':
      case 'flame': {
        const st = new WeldStation({ parent: world, thick: base.thick ?? 3, name: 'Estação A' });
        st.configure(base);
        if (def.scenario === 'flame') {
          st.progress = 0.5; // chama no centro da junta
          const f = st.torch.flame;
          this.tags.add('cone', 'Cone interno', f.cone, [-3.5, -2.7, 0]).center.set(1, 0.5);
          this.tags.add('env', 'Envoltório externo', f.env, [4, -9.5, 0]).center.set(0, 0.5);
          this.tags.add('feather', 'Penacho de acetileno', f.feather, [-4, -7.2, 0], 'orange').center.set(1, 0.5);
        }
        const arrow = makeDirectionArrow(st.group, (base.thick ?? 3) + 14);
        this.arrow = arrow;
        return { kind: 'butt', stations: [st], rig: null };
      }
      case 'compare': {
        const a = new WeldStation({ parent: world, thick: base.thick ?? 3, name: 'A — à esquerda', offset: [-235, 0, 0] });
        const b = new WeldStation({ parent: world, thick: base.thick ?? 3, name: 'B — à direita', offset: [235, 0, 0] });
        a.configure({ ...base, lean: 38, rodMode: 'ahead', speed: base.speed ?? 18 });
        b.configure({ ...base, lean: -55, rodMode: 'behind', speed: base.speed ?? 18 });
        return { kind: 'compare', stations: [a, b], rig: null };
      }
      case 'braze': {
        const rig = new BrazeRig(world);
        this.tags.add('brazeCut', 'Corte: folga capilar entre tubo e luva', rig.group, [0, 14, 6]);
        this.tags.add('brazeAlloy', 'Consumível de brasagem fundindo', rig.group, [26, 26, 0], 'orange');
        return { kind: 'braze', stations: [], rig };
      }
      case 'safety': {
        const scene = this.app.stage.scene;
        const safety = buildSafetyScene(world);
        this.tags.add('epi', 'Óculos com filtro', safety.operator, [0, 120, 5]);
        this.tags.add('gloves', 'Luvas de raspa', safety.operator, [12, 65, 36], 'orange');
        this.tags.add('vent', 'Ventilador de exaustão', safety.fan, [0, 22, 0]);
        this.tags.add('fumes', 'Fumos metálicos', safety.fumes, [40, 12, -53], 'orange');
        this.tags.add('ext', 'Extintor acessível · vigia de fogo (NR-23)', scene, [240, 62, -492], 'orange');
        this.tags.add('area', 'Área de trabalho organizada e sinalizada', scene, [10, 110, -470]);
        this.tags.add('cyl', 'Cilindros em pé e fixados', scene, [-130, 78, -120]);
        this.tags.add('arrest', 'Dispositivo contra retrocesso de chama', scene, [-108, 56, -128], 'orange');
        this.tags.add('hose', 'Mangueiras e conexões — inspecionar antes do uso', scene, [-100, 12, -112]);

        return { kind: 'safety', stations: [], rig: null, safety };
      }
      default:
        return { kind: 'none', stations: [], rig: null };
    }
  }

  clearScenario() {
    if (!this.scenario) return;
    this.tags.clear();
    for (const hoses of this.scenario.hoses) hoses.dispose();
    this.scenario.comparisonSupply?.group.removeFromParent();
    this.scenario.safety?.dispose();
    for (const st of this.scenario.stations) {
      this.app.world.remove(st.group);
      st.torch.dispose?.();
    }
    if (this.scenario.rig) {
      this.scenario.rig.torch.dispose?.();
      this.app.world.remove(this.scenario.rig.group);
    }
    this.scenario = null;
  }

  get stations() { return this.scenario?.stations ?? []; }
  get rig() { return this.scenario?.rig ?? null; }

  /* ================= contexto das etapas ================= */

  ctx() {
    const self = this;
    return {
      ctrl: this,
      stations: this.stations,
      rig: this.rig,
      tags: this.tags,
      app: this.app,
      arrow: this.arrow,
      st(i = 0) { return self.stations[i]; }
    };
  }

  #enterStep(i) {
    this.stepIndex = i;
    this.stepTime = 0;
    const step = this.module?.steps?.[i];
    if (!step) return;
    try { step.enter?.(this.ctx()); } catch (e) { console.error('Erro na etapa', i, e); }
    this.app.ui?.onStepEnter?.(i, step);
  }

  currentStep() { return this.module?.steps?.[this.stepIndex] ?? null; }

  /* ================= transporte ================= */

  play() {
    if (!this.module) return;
    if (this.mode === 'practice') {
      if (!this.practiceRunning) { this.app.ui?.startPractice(); return; }
      this.stations[0].cfg.running = true;
      this.playing = true;
      this.app.ui?.onPlayState?.(this);
      return;
    }
    const last = (this.module.steps?.length ?? 0) - 1;
    if (last < 0) return;
    // se terminou, reinicia automaticamente
    if (!this.playing && this.stepIndex >= last && this.stepTime > 0.5) {
      this.restart();
    }
    this.playing = true;
    this.app.ui?.onPlayState?.(this);
  }

  pause() {
    this.playing = false;
    if (this.mode === 'practice' && this.practiceRunning) this.stations[0].cfg.running = false;
    this.app.ui?.onPlayState?.(this);
  }

  toggle() { this.playing ? this.pause() : this.play(); }

  restart() {
    this.load(this.module);
    this.app.ui?.onPlayState?.(this);
  }

  next(auto = false) {
    const steps = this.module?.steps ?? [];
    if (this.stepIndex >= steps.length - 1) {
      if (!auto) { this.pause(); }
      return;
    }
    // registra o estado atual como fim da etapa vigente
    this.snapshots[this.stepIndex] = this.#snapshot();
    this.#enterStep(this.stepIndex + 1);
  }

  prev() {
    if (this.stepIndex === 0) { this.restart(); return; }
    const target = this.stepIndex - 1;
    this.#jumpTo(target);
  }

  jumpTo(i) {
    const steps = this.module?.steps ?? [];
    if (i < 0 || i >= steps.length) return;
    this.#jumpTo(i);
  }

  #jumpTo(target) {
    // reconstrói o cenário e reproduz instantaneamente as etapas anteriores
    this.playing = false;
    this.practiceRunning = false;
    this.clearScenario();
    this.scenario = this.#buildScenario(this.module);
    this.onScenarioBuilt?.();
    for (let k = 0; k < target; k++) {
      try { this.module.steps[k]?.enter?.(this.ctx()); } catch { /* replay tolerante */ }
    }
    const snap = this.snapshots[target - 1];
    if (snap) this.#applySnapshot(snap);
    this.#enterStep(target);
    this.app.ui?.onPlayState?.(this);
  }

  #snapshot() {
    return {
      stations: this.stations.map(s => s.progress),
      cfgs: this.stations.map(s => ({ ...s.cfg })),
      rig: this.rig ? this.rig.capture() : null
    };
  }

  #applySnapshot(snap) {
    snap.stations?.forEach((p, i) => {
      const st = this.stations[i];
      if (st) { st.configure(snap.cfgs[i]); st.seek(p); }
    });
    if (snap.rig && this.rig) this.rig.restore(snap.rig);
  }

  /* ================= atualização por frame ================= */

  update(dt, t) {
    if (!this.scenario) return;
    const step = this.currentStep();
    if (this.playing) this.stepTime += dt;

    if (step?.during && this.mode !== 'practice') {
      const k = step.dur ? Math.min(1, this.stepTime / step.dur) : 0;
      try { step.during(this.ctx(), k, dt); } catch (e) { console.error('Erro during', e); }
    }

    for (const st of this.stations) st.update(dt);
    this.rig?.update(dt, t);
    this.scenario.safety?.update(dt, Boolean(step?.showFumes));
    for (const hoses of this.scenario.hoses) hoses.update(dt);

    // auto-avanço de etapa
    if (this.playing && this.mode !== 'practice' && step?.dur && this.stepTime >= step.dur) {
      const last = this.module.steps.length - 1;
      if (this.stepIndex < last) this.next(true);
      else {
        for (const st of this.stations) st.cfg.running = false;
        this.pause();
        this.app.ui?.onDemoEnd?.(this);
      }
    }

    // âncoras de câmera
    if (this.stations.length > 0) {
      const a = this.stations[0].anchors();
      if (this.stations[1]) {
        const b = this.stations[1].anchors();
        this.app.director.anchor.pool.copy(a.pool).lerp(b.pool, 0.5);
        this.app.director.anchor.torch.copy(a.torch).lerp(b.torch, 0.5);
      } else {
        this.app.director.anchor.pool.copy(a.pool);
        this.app.director.anchor.torch.copy(a.torch);
      }
    } else if (this.rig) {
      const a = this.rig.anchors();
      this.app.director.anchor.pool.copy(a.pool);
      this.app.director.anchor.torch.copy(a.torch);
    }

    // áudio
    const active = this.stations.find(st => st.flameOn);
    const on = active || this.rig?.torchOn;
    this.app.audio?.setFlame(on ? 0.8 : 0, active?.torch.flame.type ?? this.rig?.torch.flame.type ?? 'neutral');
  }

  /* ================= modo prática ================= */

  startPractice() {
    if (this.scenario?.kind !== 'butt') return false;
    const st = this.stations[0];
    // preserva os parâmetros ajustados pelo usuário no modo prática
    const cur = {
      speed: st.cfg.speed, standoff: st.cfg.standoff, lean: st.cfg.lean,
      feed: st.cfg.feed, rodMode: st.cfg.rodMode, weave: st.cfg.weave,
      flamePower: st.cfg.flamePower
    };
    st.reset();
    st.metrics.startedAt = 0;
    st.configure({ ...cur, manualTorch: false, running: true });
    this.practiceRunning = true;
    this.playing = true;
    this.app.ui?.onPlayState?.(this);
    return true;
  }

  stopPractice() {
    if (!this.practiceRunning) return;
    this.practiceRunning = false;
    const st = this.stations[0];
    if (st) st.configure({ running: false });
    this.pause();
  }

  /** avaliação didática da passada (não é qualificação profissional) */
  evaluatePractice() {
    const st = this.stations[0];
    if (!st) return null;
    const r = st.evaluate();
    const items = [];
    let score = 0;
    const pct = (v) => (v * 100).toFixed(0);

    // ---------- 1 · fusão da junta (peso 25) ----------
    const cov = r.coverage;
    if (cov >= 0.92) {
      score += 25;
      items.push({ st: 'good', label: 'Fusão da junta', note: `Cobertura de fusão ≈ ${pct(cov)}% — a junta consolidou ao longo do trajeto.` });
    } else if (cov >= 0.7) {
      score += 15;
      items.push({ st: 'warn', label: 'Fusão da junta', note: `Cobertura ≈ ${pct(cov)}% — há trechos com fusão incompleta. Reduza a velocidade ou aproxime o bico.` });
    } else {
      items.push({ st: 'bad', label: 'Fusão da junta', note: `Cobertura ≈ ${pct(cov)}% — predominância de falta de fusão: o metal não molhou a borda. Velocidade alta ou bico distante demais.` });
    }

    // ---------- 2 · chama (peso 20) ----------
    const fs = r.flameShare;
    if (fs.neutral >= 0.8) {
      score += 20;
      items.push({ st: 'good', label: 'Tipo de chama', note: `Chama neutra em ≈ ${pct(fs.neutral)}% do tempo — a condição de referência para aço.` });
    } else if (fs.oxidizing >= 0.25) {
      score += 6;
      items.push({ st: 'bad', label: 'Tipo de chama', note: `Chama oxidante por ≈ ${pct(fs.oxidizing)}% da passada: oxida o banho, produz cordão frágil e de baixa resistência. Aumente o acetileno na mistura até a chama neutra.` });
    } else if (fs.carburizing >= 0.25) {
      score += 6;
      items.push({ st: 'bad', label: 'Tipo de chama', note: `Chama carburante por ≈ ${pct(fs.carburizing)}% da passada: enriquece carbono na superfície, endurece e fragiliza o cordão, com tendência a porosidade. Reduza o acetileno até a chama neutra.` });
    } else {
      score += 14;
      items.push({ st: 'warn', label: 'Tipo de chama', note: 'Chama fora do neutro por parte da passada — a chama deve permanecer neutra durante todo o aquecimento.' });
    }

    // ---------- 3 · aparência/condição do cordão (peso 25) ----------
    const b = r.bead;
    const visual = [];
    let visScore = 25;
    if (r.burnThrough) {
      visual.push({ st: 'bad', t: 'Perfuração da chapa', d: 'Apoio térmico excessivo por muito tempo no mesmo ponto — abriu-se um furo. Menos calor concentrado: aumente a velocidade ou a distância.' });
      visScore = 0;
    }
    if (b.carb >= 0.2) {
      visual.push({ st: 'bad', t: 'Cordão carbonizado / poroso', d: `≈ ${pct(b.carb)}% do comprimento com aparência escura e porosa — chama carburante ou vareta superaquecida. Corrija a mistura da chama para evitar a carbonização.` });
      visScore -= 12;
    }
    if (b.ox >= 0.2) {
      visual.push({ st: 'bad', t: 'Cordão oxidado (quebradiça / frágil)', d: `≈ ${pct(b.ox)}% do comprimento escurecido/acinzentado — chama oxidante destruiu o banho; o cordão fica quebradiço e fraco. Use a chama neutra.` });
      visScore -= 12;
    }
    if (b.cold >= 0.2) {
      visual.push({ st: 'bad', t: 'Cordão fraco (fraqueza / falta de fusão)', d: `≈ ${pct(b.cold)}% do comprimento depositado sobre metal não fundido — o cordão "encosta" sem se fundir: solda fraca (baixa resistência). Aumente o calor local ou reduza a velocidade.` });
      visScore -= 12;
    }
    if (b.sunk >= 0.2) {
      visual.push({ st: 'warn', t: 'Cordão deformado (rebaixado)', d: `≈ ${pct(b.sunk)}% do comprimento afundou pela poça excessivamente fluida — aporte térmico alto demais para a espessura; a solda pode ficar deformada.` });
      visScore -= 8;
    }
    if (b.deposited < 0.8) {
      visual.push({ st: 'warn', t: 'Cordão descontínuo', d: 'Trechos da junta sem metal depositado — a poça passou rápido demais em partes do trajeto.' });
      visScore -= 8;
    }
    visScore = Math.max(0, visScore);
    score += visScore;
    if (visual.length) items.push({ st: 'visual', visual });
    else items.push({ st: 'good', label: 'Aparência do cordão', note: 'Sem defeitos visuais relevantes: cordão contínuo, coloração uniforme, sem porosidade, perfuração ou afundamento.' });

    // ---------- 4 · regularidade do avanço (peso 10) ----------
    if (r.speedVar < 0.12) {
      score += 10;
      items.push({ st: 'good', label: 'Regularidade do avanço', note: 'Velocidade constante — favorece cordão uniforme em largura e reforço.' });
    } else {
      items.push({ st: 'warn', label: 'Regularidade do avanço', note: 'Variação de velocidade durante a passada — o cordão fica irregular (ondulado, com largura variável).' });
    }

    // ---------- 5 · distância bico–peça (peso 10) ----------
    const d = r.standMean;
    if (d >= 7 && d <= 14) {
      score += 10;
      items.push({ st: 'good', label: 'Distância bico–peça', note: `Média ≈ ${d.toFixed(0)} — faixa didática adequada.` });
    } else if (d < 7) {
      items.push({ st: 'warn', label: 'Distância bico–peça', note: `Média ≈ ${d.toFixed(0)} — bico muito próximo: entupimento do bico e poça difícil de controlar.` });
    } else {
      items.push({ st: 'warn', label: 'Distância bico–peça', note: `Média ≈ ${d.toFixed(0)} — bico distante: aquecimento insuficiente chega à peça (energia cai com o quadrado da distância).` });
    }

    // ---------- 6 · metal de adição (peso 10) ----------
    if (r.feedMean < 0.05) {
      score += 10;
      items.push({ st: 'good', label: 'Metal de adição', note: 'Execução autógena (sem vareta) — coerente para chapas finas.' });
    } else if (r.feedVar < 0.18) {
      score += 10;
      items.push({ st: 'good', label: 'Metal de adição', note: 'Alimentação regular — geometria do cordão uniforme.' });
    } else {
      items.push({ st: 'warn', label: 'Metal de adição', note: 'Alimentação irregular — o cordão varia entre reforço excessivo e refrescos.' });
    }

    // penalidades visuais fortes
    if (r.burnThrough) score -= 10;
    if (r.oxLevel > 0.4) score -= 5;

    const final = Math.max(0, Math.min(100, Math.round(score)));
    return {
      score: final,
      grade: final >= 85 ? 'Boa' : final >= 65 ? 'Regular' : 'Ruim',
      items,
      coverage: cov,
      burnThrough: r.burnThrough,
      bead: r.bead,
      flameShare: fs,
      conditions: {
        speed: r.speedMean,
        feed: r.feedMean,
        standoff: r.standMean,
        flame: r.flame,
        oxLevel: r.oxLevel,
        flamePower: st.cfg.flamePower,
        lean: st.cfg.lean,
        weave: st.cfg.weave
      }
    };
  }

  practiceCfg = { speed: 20, standoff: 10, lean: 38, feed: 0.7, rodMode: 'ahead', weave: 1.6, flamePower: 1, running: false };
}
