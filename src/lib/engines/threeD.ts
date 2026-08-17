// PolySim 3D — gravitational N-body in 3D with an orbit camera projection.
// Pure TS; rendered to a 2D canvas via perspective projection (no deps).

export interface Body3 { x: number; y: number; z: number; vx: number; vy: number; vz: number; mass: number; r: number; fixed?: boolean; }

export function seedSystem3D(count: number, seed = 7): Body3[] {
  let s = seed >>> 0; const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const sun: Body3 = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, mass: 8000, r: 12, fixed: true };
  const out: Body3[] = [sun];
  const G = 0.5;
  for (let i = 0; i < count; i++) {
    const dist = 40 + rnd() * 160;
    const theta = rnd() * Math.PI * 2;
    const incl = (rnd() - 0.5) * 0.8;
    const x = Math.cos(theta) * dist, z = Math.sin(theta) * dist, y = Math.sin(incl) * dist * 0.4;
    const speed = Math.sqrt((G * sun.mass) / dist);
    out.push({ x, y, z, vx: -Math.sin(theta) * speed, vy: (rnd() - 0.5) * speed * 0.2, vz: Math.cos(theta) * speed, mass: 2 + rnd() * 6, r: 2 + rnd() * 3 });
  }
  return out;
}

export function stepSystem3D(bodies: Body3[], G: number, dt: number): void {
  const n = bodies.length;
  const ax = new Float64Array(n), ay = new Float64Array(n), az = new Float64Array(n);
  const soft = 16;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const dx = bodies[j].x - bodies[i].x, dy = bodies[j].y - bodies[i].y, dz = bodies[j].z - bodies[i].z;
    const d2 = dx * dx + dy * dy + dz * dz + soft; const inv = 1 / Math.sqrt(d2);
    const f = (G * bodies[i].mass * bodies[j].mass) / d2;
    const fx = f * dx * inv, fy = f * dy * inv, fz = f * dz * inv;
    ax[i] += fx / bodies[i].mass; ay[i] += fy / bodies[i].mass; az[i] += fz / bodies[i].mass;
    ax[j] -= fx / bodies[j].mass; ay[j] -= fy / bodies[j].mass; az[j] -= fz / bodies[j].mass;
  }
  for (let i = 0; i < n; i++) { const b = bodies[i]; if (b.fixed) continue;
    b.vx += ax[i] * dt; b.vy += ay[i] * dt; b.vz += az[i] * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt; }
}

// Project a 3D point to 2D screen coords given orbit camera angles + distance.
export function project(b: { x: number; y: number; z: number }, yaw: number, pitch: number, camDist: number, W: number, H: number) {
  // rotate around Y (yaw) then X (pitch)
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  const x = b.x * cy - b.z * sy;
  let z = b.x * sy + b.z * cy;
  const cx = Math.cos(pitch), sx = Math.sin(pitch);
  const y = b.y * cx - z * sx;
  z = b.y * sx + z * cx;
  const zc = z + camDist;
  const fov = 500;
  const scale = fov / Math.max(1, zc);
  return { sx2: W / 2 + x * scale, sy2: H / 2 - y * scale, scale, depth: zc };
}
