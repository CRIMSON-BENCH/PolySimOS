// PolySim linear algebra — real matrix operations for the math workspace.
// Pure TS, no deps: multiply, transpose, determinant, inverse, and solve Ax=b.

export type Matrix = number[][];
export type Vector = number[];

export function multiply(A: Matrix, B: Matrix): Matrix {
  const n = A.length, m = B[0].length, k = B.length;
  if (A[0].length !== k) throw new Error("Incompatible dimensions");
  const C: Matrix = Array.from({ length: n }, () => new Array(m).fill(0));
  for (let i = 0; i < n; i++)
    for (let j = 0; j < m; j++) {
      let s = 0;
      for (let t = 0; t < k; t++) s += A[i][t] * B[t][j];
      C[i][j] = s;
    }
  return C;
}

export function transpose(A: Matrix): Matrix {
  return A[0].map((_, j) => A.map((row) => row[j]));
}

export function identity(n: number): Matrix {
  return Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
}

// LU-based determinant with partial pivoting.
export function determinant(A: Matrix): number {
  const n = A.length;
  const M = A.map((r) => r.slice());
  let det = 1;
  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r;
    if (Math.abs(M[piv][col]) < 1e-12) return 0;
    if (piv !== col) { [M[col], M[piv]] = [M[piv], M[col]]; det = -det; }
    det *= M[col][col];
    for (let r = col + 1; r < n; r++) {
      const f = M[r][col] / M[col][col];
      for (let c = col; c < n; c++) M[r][c] -= f * M[col][c];
    }
  }
  return det;
}

// Solve Ax = b via Gauss-Jordan with partial pivoting.
export function solve(A: Matrix, b: Vector): Vector {
  const n = A.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r;
    if (Math.abs(M[piv][col]) < 1e-12) throw new Error("Singular matrix");
    [M[col], M[piv]] = [M[piv], M[col]];
    const d = M[col][col];
    for (let c = col; c <= n; c++) M[col][c] /= d;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = M[r][col];
      for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c];
    }
  }
  return M.map((row) => row[n]);
}

export function inverse(A: Matrix): Matrix {
  const n = A.length;
  const I = identity(n);
  return transpose(I.map((_, j) => solve(A, I.map((row) => row[j]))));
}

// Parse a matrix from text like "1 2; 3 4" (rows separated by ; or newline).
export function parseMatrix(text: string): Matrix {
  return text
    .trim()
    .split(/[;\n]/)
    .map((row) => row.trim().split(/[\s,]+/).map(Number))
    .filter((r) => r.length > 0 && r.every((v) => !isNaN(v)));
}

export function formatMatrix(A: Matrix): string {
  return A.map((r) => r.map((v) => (Math.round(v * 1000) / 1000)).join("  ")).join("\n");
}
