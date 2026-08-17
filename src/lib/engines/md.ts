// PolySim MD — 2D molecular dynamics with a Lennard-Jones potential and
// velocity-Verlet integration in a periodic box. Reports temperature (mean KE).

export interface Atom { x: number; y: number; vx: number; vy: number; }

export interface MDParams { n: number; box: number; sigma: number; epsilon: number; rcut: number; dt: number; }

export const DEFAULT_MD: MDParams = { n: 120, box: 400, sigma: 18, epsilon: 8, rcut: 45, dt: 0.01 };

export function seedAtoms(p: MDParams, seed = 5): Atom[] {
  let s = seed >>> 0; const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const atoms: Atom[] = [];
  const cols = Math.ceil(Math.sqrt(p.n)); const gap = p.box / (cols + 1);
  for (let i = 0; i < p.n; i++) {
    const cx = (i % cols) + 1, cy = Math.floor(i / cols) + 1;
    atoms.push({ x: cx * gap + (rnd() - 0.5) * 4, y: cy * gap + (rnd() - 0.5) * 4, vx: (rnd() - 0.5) * 20, vy: (rnd() - 0.5) * 20 });
  }
  return atoms;
}

function forces(atoms: Atom[], p: MDParams): { fx: Float64Array; fy: Float64Array } {
  const n = atoms.length; const fx = new Float64Array(n), fy = new Float64Array(n);
  const rc2 = p.rcut * p.rcut;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    let dx = atoms[j].x - atoms[i].x, dy = atoms[j].y - atoms[i].y;
    // minimum-image periodic
    dx -= p.box * Math.round(dx / p.box); dy -= p.box * Math.round(dy / p.box);
    const r2 = dx * dx + dy * dy; if (r2 > rc2 || r2 < 1e-6) continue;
    const inv2 = (p.sigma * p.sigma) / r2; const inv6 = inv2 * inv2 * inv2; const inv12 = inv6 * inv6;
    // LJ force magnitude / r
    const fmag = (24 * p.epsilon * (2 * inv12 - inv6)) / r2;
    const fxx = fmag * dx, fyy = fmag * dy;
    fx[i] -= fxx; fy[i] -= fyy; fx[j] += fxx; fy[j] += fyy;
  }
  return { fx, fy };
}

export function stepMD(atoms: Atom[], p: MDParams): void {
  const n = atoms.length;
  const { fx, fy } = forces(atoms, p);
  // velocity-Verlet (mass = 1)
  for (let i = 0; i < n; i++) {
    atoms[i].vx += 0.5 * fx[i] * p.dt; atoms[i].vy += 0.5 * fy[i] * p.dt;
    atoms[i].x += atoms[i].vx * p.dt; atoms[i].y += atoms[i].vy * p.dt;
    // wrap periodic
    atoms[i].x = ((atoms[i].x % p.box) + p.box) % p.box; atoms[i].y = ((atoms[i].y % p.box) + p.box) % p.box;
  }
  const { fx: fx2, fy: fy2 } = forces(atoms, p);
  for (let i = 0; i < n; i++) { atoms[i].vx += 0.5 * fx2[i] * p.dt; atoms[i].vy += 0.5 * fy2[i] * p.dt; }
}

export function temperature(atoms: Atom[]): number {
  let ke = 0; for (const a of atoms) ke += 0.5 * (a.vx * a.vx + a.vy * a.vy);
  return atoms.length ? ke / atoms.length : 0;
}

export function thermostat(atoms: Atom[], target: number): void {
  const T = temperature(atoms); if (T < 1e-6) return;
  const scale = Math.sqrt(target / T);
  for (const a of atoms) { a.vx *= scale; a.vy *= scale; }
}
