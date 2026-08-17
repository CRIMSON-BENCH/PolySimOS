// PolySim field solvers — 2D heat equation and 1D wave equation via explicit
// finite differences. Pure TS, deterministic.

// --- 2D heat equation: ∂u/∂t = α ∇²u (Dirichlet cold boundary) ---
export interface HeatField {
  n: number;
  u: Float32Array;
}

export function heatInit(n: number): HeatField {
  const u = new Float32Array(n * n);
  // a hot square in the middle
  const lo = Math.floor(n * 0.4), hi = Math.floor(n * 0.6);
  for (let y = lo; y < hi; y++) for (let x = lo; x < hi; x++) u[y * n + x] = 1;
  return { n, u };
}

export function heatStep(f: HeatField, alpha: number, iterations = 1): void {
  const { n, u } = f;
  const un = new Float32Array(n * n);
  for (let it = 0; it < iterations; it++) {
    for (let y = 1; y < n - 1; y++) {
      for (let x = 1; x < n - 1; x++) {
        const i = y * n + x;
        const lap = u[i - 1] + u[i + 1] + u[i - n] + u[i + n] - 4 * u[i];
        un[i] = u[i] + alpha * lap;
      }
    }
    u.set(un);
  }
}

export function heatHotspot(f: HeatField, x: number, y: number, r: number): void {
  const { n, u } = f;
  for (let dy = -r; dy <= r; dy++)
    for (let dx = -r; dx <= r; dx++) {
      const px = x + dx, py = y + dy;
      if (px > 0 && px < n - 1 && py > 0 && py < n - 1 && dx * dx + dy * dy <= r * r) u[py * n + px] = 1;
    }
}

// --- 1D wave equation: ∂²u/∂t² = c² ∂²u/∂x² ---
export interface WaveField {
  n: number;
  u: Float32Array;
  uPrev: Float32Array;
}

export function waveInit(n: number): WaveField {
  const u = new Float32Array(n);
  const uPrev = new Float32Array(n);
  // a gaussian pulse in the middle
  const c = n / 2;
  for (let x = 0; x < n; x++) {
    const v = Math.exp(-((x - c) * (x - c)) / (2 * (n * 0.03) ** 2));
    u[x] = v; uPrev[x] = v;
  }
  return { n, u, uPrev };
}

export function waveStep(f: WaveField, c: number, damping = 0.999, iterations = 1): void {
  const { n } = f;
  const c2 = c * c;
  for (let it = 0; it < iterations; it++) {
    const un = new Float32Array(n);
    for (let x = 1; x < n - 1; x++) {
      const lap = f.u[x - 1] + f.u[x + 1] - 2 * f.u[x];
      un[x] = (2 * f.u[x] - f.uPrev[x] + c2 * lap) * damping;
    }
    f.uPrev.set(f.u);
    f.u.set(un);
  }
}
