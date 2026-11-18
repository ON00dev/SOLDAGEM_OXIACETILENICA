/**
 * Áudio procedural com Web Audio API:
 * - sopro contínuo da chama (ruído filtrado, muda com o tipo de chama)
 * - estalos ocasionais de solidificação durante a soldagem
 * Nada é reproduzido até o usuário habilitar o som (política de autoplay).
 */
export class FlameAudio {
  constructor() {
    this.ctx = null;
    this.enabled = false;
    this.master = null;
    this.hissGain = null;
    this.hissFilter = null;
    this._crackleTimer = 0;
  }

  ensure() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();

    this.master = this.ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(this.ctx.destination);

    // ruído branco em loop
    const len = this.ctx.sampleRate * 2;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    this.hissFilter = this.ctx.createBiquadFilter();
    this.hissFilter.type = 'bandpass';
    this.hissFilter.frequency.value = 1800;
    this.hissFilter.Q.value = 0.6;

    this.hissGain = this.ctx.createGain();
    this.hissGain.gain.value = 0.0;

    src.connect(this.hissFilter).connect(this.hissGain).connect(this.master);
    src.start();
    this.noiseBuffer = buf;
  }

  toggle() {
    this.ensure();
    if (!this.ctx) return false;
    this.enabled = !this.enabled;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.master.gain.linearRampToValueAtTime(this.enabled ? 1 : 0, this.ctx.currentTime + 0.2);
    return this.enabled;
  }

  /**
   * Atualiza o caráter sonoro conforme a chama.
   * @param {number} intensity 0..1 (0 = chama apagada)
   * @param {'neutral'|'oxidizing'|'carburizing'} type
   */
  setFlame(intensity, type) {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime;
    const base = type === 'oxidizing' ? 2600 : type === 'carburizing' ? 1100 : 1800;
    this.hissFilter.frequency.setTargetAtTime(base * (0.85 + 0.3 * intensity), t, 0.15);
    this.hissGain.gain.setTargetAtTime(0.05 + 0.16 * intensity, t, 0.2);
  }

  /** Estalo curto (solidificação) — chamado pelo simulador */
  crackle(strength = 1) {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime;
    const len = 0.05;
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
    }
    const s = this.ctx.createBufferSource();
    s.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 2400;
    const g = this.ctx.createGain();
    g.gain.value = 0.12 * strength;
    s.connect(f).connect(g).connect(this.master);
    s.start(t);
  }
}
