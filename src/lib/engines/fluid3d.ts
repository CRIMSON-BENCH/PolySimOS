// PolySim 3D CFD — Jos Stam's Stable Fluids extended to 3D. Velocity (u,v,w)
// and dye density on an (N+2)^3 grid: semi-Lagrangian advection, Gauss-Seidel
// diffusion, and Jacobi pressure projection to keep the flow divergence-free.
// Boundary handling is simplified (neighbor copy / face negation) for speed.

export class Fluid3D {
  n: number; s: number; iter: number; dt: number; visc: number; diff: number;
  d: Float32Array; d0: Float32Array;
  u: Float32Array; v: Float32Array; w: Float32Array;
  u0: Float32Array; v0: Float32Array; w0: Float32Array;

  constructor(n = 24, dt = 0.1, iter = 4) {
    this.n = n; this.dt = dt; this.iter = iter; this.visc = 0; this.diff = 0;
    const sz = (n + 2) * (n + 2) * (n + 2); this.s = n + 2;
    this.d = new Float32Array(sz); this.d0 = new Float32Array(sz);
    this.u = new Float32Array(sz); this.v = new Float32Array(sz); this.w = new Float32Array(sz);
    this.u0 = new Float32Array(sz); this.v0 = new Float32Array(sz); this.w0 = new Float32Array(sz);
  }
  ix(x: number, y: number, z: number) { const s = this.s; return x + y * s + z * s * s; }

  addDensity(x: number, y: number, z: number, a: number) { this.d[this.ix(x, y, z)] += a; }
  addVelocity(x: number, y: number, z: number, ax: number, ay: number, az: number) { const i = this.ix(x, y, z); this.u[i] += ax; this.v[i] += ay; this.w[i] += az; }

  private lin(b: number, x: Float32Array, x0: Float32Array, a: number, c: number) {
    const n = this.n, invC = 1 / c;
    for (let k = 0; k < this.iter; k++) {
      for (let z = 1; z <= n; z++) for (let y = 1; y <= n; y++) for (let xi = 1; xi <= n; xi++) {
        const i = this.ix(xi, y, z);
        x[i] = (x0[i] + a * (x[i - 1] + x[i + 1] + x[i - this.s] + x[i + this.s] + x[i - this.s * this.s] + x[i + this.s * this.s])) * invC;
      }
      this.bnd(b, x);
    }
  }
  private diffuse(b: number, x: Float32Array, x0: Float32Array, amt: number) { const a = this.dt * amt * this.n * this.n * this.n; this.lin(b, x, x0, a, 1 + 6 * a); }

  private project(u: Float32Array, v: Float32Array, w: Float32Array, p: Float32Array, div: Float32Array) {
    const n = this.n, s = this.s;
    for (let z = 1; z <= n; z++) for (let y = 1; y <= n; y++) for (let x = 1; x <= n; x++) {
      const i = this.ix(x, y, z);
      div[i] = -0.5 * (u[i + 1] - u[i - 1] + v[i + s] - v[i - s] + w[i + s * s] - w[i - s * s]) / n;
      p[i] = 0;
    }
    this.bnd(0, div); this.bnd(0, p); this.lin(0, p, div, 1, 6);
    for (let z = 1; z <= n; z++) for (let y = 1; y <= n; y++) for (let x = 1; x <= n; x++) {
      const i = this.ix(x, y, z);
      u[i] -= 0.5 * n * (p[i + 1] - p[i - 1]);
      v[i] -= 0.5 * n * (p[i + s] - p[i - s]);
      w[i] -= 0.5 * n * (p[i + s * s] - p[i - s * s]);
    }
    this.bnd(1, u); this.bnd(2, v); this.bnd(3, w);
  }

  private advect(b: number, d: Float32Array, d0: Float32Array, u: Float32Array, v: Float32Array, w: Float32Array) {
    const n = this.n; const dt0 = this.dt * n;
    for (let z = 1; z <= n; z++) for (let y = 1; y <= n; y++) for (let x = 1; x <= n; x++) {
      const i = this.ix(x, y, z);
      let xx = x - dt0 * u[i], yy = y - dt0 * v[i], zz = z - dt0 * w[i];
      xx = Math.max(0.5, Math.min(n + 0.5, xx)); yy = Math.max(0.5, Math.min(n + 0.5, yy)); zz = Math.max(0.5, Math.min(n + 0.5, zz));
      const i0 = Math.floor(xx), j0 = Math.floor(yy), k0 = Math.floor(zz);
      const i1 = i0 + 1, j1 = j0 + 1, k1 = k0 + 1;
      const sx1 = xx - i0, sx0 = 1 - sx1, sy1 = yy - j0, sy0 = 1 - sy1, sz1 = zz - k0, sz0 = 1 - sz1;
      d[i] =
        sx0 * (sy0 * (sz0 * d0[this.ix(i0, j0, k0)] + sz1 * d0[this.ix(i0, j0, k1)]) + sy1 * (sz0 * d0[this.ix(i0, j1, k0)] + sz1 * d0[this.ix(i0, j1, k1)])) +
        sx1 * (sy0 * (sz0 * d0[this.ix(i1, j0, k0)] + sz1 * d0[this.ix(i1, j0, k1)]) + sy1 * (sz0 * d0[this.ix(i1, j1, k0)] + sz1 * d0[this.ix(i1, j1, k1)]));
    }
    this.bnd(b, d);
  }

  private bnd(b: number, x: Float32Array) {
    const n = this.n;
    // faces: copy from inner neighbor, negating the normal velocity component
    for (let a = 1; a <= n; a++) for (let c = 1; c <= n; c++) {
      x[this.ix(0, a, c)] = b === 1 ? -x[this.ix(1, a, c)] : x[this.ix(1, a, c)];
      x[this.ix(n + 1, a, c)] = b === 1 ? -x[this.ix(n, a, c)] : x[this.ix(n, a, c)];
      x[this.ix(a, 0, c)] = b === 2 ? -x[this.ix(a, 1, c)] : x[this.ix(a, 1, c)];
      x[this.ix(a, n + 1, c)] = b === 2 ? -x[this.ix(a, n, c)] : x[this.ix(a, n, c)];
      x[this.ix(a, c, 0)] = b === 3 ? -x[this.ix(a, c, 1)] : x[this.ix(a, c, 1)];
      x[this.ix(a, c, n + 1)] = b === 3 ? -x[this.ix(a, c, n)] : x[this.ix(a, c, n)];
    }
  }

  step() {
    this.diffuse(1, this.u0, this.u, this.visc); this.diffuse(2, this.v0, this.v, this.visc); this.diffuse(3, this.w0, this.w, this.visc);
    this.project(this.u0, this.v0, this.w0, this.u, this.v);
    this.advect(1, this.u, this.u0, this.u0, this.v0, this.w0); this.advect(2, this.v, this.v0, this.u0, this.v0, this.w0); this.advect(3, this.w, this.w0, this.u0, this.v0, this.w0);
    this.project(this.u, this.v, this.w, this.u0, this.v0);
    this.diffuse(0, this.d0, this.d, this.diff);
    this.advect(0, this.d, this.d0, this.u, this.v, this.w);
    for (let i = 0; i < this.d.length; i++) this.d[i] *= 0.99;
  }
  // Density on a z-slice for rendering.
  slice(z: number): Float32Array {
    const s = this.s, zi = Math.max(0, Math.min(this.n + 1, Math.round(z)));
    const out = new Float32Array(s * s);
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) out[y * s + x] = this.d[this.ix(x, y, zi)];
    return out;
  }
}
