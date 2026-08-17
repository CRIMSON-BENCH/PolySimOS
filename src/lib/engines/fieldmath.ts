// PolySim field math — vector fields, optimization, and Monte-Carlo UQ built on
// the CAS. Evaluates multivariate expressions and runs numeric routines.
import { parse, evaluate, Node } from "./cas";

export function evalXY(tree: Node, x: number, y: number): number {
  try { return evaluate(tree, { x, y }); } catch { return NaN; }
}

// Sample a 2D vector field (u,v) = (fx(x,y), fy(x,y)) over a grid.
export function sampleVectorField(fxExpr: string, fyExpr: string, xr: [number, number], yr: [number, number], nx: number, ny: number) {
  const fx = parse(fxExpr), fy = parse(fyExpr);
  const arrows: { x: number; y: number; u: number; v: number }[] = [];
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const x = xr[0] + ((xr[1] - xr[0]) * i) / (nx - 1);
    const y = yr[0] + ((yr[1] - yr[0]) * j) / (ny - 1);
    arrows.push({ x, y, u: evalXY(fx, x, y), v: evalXY(fy, x, y) });
  }
  return arrows;
}

// Gradient descent to minimize f(x) on [lo,hi]; numeric gradient.
export function minimize1D(expr: string, lo: number, hi: number, x0: number, lr = 0.05, steps = 500): { x: number; fx: number; path: { x: number; y: number }[] } {
  const tree = parse(expr);
  const f = (x: number) => evaluate(tree, { x });
  const h = 1e-4;
  let x = x0; const path: { x: number; y: number }[] = [];
  for (let i = 0; i < steps; i++) {
    const g = (f(x + h) - f(x - h)) / (2 * h);
    x = Math.min(hi, Math.max(lo, x - lr * g));
    if (i % 5 === 0) path.push({ x, y: f(x) });
  }
  return { x, fx: f(x), path };
}

// Monte-Carlo uncertainty propagation: given f(x) and x ~ Normal(mean, sd),
// return summary statistics of the output distribution.
export function monteCarloUQ(expr: string, mean: number, sd: number, samples: number, seed = 1) {
  const tree = parse(expr);
  let s = seed >>> 0; const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const gauss = () => { const u1 = Math.max(1e-9, rnd()), u2 = rnd(); return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2); };
  const out: number[] = [];
  for (let i = 0; i < samples; i++) { const x = mean + sd * gauss(); const y = evaluate(tree, { x }); if (isFinite(y)) out.push(y); }
  out.sort((a, b) => a - b);
  const m = out.reduce((a, b) => a + b, 0) / out.length;
  const variance = out.reduce((a, b) => a + (b - m) ** 2, 0) / out.length;
  const pct = (p: number) => out[Math.min(out.length - 1, Math.floor(p * out.length))];
  return { mean: m, sd: Math.sqrt(variance), p05: pct(0.05), p50: pct(0.5), p95: pct(0.95), samples: out.length, hist: histogram(out, 24) };
}

function histogram(vals: number[], bins: number): { x: number; count: number }[] {
  if (!vals.length) return [];
  const lo = vals[0], hi = vals[vals.length - 1]; const w = (hi - lo) / bins || 1;
  const h = new Array(bins).fill(0);
  for (const v of vals) h[Math.min(bins - 1, Math.floor((v - lo) / w))]++;
  return h.map((count, i) => ({ x: lo + (i + 0.5) * w, count }));
}

// --- CSV import/export ---
export function parseCSV(text: string): number[][] {
  return text.trim().split(/\r?\n/).map((line) => line.split(/[,\t]/).map((c) => parseFloat(c.trim())).filter((v) => !isNaN(v))).filter((r) => r.length);
}
export function toCSV(rows: (number | string)[][]): string {
  return rows.map((r) => r.join(",")).join("\n");
}
