// PolySim 3D heat — explicit finite-difference diffusion on a 3D grid.
// ∂u/∂t = α ∇³u with a hot core; render via z-slices or hot-voxel projection.

export interface Heat3D { n: number; u: Float32Array; }

const idx = (n: number, x: number, y: number, z: number) => (z * n + y) * n + x;

export function heat3dInit(n: number): Heat3D {
  const u = new Float32Array(n * n * n);
  const lo = Math.floor(n * 0.4), hi = Math.floor(n * 0.6);
  for (let z = lo; z < hi; z++) for (let y = lo; y < hi; y++) for (let x = lo; x < hi; x++) u[idx(n, x, y, z)] = 1;
  return { n, u };
}

export function heat3dStep(f: Heat3D, alpha: number, iterations = 1): void {
  const { n, u } = f;
  const un = new Float32Array(n * n * n);
  for (let it = 0; it < iterations; it++) {
    for (let z = 1; z < n - 1; z++) for (let y = 1; y < n - 1; y++) for (let x = 1; x < n - 1; x++) {
      const i = idx(n, x, y, z);
      const lap = u[i - 1] + u[i + 1] + u[i - n] + u[i + n] + u[i - n * n] + u[i + n * n] - 6 * u[i];
      un[i] = u[i] + alpha * lap;
    }
    u.set(un);
  }
}

export function heat3dSlice(f: Heat3D, z: number): Float32Array {
  const { n, u } = f;
  const zi = Math.max(0, Math.min(n - 1, Math.round(z)));
  return u.subarray(zi * n * n, (zi + 1) * n * n);
}

export function heat3dAdd(f: Heat3D, x: number, y: number, z: number, r: number): void {
  const { n, u } = f;
  for (let dz = -r; dz <= r; dz++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    const px = x + dx, py = y + dy, pz = z + dz;
    if (px > 0 && py > 0 && pz > 0 && px < n - 1 && py < n - 1 && pz < n - 1 && dx * dx + dy * dy + dz * dz <= r * r) u[idx(n, px, py, pz)] = 1;
  }
}

// Collect hot voxels above a threshold for 3D point projection.
export function heat3dHotVoxels(f: Heat3D, threshold: number): { x: number; y: number; z: number; t: number }[] {
  const { n, u } = f; const out: { x: number; y: number; z: number; t: number }[] = [];
  const stride = n > 40 ? 2 : 1;
  for (let z = 0; z < n; z += stride) for (let y = 0; y < n; y += stride) for (let x = 0; x < n; x += stride) {
    const t = u[idx(n, x, y, z)]; if (t > threshold) out.push({ x: x - n / 2, y: y - n / 2, z: z - n / 2, t });
  }
  return out;
}
