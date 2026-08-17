// PolySim 3D FEA — space-frame (3D truss) via the direct stiffness method.
// 3 translational DOF per node; bar elements with direction cosines. Solves
// nodal displacements and member axial forces.
import { solve } from "./linalg";

export interface Node3 { x: number; y: number; z: number; fx?: number; fy?: number; fz?: number; fixed?: boolean; }
export interface Member3 { a: number; b: number; EA: number; }
export interface Result3 { disp: number[]; force: number[]; ok: boolean; error?: string; }

export function solveSpaceFrame(nodes: Node3[], members: Member3[]): Result3 {
  const n = nodes.length, dof = 3 * n;
  const K: number[][] = Array.from({ length: dof }, () => new Array(dof).fill(0));
  const dir: { cx: number; cy: number; cz: number; L: number }[] = [];

  for (const m of members) {
    const A = nodes[m.a], B = nodes[m.b];
    const dx = B.x - A.x, dy = B.y - A.y, dz = B.z - A.z;
    const L = Math.hypot(dx, dy, dz) || 1e-9;
    const cx = dx / L, cy = dy / L, cz = dz / L; dir.push({ cx, cy, cz, L });
    const k = m.EA / L;
    const c = [cx, cy, cz];
    const map = [3 * m.a, 3 * m.a + 1, 3 * m.a + 2, 3 * m.b, 3 * m.b + 1, 3 * m.b + 2];
    // 6x6 element stiffness: k * [ T  -T ; -T  T ], T_ij = c_i c_j
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
      const t = k * c[i] * c[j];
      K[map[i]][map[j]] += t; K[map[i + 3]][map[j + 3]] += t;
      K[map[i]][map[j + 3]] -= t; K[map[i + 3]][map[j]] -= t;
    }
  }

  const F = new Array(dof).fill(0);
  nodes.forEach((nd, i) => { F[3 * i] = nd.fx ?? 0; F[3 * i + 1] = nd.fy ?? 0; F[3 * i + 2] = nd.fz ?? 0; });

  const free: number[] = [];
  nodes.forEach((nd, i) => { if (!nd.fixed) { free.push(3 * i, 3 * i + 1, 3 * i + 2); } });
  if (!free.length) return { disp: new Array(dof).fill(0), force: [], ok: false, error: "No free DOFs" };

  const Kr = free.map((r) => free.map((c) => K[r][c]));
  const Fr = free.map((r) => F[r]);
  let ur: number[];
  try { ur = solve(Kr, Fr); } catch { return { disp: new Array(dof).fill(0), force: [], ok: false, error: "Singular (mechanism) — add supports" }; }
  const disp = new Array(dof).fill(0);
  free.forEach((d, i) => (disp[d] = ur[i]));

  const force = members.map((m, i) => {
    const { cx, cy, cz, L } = dir[i];
    const du = [disp[3 * m.b] - disp[3 * m.a], disp[3 * m.b + 1] - disp[3 * m.a + 1], disp[3 * m.b + 2] - disp[3 * m.a + 2]];
    const elong = cx * du[0] + cy * du[1] + cz * du[2];
    return (m.EA / L) * elong;
  });
  return { disp, force, ok: true };
}

// A 3D tower/frame starter.
export function starterFrame(): { nodes: Node3[]; members: Member3[] } {
  const nodes: Node3[] = [];
  const s = 60;
  // 3 levels of a square tower
  for (let level = 0; level < 4; level++) {
    const y = level * 70;
    nodes.push({ x: -s, y, z: -s, fixed: level === 0 }, { x: s, y, z: -s, fixed: level === 0 }, { x: s, y, z: s, fixed: level === 0 }, { x: -s, y, z: s, fixed: level === 0 });
  }
  // apply a lateral + down load at the top
  nodes[nodes.length - 1].fx = 15; nodes[nodes.length - 1].fy = -25;
  const M = (a: number, b: number): Member3 => ({ a, b, EA: 4000 });
  const members: Member3[] = [];
  for (let level = 0; level < 4; level++) {
    const o = level * 4;
    members.push(M(o, o + 1), M(o + 1, o + 2), M(o + 2, o + 3), M(o + 3, o)); // ring
    if (level < 3) { for (let k = 0; k < 4; k++) members.push(M(o + k, o + 4 + k)); // verticals
      members.push(M(o, o + 4 + 1), M(o + 1, o + 4 + 2), M(o + 2, o + 4 + 3), M(o + 3, o + 4)); } // braces
  }
  return { nodes, members };
}
