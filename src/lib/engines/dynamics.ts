// PolySim Dynamics — real ODE/PDE integrators and canonical systems.
// RK4 for ODE systems; explicit reaction-diffusion (Gray-Scott) for PDE.
// Pure TS, no deps. Deterministic (seeded) so runs are reproducible.

export type Deriv = (t: number, y: number[]) => number[];

// Classic 4th-order Runge-Kutta step for a first-order system y' = f(t, y).
export function rk4Step(f: Deriv, t: number, y: number[], h: number): number[] {
  const k1 = f(t, y);
  const k2 = f(t + h / 2, y.map((yi, i) => yi + (h / 2) * k1[i]));
  const k3 = f(t + h / 2, y.map((yi, i) => yi + (h / 2) * k2[i]));
  const k4 = f(t + h, y.map((yi, i) => yi + h * k3[i]));
  return y.map((yi, i) => yi + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
}

// Integrate a system over [0, T] and return the full trajectory.
export function integrate(f: Deriv, y0: number[], T: number, h: number): { t: number; y: number[] }[] {
  const out: { t: number; y: number[] }[] = [];
  let y = y0.slice();
  let t = 0;
  const steps = Math.max(1, Math.floor(T / h));
  for (let i = 0; i <= steps; i++) {
    out.push({ t, y: y.slice() });
    y = rk4Step(f, t, y, h);
    t += h;
  }
  return out;
}

// --- Canonical ODE systems -----------------------------------------------

export interface OdeSystem {
  id: string;
  name: string;
  description: string;
  vars: string[];
  params: { key: string; label: string; default: number; min: number; max: number; step: number }[];
  y0: number[];
  T: number;
  h: number;
  make: (p: Record<string, number>) => Deriv;
  // Which two state indices to plot as a phase portrait, if applicable.
  phase?: [number, number];
}

export const ODE_SYSTEMS: OdeSystem[] = [
  {
    id: "lorenz",
    name: "Lorenz Attractor",
    description: "A three-variable system of ODEs whose solutions form the iconic butterfly-shaped strange attractor — a textbook example of deterministic chaos.",
    vars: ["x", "y", "z"],
    params: [
      { key: "sigma", label: "σ (Prandtl)", default: 10, min: 1, max: 20, step: 0.5 },
      { key: "rho", label: "ρ (Rayleigh)", default: 28, min: 1, max: 60, step: 1 },
      { key: "beta", label: "β", default: 8 / 3, min: 0.5, max: 5, step: 0.05 },
    ],
    y0: [1, 1, 1],
    T: 40,
    h: 0.005,
    phase: [0, 2],
    make: (p) => (_t, [x, y, z]) => [
      p.sigma * (y - x),
      x * (p.rho - z) - y,
      x * y - p.beta * z,
    ],
  },
  {
    id: "sir",
    name: "SIR Epidemic Model",
    description: "The compartmental Susceptible–Infected–Recovered model of epidemiology. Tune the transmission rate β and recovery rate γ to explore outbreak dynamics and herd immunity.",
    vars: ["S", "I", "R"],
    params: [
      { key: "beta", label: "β (transmission)", default: 0.4, min: 0.05, max: 1, step: 0.01 },
      { key: "gamma", label: "γ (recovery)", default: 0.1, min: 0.01, max: 0.5, step: 0.01 },
    ],
    y0: [0.99, 0.01, 0],
    T: 160,
    h: 0.25,
    make: (p) => (_t, [S, I]) => [
      -p.beta * S * I,
      p.beta * S * I - p.gamma * I,
      p.gamma * I,
    ],
  },
  {
    id: "pendulum",
    name: "Damped Driven Pendulum",
    description: "A nonlinear pendulum with damping and periodic driving — a compact route from regular oscillation to chaos as the drive amplitude grows.",
    vars: ["θ", "ω"],
    params: [
      { key: "damp", label: "Damping", default: 0.5, min: 0, max: 2, step: 0.05 },
      { key: "drive", label: "Drive amplitude", default: 1.15, min: 0, max: 2, step: 0.05 },
      { key: "driveFreq", label: "Drive frequency", default: 0.667, min: 0.1, max: 2, step: 0.01 },
    ],
    y0: [0.2, 0],
    T: 100,
    h: 0.02,
    phase: [0, 1],
    make: (p) => (t, [th, om]) => [
      om,
      -p.damp * om - Math.sin(th) + p.drive * Math.cos(p.driveFreq * t),
    ],
  },
  {
    id: "lotka",
    name: "Lotka–Volterra (Predator–Prey)",
    description: "The predator–prey equations from mathematical biology, producing sustained population oscillations between a prey species and its predator.",
    vars: ["prey", "pred"],
    params: [
      { key: "a", label: "Prey growth α", default: 1.1, min: 0.1, max: 3, step: 0.1 },
      { key: "b", label: "Predation β", default: 0.4, min: 0.1, max: 2, step: 0.05 },
      { key: "c", label: "Predator death γ", default: 0.4, min: 0.1, max: 2, step: 0.05 },
      { key: "d", label: "Predator gain δ", default: 0.1, min: 0.02, max: 1, step: 0.02 },
    ],
    y0: [10, 5],
    T: 60,
    h: 0.02,
    phase: [0, 1],
    make: (p) => (_t, [x, y]) => [
      p.a * x - p.b * x * y,
      p.d * x * y - p.c * y,
    ],
  },
  {
    id: "vanderpol",
    name: "Van der Pol Oscillator",
    description: "A self-sustaining nonlinear oscillator with a stable limit cycle, foundational in electronics and nonlinear dynamics.",
    vars: ["x", "y"],
    params: [{ key: "mu", label: "μ (nonlinearity)", default: 2, min: 0, max: 6, step: 0.1 }],
    y0: [1, 0],
    T: 40,
    h: 0.01,
    phase: [0, 1],
    make: (p) => (_t, [x, y]) => [y, p.mu * (1 - x * x) * y - x],
  },
];

export function getOdeSystem(id: string): OdeSystem | undefined {
  return ODE_SYSTEMS.find((s) => s.id === id);
}

// --- Reaction-diffusion (PDE): Gray-Scott -------------------------------
// Explicit finite-difference on a periodic grid. Produces Turing patterns.
export interface GrayScottState {
  n: number;
  u: Float32Array;
  v: Float32Array;
}

export function grayScottInit(n: number, seed = 1): GrayScottState {
  const u = new Float32Array(n * n).fill(1);
  const v = new Float32Array(n * n).fill(0);
  // Seed a few square perturbations deterministically.
  let s = seed >>> 0;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const spots = 8;
  for (let k = 0; k < spots; k++) {
    const cx = Math.floor(rnd() * n);
    const cy = Math.floor(rnd() * n);
    const r = 4 + Math.floor(rnd() * 6);
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const x = (cx + dx + n) % n;
        const y = (cy + dy + n) % n;
        v[y * n + x] = 1;
        u[y * n + x] = 0;
      }
    }
  }
  return { n, u, v };
}

export function grayScottStep(
  st: GrayScottState,
  p: { feed: number; kill: number; du: number; dv: number },
  iterations = 1
): void {
  const { n } = st;
  const { u, v } = st;
  const un = new Float32Array(n * n);
  const vn = new Float32Array(n * n);
  const idx = (x: number, y: number) => ((y + n) % n) * n + ((x + n) % n);
  for (let it = 0; it < iterations; it++) {
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const i = y * n + x;
        const lapU =
          u[idx(x - 1, y)] + u[idx(x + 1, y)] + u[idx(x, y - 1)] + u[idx(x, y + 1)] - 4 * u[i];
        const lapV =
          v[idx(x - 1, y)] + v[idx(x + 1, y)] + v[idx(x, y - 1)] + v[idx(x, y + 1)] - 4 * v[i];
        const uvv = u[i] * v[i] * v[i];
        un[i] = u[i] + (p.du * lapU - uvv + p.feed * (1 - u[i]));
        vn[i] = v[i] + (p.dv * lapV + uvv - (p.kill + p.feed) * v[i]);
      }
    }
    u.set(un);
    v.set(vn);
  }
}
