// PolySim Fluid — a real 2D incompressible fluid solver based on
// Jos Stam's "Stable Fluids" (semi-Lagrangian advection + Jacobi pressure
// projection + Gauss-Seidel diffusion). Runs a velocity field + dye density.
// Pure TS, deterministic, no deps. Grid is (n+2)^2 with a 1-cell border.

export interface FluidConfig {
  n: number;        // interior grid size (n x n)
  diff: number;     // dye diffusion
  visc: number;     // viscosity
  dt: number;       // timestep
  iter: number;     // linear-solver iterations
}

export const DEFAULT_FLUID: FluidConfig = {
  n: 96,
  diff: 0.0,
  visc: 0.0000001,
  dt: 0.12,
  iter: 16,
};

export class FluidField {
  n: number;
  size: number;
  cfg: FluidConfig;
  density: Float32Array;
  private s: Float32Array;
  vx: Float32Array;
  vy: Float32Array;
  private vx0: Float32Array;
  private vy0: Float32Array;

  constructor(cfg: FluidConfig = DEFAULT_FLUID) {
    this.cfg = { ...cfg };
    this.n = cfg.n;
    this.size = (this.n + 2) * (this.n + 2);
    this.density = new Float32Array(this.size);
    this.s = new Float32Array(this.size);
    this.vx = new Float32Array(this.size);
    this.vy = new Float32Array(this.size);
    this.vx0 = new Float32Array(this.size);
    this.vy0 = new Float32Array(this.size);
  }

  private ix(x: number, y: number): number {
    return x + y * (this.n + 2);
  }

  addDensity(x: number, y: number, amount: number): void {
    if (x < 1 || y < 1 || x > this.n || y > this.n) return;
    this.density[this.ix(x, y)] += amount;
  }

  addVelocity(x: number, y: number, ax: number, ay: number): void {
    if (x < 1 || y < 1 || x > this.n || y > this.n) return;
    const i = this.ix(x, y);
    this.vx[i] += ax;
    this.vy[i] += ay;
  }

  step(): void {
    const { n, cfg } = this;
    const { visc, diff, dt, iter } = cfg;
    // velocity diffusion (viscosity)
    this.diffuse(1, this.vx0, this.vx, visc, dt, iter);
    this.diffuse(2, this.vy0, this.vy, visc, dt, iter);
    this.project(this.vx0, this.vy0, this.vx, this.vy, iter);
    // velocity advection (self-advect)
    this.advect(1, this.vx, this.vx0, this.vx0, this.vy0, dt);
    this.advect(2, this.vy, this.vy0, this.vx0, this.vy0, dt);
    this.project(this.vx, this.vy, this.vx0, this.vy0, iter);
    // density diffuse + advect
    this.diffuse(0, this.s, this.density, diff, dt, iter);
    this.advect(0, this.density, this.s, this.vx, this.vy, dt);
    // gentle dissipation so dye fades
    for (let i = 0; i < this.size; i++) this.density[i] *= 0.995;
    void n;
  }

  private diffuse(b: number, x: Float32Array, x0: Float32Array, amt: number, dt: number, iter: number): void {
    const a = dt * amt * this.n * this.n;
    this.linSolve(b, x, x0, a, 1 + 4 * a, iter);
  }

  private linSolve(b: number, x: Float32Array, x0: Float32Array, a: number, c: number, iter: number): void {
    const invC = 1 / c;
    const n = this.n;
    for (let k = 0; k < iter; k++) {
      for (let j = 1; j <= n; j++) {
        for (let i = 1; i <= n; i++) {
          const idx = this.ix(i, j);
          x[idx] =
            (x0[idx] +
              a * (x[this.ix(i - 1, j)] + x[this.ix(i + 1, j)] + x[this.ix(i, j - 1)] + x[this.ix(i, j + 1)])) *
            invC;
        }
      }
      this.setBnd(b, x);
    }
  }

