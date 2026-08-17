// PolySim FEA — 2D truss finite-element solver. Assembles the global stiffness
// matrix from bar elements, applies supports + loads, and solves for nodal
// displacements and member axial forces. Real direct-stiffness method.
import { solve } from "./linalg";

export interface TrussNode { x: number; y: number; fixedX?: boolean; fixedY?: boolean; fx?: number; fy?: number; }
export interface TrussMember { a: number; b: number; EA: number; } // node indices + axial stiffness EA

export interface TrussResult {
  disp: number[]; // [u0x,u0y,u1x,u1y,...]
  memberForce: number[]; // axial force per member (+tension)
  ok: boolean;
  error?: string;
}

export function solveTruss(nodes: TrussNode[], members: TrussMember[]): TrussResult {
  const n = nodes.length, dof = 2 * n;
  const K: number[][] = Array.from({ length: dof }, () => new Array(dof).fill(0));
  const memberDir: { c: number; s: number; L: number }[] = [];

  for (const m of members) {
    const A = nodes[m.a], B = nodes[m.b];
    const dx = B.x - A.x, dy = B.y - A.y; const L = Math.hypot(dx, dy) || 1e-9;
    const c = dx / L, s = dy / L; memberDir.push({ c, s, L });
    const k = m.EA / L;
    const ke = [
      [c * c, c * s, -c * c, -c * s],
      [c * s, s * s, -c * s, -s * s],
      [-c * c, -c * s, c * c, c * s],
      [-c * s, -s * s, c * s, s * s],
    ].map((row) => row.map((v) => v * k));
    const map = [2 * m.a, 2 * m.a + 1, 2 * m.b, 2 * m.b + 1];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) K[map[i]][map[j]] += ke[i][j];
  }

  // Force vector
  const F = new Array(dof).fill(0);
  nodes.forEach((nd, i) => { F[2 * i] = nd.fx ?? 0; F[2 * i + 1] = nd.fy ?? 0; });

  // Apply supports: eliminate fixed DOFs (penalty via row/col reduction)
  const free: number[] = [];
  nodes.forEach((nd, i) => { if (!nd.fixedX) free.push(2 * i); if (!nd.fixedY) free.push(2 * i + 1); });
  if (free.length === 0) return { disp: new Array(dof).fill(0), memberForce: [], ok: false, error: "No free DOFs" };

  const Kr = free.map((r) => free.map((c) => K[r][c]));
  const Fr = free.map((r) => F[r]);
  let ur: number[];
  try { ur = solve(Kr, Fr); } catch { return { disp: new Array(dof).fill(0), memberForce: [], ok: false, error: "Structure is a mechanism (singular) — add supports" }; }

  const disp = new Array(dof).fill(0);
  free.forEach((d, i) => (disp[d] = ur[i]));

  const memberForce = members.map((m, i) => {
    const { c, s, L } = memberDir[i];
    const uax = disp[2 * m.a], uay = disp[2 * m.a + 1], ubx = disp[2 * m.b], uby = disp[2 * m.b + 1];
    const elong = c * (ubx - uax) + s * (uby - uay);
    return (m.EA / L) * elong;
  });

  return { disp, memberForce, ok: true };
}

// A simple cantilever/bridge starter truss.
export function starterTruss(): { nodes: TrussNode[]; members: TrussMember[] } {
  const nodes: TrussNode[] = [
    { x: 0, y: 0, fixedX: true, fixedY: true },
    { x: 100, y: 0 },
    { x: 200, y: 0 },
    { x: 300, y: 0, fy: -20 },
    { x: 50, y: 80 },
    { x: 150, y: 80 },
    { x: 250, y: 80 },
  ];
  const M = (a: number, b: number): TrussMember => ({ a, b, EA: 2000 });
  const members = [M(0, 1), M(1, 2), M(2, 3), M(0, 4), M(4, 5), M(5, 6), M(4, 1), M(5, 2), M(6, 3), M(1, 5), M(2, 6)];
  return { nodes, members };
}
