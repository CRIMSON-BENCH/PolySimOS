// PolySim Particles — a real 2D particle / N-body / rigid-collision engine.
// Semi-implicit (symplectic) Euler + impulse-based circle collisions +
// optional pairwise gravity and boundary walls. Pure TS, deterministic.

export interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  mass: number; radius: number;
  fixed?: boolean;
}

export interface ParticleParams {
  gravityY: number;       // uniform downward gravity (px/s^2)
  pairwiseG: number;      // Newtonian pairwise gravity constant (0 = off)
  restitution: number;    // bounciness 0..1
  drag: number;           // velocity damping per second (0 = none)
  width: number;
  height: number;
  softening: number;      // gravity softening to avoid singularities
}

export const DEFAULT_PARTICLE_PARAMS: ParticleParams = {
  gravityY: 0,
  pairwiseG: 60,
  restitution: 0.9,
  drag: 0.0,
  width: 800,
  height: 600,
  softening: 8,
};

// Deterministic PRNG so seeded scenes reproduce exactly.
export function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

export function seedParticles(
  count: number,
  p: ParticleParams,
  seed = 42
): Particle[] {
  const rnd = makeRng(seed);
  const out: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const r = 3 + rnd() * 6;
    out.push({
      x: r + rnd() * (p.width - 2 * r),
      y: r + rnd() * (p.height - 2 * r),
      vx: (rnd() - 0.5) * 40,
      vy: (rnd() - 0.5) * 40,
      mass: r * r,
      radius: r,
    });
  }
  return out;
}

// Orbital preset: a heavy central body with satellites on circular orbits.
export function seedOrbit(count: number, p: ParticleParams, seed = 7): Particle[] {
  const rnd = makeRng(seed);
  const cx = p.width / 2, cy = p.height / 2;
  const central: Particle = { x: cx, y: cy, vx: 0, vy: 0, mass: 20000, radius: 14, fixed: true };
  const out: Particle[] = [central];
  for (let i = 0; i < count; i++) {
    const dist = 60 + rnd() * (Math.min(p.width, p.height) / 2 - 80);
    const ang = rnd() * Math.PI * 2;
    const x = cx + Math.cos(ang) * dist;
    const y = cy + Math.sin(ang) * dist;
    // circular-orbit speed v = sqrt(G*M/r)
    const speed = Math.sqrt((p.pairwiseG * central.mass) / dist);
    out.push({
      x, y,
      vx: -Math.sin(ang) * speed,
      vy: Math.cos(ang) * speed,
      mass: 4 + rnd() * 8,
      radius: 2 + rnd() * 3,
    });
  }
  return out;
}

export function stepParticles(parts: Particle[], p: ParticleParams, dt: number): void {
  const n = parts.length;
  // --- forces: uniform + pairwise gravity ---
  const ax = new Float64Array(n);
  const ay = new Float64Array(n);
  for (let i = 0; i < n; i++) ay[i] += p.gravityY;
  if (p.pairwiseG !== 0) {
    const soft2 = p.softening * p.softening;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = parts[j].x - parts[i].x;
        const dy = parts[j].y - parts[i].y;
        const d2 = dx * dx + dy * dy + soft2;
        const invD = 1 / Math.sqrt(d2);
        const f = (p.pairwiseG * parts[i].mass * parts[j].mass) / d2;
        const fx = f * dx * invD;
        const fy = f * dy * invD;
        ax[i] += fx / parts[i].mass; ay[i] += fy / parts[i].mass;
        ax[j] -= fx / parts[j].mass; ay[j] -= fy / parts[j].mass;
      }
    }
  }
  // --- integrate (semi-implicit Euler) ---
  const dampF = Math.max(0, 1 - p.drag * dt);
  for (let i = 0; i < n; i++) {
    const pt = parts[i];
    if (pt.fixed) continue;
    pt.vx = (pt.vx + ax[i] * dt) * dampF;
    pt.vy = (pt.vy + ay[i] * dt) * dampF;
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
  }
  // --- circle-circle collisions (impulse resolution) ---
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      resolveCollision(parts[i], parts[j], p.restitution);
    }
  }
  // --- walls ---
  for (let i = 0; i < n; i++) {
    const pt = parts[i];
    if (pt.fixed) continue;
    if (pt.x - pt.radius < 0) { pt.x = pt.radius; pt.vx = -pt.vx * p.restitution; }
    if (pt.x + pt.radius > p.width) { pt.x = p.width - pt.radius; pt.vx = -pt.vx * p.restitution; }
    if (pt.y - pt.radius < 0) { pt.y = pt.radius; pt.vy = -pt.vy * p.restitution; }
    if (pt.y + pt.radius > p.height) { pt.y = p.height - pt.radius; pt.vy = -pt.vy * p.restitution; }
  }
}

function resolveCollision(a: Particle, b: Particle, restitution: number): void {
  const dx = b.x - a.x, dy = b.y - a.y;
  const dist = Math.hypot(dx, dy);
  const minDist = a.radius + b.radius;
  if (dist === 0 || dist >= minDist) return;
  const nx = dx / dist, ny = dy / dist;
  const overlap = minDist - dist;
  const invA = a.fixed ? 0 : 1 / a.mass;
  const invB = b.fixed ? 0 : 1 / b.mass;
  const invSum = invA + invB;
  if (invSum === 0) return;
  // positional correction
  a.x -= nx * overlap * (invA / invSum);
  a.y -= ny * overlap * (invA / invSum);
  b.x += nx * overlap * (invB / invSum);
  b.y += ny * overlap * (invB / invSum);
  // relative velocity along normal
  const rvx = b.vx - a.vx, rvy = b.vy - a.vy;
  const velN = rvx * nx + rvy * ny;
  if (velN > 0) return; // separating
  const jImp = (-(1 + restitution) * velN) / invSum;
  const ix = jImp * nx, iy = jImp * ny;
  a.vx -= ix * invA; a.vy -= iy * invA;
  b.vx += ix * invB; b.vy += iy * invB;
}

// Aggregate scalar metrics used by the surrogate + data inspector.
export function particleMetrics(parts: Particle[]): {
  kineticEnergy: number;
  meanSpeed: number;
  maxSpeed: number;
} {
  let ke = 0, sumSpeed = 0, maxSpeed = 0;
  for (const pt of parts) {
    const sp = Math.hypot(pt.vx, pt.vy);
    ke += 0.5 * pt.mass * sp * sp;
    sumSpeed += sp;
    if (sp > maxSpeed) maxSpeed = sp;
  }
  return { kineticEnergy: ke, meanSpeed: parts.length ? sumSpeed / parts.length : 0, maxSpeed };
}
