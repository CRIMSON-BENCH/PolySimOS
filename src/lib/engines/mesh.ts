// PolySim Mesh — a paintable 2D domain with Dirichlet boundary conditions,
// solved for steady-state temperature (Laplace's equation ∇²u = 0) by
// Gauss-Seidel relaxation. This is the meshing + BC-editor + solver core.

export interface MeshDomain {
  n: number;
  temp: Float32Array;   // current field
  fixed: Uint8Array;    // 1 = Dirichlet (held), 0 = free
  wall: Uint8Array;     // 1 = insulated obstacle (excluded)
}

export function meshInit(n: number): MeshDomain {
  const d: MeshDomain = { n, temp: new Float32Array(n * n), fixed: new Uint8Array(n * n), wall: new Uint8Array(n * n) };
  // default: left edge hot (1), right edge cold (0), as Dirichlet BCs
  for (let y = 0; y < n; y++) {
    d.fixed[y * n] = 1; d.temp[y * n] = 1;
    d.fixed[y * n + (n - 1)] = 1; d.temp[y * n + (n - 1)] = 0;
  }
  return d;
}

export function meshPaint(d: MeshDomain, cx: number, cy: number, r: number, kind: "hot" | "cold" | "wall" | "clear"): void {
  const { n } = d;
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    const x = cx + dx, y = cy + dy; if (x < 0 || y < 0 || x >= n || y >= n || dx * dx + dy * dy > r * r) continue;
    const i = y * n + x;
    if (kind === "hot") { d.fixed[i] = 1; d.temp[i] = 1; d.wall[i] = 0; }
    else if (kind === "cold") { d.fixed[i] = 1; d.temp[i] = 0; d.wall[i] = 0; }
    else if (kind === "wall") { d.wall[i] = 1; d.fixed[i] = 0; d.temp[i] = 0; }
    else { d.fixed[i] = 0; d.wall[i] = 0; }
  }
}

// One or more Gauss-Seidel sweeps toward steady state. Returns max residual.
export function meshSolve(d: MeshDomain, iterations: number): number {
  const { n, temp, fixed, wall } = d;
  let maxRes = 0;
  for (let it = 0; it < iterations; it++) {
    maxRes = 0;
    for (let y = 1; y < n - 1; y++) for (let x = 1; x < n - 1; x++) {
      const i = y * n + x;
      if (fixed[i] || wall[i]) continue;
      // average of non-wall neighbors
      let sum = 0, cnt = 0;
      const nb = [i - 1, i + 1, i - n, i + n];
      for (const j of nb) { if (!wall[j]) { sum += temp[j]; cnt++; } }
      if (cnt === 0) continue;
      const nv = sum / cnt;
      maxRes = Math.max(maxRes, Math.abs(nv - temp[i]));
      temp[i] = nv;
    }
  }
  return maxRes;
}
