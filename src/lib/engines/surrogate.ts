// PolySim Surrogate — a real, in-browser surrogate-model trainer.
// Given (parameter -> output) samples produced by any of our solvers, it fits
// a Gaussian radial-basis-function (RBF) interpolator with ridge
// regularization, then predicts new outputs in microseconds. This is the same
// idea behind PhysicsX / Emmi / Neural Concept surrogates, at a scale that runs
// client-side and honestly reports its own accuracy.

export interface Sample {
  params: number[]; // input parameter vector
  outputs: number[]; // one or more scalar outputs from the real solver
}

export interface SurrogateModel {
  dim: number;
  outDim: number;
  centers: number[][];
  weights: number[][]; // [outDim][nCenters+dim+1] (RBF weights + linear tail)
  epsilon: number;
  scale: number[]; // per-dimension normalization
  offset: number[];
}

function normalize(params: number[], model: Pick<SurrogateModel, "offset" | "scale">): number[] {
  return params.map((v, i) => (v - model.offset[i]) / (model.scale[i] || 1));
}

function dist2(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    s += d * d;
  }
  return s;
}

// Solve A x = b for multiple right-hand sides via Gaussian elimination.
function solveLinear(A: number[][], B: number[][]): number[][] {
  const n = A.length;
  const m = B[0].length;
  // augment
  const M = A.map((row, i) => [...row, ...B[i]]);
  for (let col = 0; col < n; col++) {
    // partial pivot
    let piv = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r;
    [M[col], M[piv]] = [M[piv], M[col]];
    const d = M[col][col] || 1e-12;
    for (let c = col; c < n + m; c++) M[col][c] /= d;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = M[r][col];
      if (f === 0) continue;
      for (let c = col; c < n + m; c++) M[r][c] -= f * M[col][c];
    }
  }
  // extract solution [n][m]
  const X: number[][] = [];
  for (let i = 0; i < n; i++) X.push(M[i].slice(n));
  return X;
}

export function trainSurrogate(samples: Sample[], ridge = 1e-6): SurrogateModel {
  if (samples.length < 2) throw new Error("Need at least 2 samples to train a surrogate");
  const dim = samples[0].params.length;
  const outDim = samples[0].outputs.length;
  const N = samples.length;

  // per-dimension normalization
  const offset = new Array(dim).fill(0);
  const scale = new Array(dim).fill(1);
  for (let d = 0; d < dim; d++) {
    let min = Infinity, max = -Infinity;
    for (const s of samples) {
      min = Math.min(min, s.params[d]);
      max = Math.max(max, s.params[d]);
    }
    offset[d] = min;
    scale[d] = max - min || 1;
  }
  const centers = samples.map((s) => s.params.map((v, d) => (v - offset[d]) / scale[d]));

  // choose epsilon ~ average nearest-neighbour distance
  let meanNN = 0;
  for (let i = 0; i < N; i++) {
    let best = Infinity;
    for (let j = 0; j < N; j++) if (i !== j) best = Math.min(best, dist2(centers[i], centers[j]));
    meanNN += Math.sqrt(best);
  }
  meanNN /= N;
  const epsilon = 1 / (2 * (meanNN || 1) * (meanNN || 1));

  // Build design matrix: RBF block (N x N) + linear tail (N x (dim+1))
  const cols = N + dim + 1;
  const A: number[][] = [];
  for (let i = 0; i < N; i++) {
    const row = new Array(cols).fill(0);
    for (let j = 0; j < N; j++) {
      row[j] = Math.exp(-epsilon * dist2(centers[i], centers[j]));
    }
    row[i] += ridge; // ridge regularization on diagonal
    for (let d = 0; d < dim; d++) row[N + d] = centers[i][d];
    row[N + dim] = 1;
    A.push(row);
  }
  // Pad to square for the linear tail rows (enforce polynomial orthogonality = 0)
  for (let d = 0; d <= dim; d++) {
    const row = new Array(cols).fill(0);
    for (let j = 0; j < N; j++) row[j] = d < dim ? centers[j][d] : 1;
    A.push(row);
  }
  // RHS
  const B: number[][] = [];
  for (let i = 0; i < N; i++) B.push(samples[i].outputs.slice());
  for (let d = 0; d <= dim; d++) B.push(new Array(outDim).fill(0));

  const solution = solveLinear(A, B); // [cols][outDim]
  // transpose into [outDim][cols]
  const weights: number[][] = [];
  for (let o = 0; o < outDim; o++) weights.push(solution.map((r) => r[o]));

  return { dim, outDim, centers, weights, epsilon, scale, offset };
}

export function predictSurrogate(model: SurrogateModel, params: number[]): number[] {
  const x = normalize(params, model);
  const N = model.centers.length;
  const out = new Array(model.outDim).fill(0);
  for (let o = 0; o < model.outDim; o++) {
    let acc = 0;
    for (let j = 0; j < N; j++) {
      acc += model.weights[o][j] * Math.exp(-model.epsilon * dist2(x, model.centers[j]));
    }
    for (let d = 0; d < model.dim; d++) acc += model.weights[o][N + d] * x[d];
    acc += model.weights[o][N + model.dim];
    out[o] = acc;
  }
  return out;
}

// Leave-one-out-ish accuracy: predict held-out test samples, report R^2 / RMSE.
export function evaluateSurrogate(
  model: SurrogateModel,
  test: Sample[]
): { rmse: number[]; r2: number[]; maxErr: number[] } {
  const outDim = model.outDim;
  const rmse = new Array(outDim).fill(0);
  const maxErr = new Array(outDim).fill(0);
  const means = new Array(outDim).fill(0);
  for (const s of test) for (let o = 0; o < outDim; o++) means[o] += s.outputs[o];
  for (let o = 0; o < outDim; o++) means[o] /= test.length;
  const ssRes = new Array(outDim).fill(0);
  const ssTot = new Array(outDim).fill(0);
  for (const s of test) {
    const pred = predictSurrogate(model, s.params);
    for (let o = 0; o < outDim; o++) {
      const err = pred[o] - s.outputs[o];
      ssRes[o] += err * err;
      ssTot[o] += (s.outputs[o] - means[o]) ** 2;
      maxErr[o] = Math.max(maxErr[o], Math.abs(err));
    }
  }
  const r2 = new Array(outDim).fill(0);
  for (let o = 0; o < outDim; o++) {
    rmse[o] = Math.sqrt(ssRes[o] / test.length);
    r2[o] = ssTot[o] > 0 ? 1 - ssRes[o] / ssTot[o] : 1;
  }
  return { rmse, r2, maxErr };
}

// Convenience: build a training set by sweeping a 1- or 2-D parameter grid
// through a user-supplied solver function that returns scalar outputs.
export function sampleGrid(
  ranges: { min: number; max: number; steps: number }[],
  solver: (params: number[]) => number[]
): Sample[] {
  const samples: Sample[] = [];
  const dims = ranges.length;
  const idx = new Array(dims).fill(0);
  const total = ranges.reduce((acc, r) => acc * r.steps, 1);
  for (let k = 0; k < total; k++) {
    const params = idx.map((iv, d) => {
      const r = ranges[d];
      return r.steps <= 1 ? r.min : r.min + ((r.max - r.min) * iv) / (r.steps - 1);
    });
    samples.push({ params, outputs: solver(params) });
    // increment mixed-radix counter
    for (let d = 0; d < dims; d++) {
      idx[d]++;
      if (idx[d] < ranges[d].steps) break;
      idx[d] = 0;
    }
  }
  return samples;
}