  private project(vx: Float32Array, vy: Float32Array, p: Float32Array, div: Float32Array, iter: number): void {
    const n = this.n;
    for (let j = 1; j <= n; j++) {
      for (let i = 1; i <= n; i++) {
        div[this.ix(i, j)] =
          (-0.5 * (vx[this.ix(i + 1, j)] - vx[this.ix(i - 1, j)] + vy[this.ix(i, j + 1)] - vy[this.ix(i, j - 1)])) / n;
        p[this.ix(i, j)] = 0;
      }
    }
    this.setBnd(0, div);
    this.setBnd(0, p);
    this.linSolve(0, p, div, 1, 4, iter);
    for (let j = 1; j <= n; j++) {
      for (let i = 1; i <= n; i++) {
        vx[this.ix(i, j)] -= 0.5 * (p[this.ix(i + 1, j)] - p[this.ix(i - 1, j)]) * n;
        vy[this.ix(i, j)] -= 0.5 * (p[this.ix(i, j + 1)] - p[this.ix(i, j - 1)]) * n;
      }
    }
    this.setBnd(1, vx);
    this.setBnd(2, vy);
  }

  private advect(b: number, d: Float32Array, d0: Float32Array, vx: Float32Array, vy: Float32Array, dt: number): void {
    const n = this.n;
    const dt0 = dt * n;
    for (let j = 1; j <= n; j++) {
      for (let i = 1; i <= n; i++) {
        let x = i - dt0 * vx[this.ix(i, j)];
        let y = j - dt0 * vy[this.ix(i, j)];
        if (x < 0.5) x = 0.5;
        if (x > n + 0.5) x = n + 0.5;
        const i0 = Math.floor(x), i1 = i0 + 1;
        if (y < 0.5) y = 0.5;
        if (y > n + 0.5) y = n + 0.5;
        const j0 = Math.floor(y), j1 = j0 + 1;
        const s1 = x - i0, s0 = 1 - s1;
        const t1 = y - j0, t0 = 1 - t1;
        d[this.ix(i, j)] =
          s0 * (t0 * d0[this.ix(i0, j0)] + t1 * d0[this.ix(i0, j1)]) +
          s1 * (t0 * d0[this.ix(i1, j0)] + t1 * d0[this.ix(i1, j1)]);
      }
    }
    this.setBnd(b, d);
  }

  private setBnd(b: number, x: Float32Array): void {
    const n = this.n;
    for (let i = 1; i <= n; i++) {
      x[this.ix(0, i)] = b === 1 ? -x[this.ix(1, i)] : x[this.ix(1, i)];
      x[this.ix(n + 1, i)] = b === 1 ? -x[this.ix(n, i)] : x[this.ix(n, i)];
      x[this.ix(i, 0)] = b === 2 ? -x[this.ix(i, 1)] : x[this.ix(i, 1)];
      x[this.ix(i, n + 1)] = b === 2 ? -x[this.ix(i, n)] : x[this.ix(i, n)];
    }
    x[this.ix(0, 0)] = 0.5 * (x[this.ix(1, 0)] + x[this.ix(0, 1)]);
    x[this.ix(0, n + 1)] = 0.5 * (x[this.ix(1, n + 1)] + x[this.ix(0, n)]);
    x[this.ix(n + 1, 0)] = 0.5 * (x[this.ix(n, 0)] + x[this.ix(n + 1, 1)]);
    x[this.ix(n + 1, n + 1)] = 0.5 * (x[this.ix(n, n + 1)] + x[this.ix(n + 1, n)]);
  }

  // Scalar diagnostics for the data inspector + surrogate training.
  metrics(): { totalDensity: number; meanSpeed: number; maxSpeed: number; enstrophy: number } {
    const n = this.n;
    let total = 0, sumSpeed = 0, maxSpeed = 0, enstrophy = 0;
    for (let j = 1; j <= n; j++) {
      for (let i = 1; i <= n; i++) {
        const idx = this.ix(i, j);
        total += this.density[idx];
        const sp = Math.hypot(this.vx[idx], this.vy[idx]);
        sumSpeed += sp;
        if (sp > maxSpeed) maxSpeed = sp;
        const curl =
          this.vy[this.ix(i + 1, j)] - this.vy[this.ix(i - 1, j)] -
          (this.vx[this.ix(i, j + 1)] - this.vx[this.ix(i, j - 1)]);
        enstrophy += curl * curl;
      }
    }
    const cells = n * n;
    return { totalDensity: total, meanSpeed: sumSpeed / cells, maxSpeed, enstrophy: enstrophy / cells };
  }
}
