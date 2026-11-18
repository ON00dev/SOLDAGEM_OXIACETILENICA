import { MODULES, GLOBAL_REFS, GLOSSARY } from '../content/modules.js';
import { CameraDirector } from '../core/cameras.js';
import { clamp } from '../core/utils.js';

/**
 * Interface: painel esquerdo (módulos/progresso), painel direito (informação,
 * controles, referências), barra de transporte, modos de aprendizagem,
 * modo apresentador e modo prática.
 */
export class UI {
  constructor(app) {
    this.app = app;
    this.module = null;
    this.mode = 'demo';
    this.progress = this.#loadProgress();
    this.$ = (id) => document.getElementById(id);

    this.#buildNav();
    this.#buildCameraSelect();
    this.#wireTransport();
    this.#wireTopbar();
    this.#wireKeyboard();
    this.#wirePresenter();
    this.#wireTabs();
  }

  /* ================= navegação de módulos ================= */

  #buildNav() {
    const nav = this.$('module-nav');
    nav.innerHTML = '';
    for (const m of MODULES) {
      const b = document.createElement('button');
      b.className = 'module-item';
      b.dataset.id = m.id;
      b.innerHTML = `<span class="module-num">${m.num}</span><span>${m.title}</span>`;
      b.addEventListener('click', () => this.loadModule(m.id));
      nav.appendChild(b);
    }
    this.#renderProgress();
  }

  #renderProgress() {
    const box = this.$('progress-list');
    box.innerHTML = '';
    for (const m of MODULES) {
      const done = this.progress[m.id] ?? 0;
      const total = m.steps?.length ?? 1;
      const pct = Math.round((done / total) * 100);
      const row = document.createElement('div');
      row.className = 'progress-row';
      row.innerHTML = `<span style="min-width:18px">${m.num}</span>
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        <span style="min-width:34px;text-align:right">${pct}%</span>`;
      box.appendChild(row);
    }
  }

  #loadProgress() {
    try { return JSON.parse(localStorage.getItem('oaw-progress') || '{}'); }
    catch { return {}; }
  }

  #saveProgress(moduleId, stepIndex) {
    const prev = this.progress[moduleId] ?? 0;
    if (stepIndex > prev) {
      this.progress[moduleId] = stepIndex;
      try { localStorage.setItem('oaw-progress', JSON.stringify(this.progress)); } catch { }
      this.#renderProgress();
    }
  }

  /* ================= carregar módulo ================= */

  loadModule(id) {
    const def = MODULES.find(m => m.id === id);
    if (!def) return;
    this.module = def;
    document.querySelectorAll('.module-item').forEach(b =>
      b.classList.toggle('active', b.dataset.id === id));

    this.app.ctrl.load(def);
    this.#attachStationHooks();

    this.#renderInfo(def);
    this.#renderControls(def);
    this.#renderRefs(def);
    this.#renderChips(def);

    this.showCompare(false);
    this.$('practice-panel').classList.add('hidden');
    this.$('practice-result').innerHTML = '';

    // começa pausado na primeira etapa, legenda visível
    const s0 = def.steps?.[0];
    if (s0) {
      this.setCaption(s0.title, s0.caption);
      if (s0.camera) this.app.director.set(s0.camera, true);
    } else {
      this.setCaption(def.title, def.intro);
    }
    this.app.uiHud?.();
    this.onPlayState(this.app.ctrl);
  }

  #attachStationHooks() {
    for (const st of this.app.ctrl.stations) {
      st.onDone = () => this.onStationDone(st);
    }
  }

  onScenarioBuilt() {
    this.#attachStationHooks();
  }

  /* ================= painel direito — informações ================= */

  #renderInfo(def) {
    const el = this.$('tab-info');
    let html = `<div class="info-head"><h2>${def.title}</h2><span class="info-tag">Módulo ${def.num}</span></div>`;
    html += `<div class="info-block"><p>${def.intro}</p></div>`;
    for (const b of def.blocks ?? []) {
      html += `<div class="info-block"><h3>${b.h}</h3><p>${b.body}</p></div>`;
    }
    if (def.conclusion) {
      html += `<div class="info-block"><h3 class="blue">Conclusão do módulo</h3>
        <div class="conclusion">${def.conclusion}</div></div>`;
    }
    // glossário no módulo 1
    if (def.id === 'm1') {
      html += `<div class="info-block"><h3 class="blue">Termos-chave</h3><ul>` +
        GLOSSARY.map(([t, d]) => `<li><strong>${t}</strong> — ${d}</li>`).join('') + `</ul></div>`;
    }
    el.innerHTML = html;
  }

  /* ================= painel direito — controles ================= */

  #renderControls(def) {
    const el = this.$('tab-controls');
    let html = '';

    if (this.mode === 'practice') {
      html += `<button id="btn-run-practice" class="action-btn">▶ Iniciar passada de prática</button>
               <button id="btn-eval-practice" class="action-btn secondary">⏹ Encerrar e avaliar</button>`;
    } else {
      html += `<p class="param-help" style="margin-bottom:12px">Alterne para o modo <strong>Prática</strong> na barra superior para controlar a passada livremente e receber uma avaliação didática.</p>`;
    }

    const cfg = def.baseCfg || {};
    for (const p of def.params ?? []) {
      const live = p.live || this.mode === 'practice' || p.kind === 'presets';
      if (p.kind === 'presets') {
        html += `<div class="param-row ${live ? '' : 'disabled'}">
          <div class="param-head"><span>${p.label}</span></div>
          <div class="preset-btns" data-param="${p.id}">
            ${p.presets.map((o, i) => `<button data-value="${o.value}" class="${i === 0 ? 'active' : ''}">${o.label}</button>`).join('')}
          </div>
          <div class="param-help">${p.help ?? ''}</div></div>`;
      } else {
        html += `<div class="param-row ${live ? '' : 'disabled'}" data-param="${p.id}">
          <div class="param-head"><span>${p.label}</span><span class="val" data-val>${String(p.value).replace('.', ',')} ${p.unit ?? ''}</span></div>
          <input type="range" min="${p.min}" max="${p.max}" step="${p.step}" value="${p.value}">
          <div class="param-help">${p.help ?? ''}</div></div>`;
      }
    }
    if (!def.params?.length && this.mode !== 'practice') {
      html += `<p class="param-help">Este módulo não possui parâmetros interativos.</p>`;
    }
    el.innerHTML = html;

    // eventos
    el.querySelectorAll('.param-row[data-param] input[type=range]').forEach(inp => {
      const row = inp.closest('.param-row');
      const id = row.dataset.param;
      const valEl = row.querySelector('[data-val]');
      const p = (def.params ?? []).find(x => x.id === id);
      inp.addEventListener('input', () => {
        const v = parseFloat(inp.value);
        if (valEl && p) valEl.textContent = String(v).replace('.', ',') + ' ' + (p.unit ?? '');
        this.applyParam(id, v);
      });
    });
    el.querySelectorAll('.preset-btns[data-param] button').forEach(btn => {
      btn.addEventListener('click', () => {
        const wrap = btn.closest('.preset-btns');
        wrap.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.applyParam(wrap.dataset.param, parseFloat(btn.dataset.value));
      });
    });

    const runBtn = el.querySelector('#btn-run-practice');
    runBtn?.addEventListener('click', () => this.startPractice());
    const evalBtn = el.querySelector('#btn-eval-practice');
    evalBtn?.addEventListener('click', () => this.finishPractice());

    this.#updateParamAvailability();
  }

  #updateParamAvailability() {
    const def = this.module;
    if (!def) return;
    const editable = this.mode === 'practice';
    document.querySelectorAll('#tab-controls .param-row').forEach(row => {
      if (row.classList.contains('preset-btns')) return;
      const id = row.dataset.param;
      const p = (def.params ?? []).find(x => x.id === id);
      const isPresetGroup = row.querySelector('.preset-btns');
      if (isPresetGroup) return;
      row.classList.toggle('disabled', !(p?.live || editable));
    });
  }

  /** aplica parâmetro à simulação atual (feedback imediato) */
  applyParam(id, v) {
    const ctrl = this.app.ctrl;
    const stations = ctrl.stations;
    // grupos de botões usam id próprio (ex.: 'mixPresets') — normaliza para o parâmetro real
    if (id.endsWith('Presets')) id = id.slice(0, -'Presets'.length);
    for (const st of stations) {
      switch (id) {
        case 'speed': st.cfg.speed = v; break;
        case 'standoff': st.cfg.standoff = v; break;
        case 'lean': st.cfg.lean = v; break;
        case 'feed':
          st.cfg.feed = v;
          if (v <= 0.01) st.cfg.rodMode = 'none';
          else if (st.cfg.rodMode === 'none') st.cfg.rodMode = 'ahead';
          st.rodModeNone();
          break;
        case 'mix': st.torch.flame.setMix(v); break;
        case 'flamePower': st.cfg.flamePower = v; break;
      }
    }
    this.app.uiHud?.();
  }

  /* ================= painel direito — referências ================= */

  #renderRefs(def) {
    const el = this.$('tab-refs');
    let html = `<div class="info-block"><h3>Referências deste módulo</h3>`;
    for (const r of def.refs ?? []) {
      html += `<div class="ref-item">▸ ${r}</div>`;
    }
    html += `</div><div class="info-block"><h3>Referências gerais do projeto</h3>`;
    for (const r of GLOBAL_REFS) {
      html += `<div class="ref-item"><strong>${r.t}</strong> — ${r.d}${r.pending ? ' <span class="ref-pending">⚠ pendente de validação</span>' : ''}</div>`;
    }
    html += `</div>`;
    el.innerHTML = html;
  }

  /* ================= transporte ================= */

  #renderChips(def) {
    const box = this.$('step-chips');
    box.innerHTML = '';
    (def.steps ?? []).forEach((s, i) => {
      const chip = document.createElement('button');
      chip.className = 'step-chip';
      chip.textContent = `${i + 1}. ${s.title}`;
      chip.addEventListener('click', () => this.app.ctrl.jumpTo(i));
      box.appendChild(chip);
    });
    this.#highlightChip(0);
  }

  #highlightChip(i) {
    const chips = this.$('step-chips').children;
    for (let k = 0; k < chips.length; k++) {
      chips[k].classList.toggle('current', k === i);
      chips[k].classList.toggle('done', k < i);
    }
  }

  #wireTransport() {
    this.$('btn-play').addEventListener('click', () => this.app.ctrl.toggle());
    this.$('btn-restart').addEventListener('click', () => this.app.ctrl.restart());
    this.$('btn-next').addEventListener('click', () => this.app.ctrl.next());
    this.$('btn-prev').addEventListener('click', () => this.app.ctrl.prev());
    this.$('speed-select').addEventListener('change', (e) => {
      this.app.stage.timeScale = parseFloat(e.target.value);
    });
    this.$('btn-labels').addEventListener('click', () => {
      const tags = this.app.ctrl.tags;
      tags.setUserPref(!tags.userPref);
      this.$('btn-labels').textContent = `Etiquetas: ${tags.userPref ? 'ON' : 'OFF'}`;
      this.$('btn-labels').classList.toggle('on', tags.userPref);
    });
  }

  onStepEnter(i, step) {
    this.#highlightChip(i);
    if (step) this.setCaption(step.title, step.caption);
    if (step?.camera && this.mode !== 'practice') {
      this.app.director.set(step.camera, true);
      const sel = this.$('camera-select');
      if ([...sel.options].some(o => o.value === step.camera)) sel.value = step.camera;
    }
    this.#saveProgress(this.module?.id, i);
    this.app.uiHud?.();
  }

  onDemoEnd() {
    this.toast('Demonstração concluída — reinicie ou explore os controles.');
  }

  onPlayState(ctrl) {
    const btn = this.$('btn-play');
    btn.classList.toggle('playing', ctrl.playing);
    btn.textContent = ctrl.playing ? '⏸ Pausar' : '▶ Iniciar';
  }

  setCaption(title, html) {
    const cap = this.$('caption');
    cap.classList.remove('hidden');
    this.$('caption-step').textContent = title ?? '';
    this.$('caption-text').innerHTML = html ?? '';
  }

  toggleCaptions() {
    this.$('caption').classList.toggle('hidden');
  }

  showCompare(v) {
    this.$('compare-labels').classList.toggle('hidden', !v);
  }

  toast(msg) {
    const t = document.createElement('div');
    t.className = 'hud-chip';
    t.textContent = msg;
    this.$('hud').appendChild(t);
    setTimeout(() => t.remove(), 4000);
  }

  /* ================= barra superior ================= */

  #buildCameraSelect() {
    const sel = this.$('camera-select');
    for (const p of CameraDirector.presetsInfo) {
      const o = document.createElement('option');
      o.value = p.id;
      o.textContent = p.label;
      sel.appendChild(o);
    }
    sel.addEventListener('change', () => this.app.director.set(sel.value));
  }

  #wireTopbar() {
    this.$('quality-select').addEventListener('change', (e) => this.app.stage.setQuality(e.target.value));
    this.$('mode-select').addEventListener('change', (e) => this.setMode(e.target.value));
    this.$('btn-audio').addEventListener('click', (e) => {
      const on = this.app.audio.toggle();
      e.target.textContent = on ? '🔊' : '🔇';
      e.target.classList.toggle('on', on);
    });
  }

  setMode(mode) {
    this.mode = mode;
    const ctrl = this.app.ctrl;
    if (mode === 'explain') {
      ctrl.pause();
      this.app.director.set('overview', true);
      this.$('right-tabs').querySelector('[data-tab=info]').click();
    }
    if (mode === 'practice') {
      ctrl.pause();
      this.$('practice-panel').classList.remove('hidden');
      this.$('practice-result').innerHTML = '<span style="color:var(--text-dim)">Ajuste os parâmetros e inicie a passada.</span>';
      // ativa a aba de controles automaticamente
      this.$('right-tabs').querySelector('[data-tab=controls]')?.click();
    } else {
      this.$('practice-panel').classList.add('hidden');
      ctrl.stopPractice();
    }
    this.$('hud-note').classList.toggle('hidden', mode === 'practice');
    this.#renderControls(this.module);
    this.#updateParamAvailability();
    this.app.uiHud?.();
  }

  /* ================= modo prática ================= */

  startPractice() {
    const ok = this.app.ctrl.startPractice();
    if (!ok) { this.toast('Modo prático requer um cenário de soldagem em junta de topo.'); return; }
    this.$('practice-result').innerHTML =
      '<span style="color:var(--accent)">● Passada em execução…</span><br>' +
      '<span style="color:var(--text-dim)">Você pode ajustar os parâmetros durante a passada — as alterações afetam a simulação imediatamente.</span>';
    this.app.ctrl.togglePlayIfIdle?.();
    this.app.ctrl.stations[0].cfg.running = true;
    this.$('btn-play').textContent = '⏸ Pausar';
  }

  finishPractice() {
    const ctrl = this.app.ctrl;
    const st = ctrl.stations[0];
    if (!st) return;
    st.cfg.running = false;
    ctrl.stopPractice();
    const r = ctrl.evaluatePractice();
    if (!r) return;
    const gradeColor = r.grade === 'Boa' ? 'var(--ok)' : r.grade === 'Regular' ? '#e0a63c' : 'var(--danger)';
    const items = r.items.map(it => {
      if (it.st === 'visual') {
        return `<div class="practice-vis-title">Diagnóstico visual do cordão</div>` +
          it.visual.map(v =>
            `<div class="practice-item"><span>${v.t}</span><span class="${v.st === 'warn' ? 'warn' : 'bad'}">${v.st === 'warn' ? '!' : '✗'}</span></div>
             <div class="param-help" style="margin-bottom:6px">${v.d}</div>`).join('');
      }
      const mark = it.st === 'good' ? '<span class="good">✓</span>' : it.st === 'warn' ? '<span class="warn">!</span>' : '<span class="bad">✗</span>';
      return `<div class="practice-item"><span>${it.label}</span>${mark}</div>
               <div class="param-help" style="margin-bottom:6px">${it.note}</div>`;
    }).join('');
    this.$('practice-result').innerHTML =
      `<div class="practice-score">${r.score}<span style="font-size:13px;color:var(--text-dim)"> / 100</span></div>
       <div class="practice-grade" style="color:${gradeColor};border-color:${gradeColor}">Condição da solda: ${r.grade}</div>
       ${items}
       <div class="param-help" style="margin-top:8px">⚠ Avaliação didática com base em critérios simplificados — não constitui qualificação profissional.</div>`;
  }

  onStationDone(st) {
    if (this.mode === 'practice' && this.app.ctrl.practiceRunning) {
      this.finishPractice();
      this.toast('Passada concluída — avaliação exibida.');
    }
  }

  /* ================= HUD ================= */

  hudUpdate() {
    const def = this.module;
    const flameChip = this.$('hud-flame');
    const speedChip = this.$('hud-speed');
    const st = this.app.ctrl.stations[0];
    if (!def || !st) {
      flameChip.textContent = 'Chama: —';
      speedChip.textContent = 'Avanço: —';
      return;
    }
    const f = st.torch.flame;
    flameChip.textContent = `Chama: ${f.typeName} · mistura ${st.torch.flame.currentMix.toFixed(2).replace('.', ',')} · ~${f.workingTempC} °C (est.)`;
    speedChip.textContent = `Avanço: ${st.cfg.speed.toFixed(0).replace('.', ',')} u/s · distância ${st.cfg.standoff.toFixed(0)} · vareta ${st.cfg.feed > 0.01 ? st.cfg.feed.toFixed(2).replace('.', ',') : '—'}`;
  }

  /* ================= modo apresentador ================= */

  #wirePresenter() {
    const btn = this.$('btn-presenter');
    const exit = document.createElement('button');
    exit.id = 'presenter-exit';
    exit.textContent = '✕ Sair do modo apresentador (P)';
    document.body.appendChild(exit);
    const toggle = () => {
      const on = document.body.classList.toggle('presenter');
      this.toast(on ? 'Modo apresentador: Espaço = iniciar/pausar · ←/→ = etapas · C = câmera · L = etiquetas · H = legendas' : 'Modo apresentador desativado.');
    };
    btn.addEventListener('click', toggle);
    exit.addEventListener('click', toggle);
  }

  #wireTabs() {
    document.querySelectorAll('#right-tabs button').forEach(b => {
      b.addEventListener('click', () => {
        document.querySelectorAll('#right-tabs button').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        for (const id of ['info', 'controls', 'refs']) {
          this.$('tab-' + id).classList.toggle('hidden', b.dataset.tab !== id);
        }
      });
    });
  }

  /* ================= teclado ================= */

  #wireKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      const camIds = CameraDirector.presetsInfo.map(p => p.id);
      switch (e.code) {
        case 'Space': e.preventDefault(); this.app.ctrl.toggle(); break;
        case 'ArrowRight': this.app.ctrl.next(); break;
        case 'ArrowLeft': this.app.ctrl.prev(); break;
        case 'KeyR': this.app.ctrl.restart(); break;
        case 'KeyC': {
          const sel = this.$('camera-select');
          const idx = (camIds.indexOf(sel.value) + 1) % camIds.length;
          sel.value = camIds[idx];
          this.app.director.set(camIds[idx]);
          break;
        }
        case 'KeyL': this.$('btn-labels').click(); break;
        case 'KeyH': this.toggleCaptions(); break;
        case 'KeyP': this.$('btn-presenter').click(); break;
        default:
          if (/^Digit[1-8]$/.test(e.code)) {
            const n = parseInt(e.code.slice(5), 10);
            if (MODULES[n - 1]) this.loadModule(MODULES[n - 1].id);
          }
      }
    });
  }
}
