// Utilidades gerais
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
/** Amortecimento exponencial independente de framerate */
export const damp = (current, target, lambda, dt) =>
  lerp(current, target, 1 - Math.exp(-lambda * dt));

export const deg2rad = (d) => (d * Math.PI) / 180;

/** Variação suave de ruído (1D) para cintilações */
export function flicker(t, seed = 0) {
  return (
    0.55 +
    0.28 * Math.sin(t * 11.3 + seed * 7.1) +
    0.17 * Math.sin(t * 27.7 + seed * 3.3) +
    0.1 * Math.sin(t * 53.1 + seed * 13.7)
  );
}

export function formatNum(v, digits = 1) {
  return v.toFixed(digits).replace('.', ',');
}
