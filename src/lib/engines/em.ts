// PolySim EM — 2D electrostatics. Superpose point-charge potentials/fields on
// a grid for potential heatmaps and field-line seeding. Pure TS.

export interface Charge { x: number; y: number; q: number; } // q in arbitrary units

const K = 5000; // Coulomb-ish constant for nice visuals

export function potentialAt(charges: Charge[], x: number, y: number): number {
  let v = 0;
  for (const c of charges) {
    const d = Math.hypot(x - c.x, y - c.y);
    v += (K * c.q) / Math.max(6, d);
  }
  return v;
}

export function fieldAt(charges: Charge[], x: number, y: number): { ex: number; ey: number } {
  let ex = 0, ey = 0;
  for (const c of charges) {
    const dx = x - c.x, dy = y - c.y; const d2 = dx * dx + dy * dy; const d = Math.sqrt(d2) || 1;
    const e = (K * c.q) / Math.max(36, d2);
    ex += e * (dx / d); ey += e * (dy / d);
  }
  return { ex, ey };
}

// Trace one field line from a start point following E (sign = direction).
export function traceFieldLine(charges: Charge[], x: number, y: number, sign: number, steps: number, W: number, H: number): [number, number][] {
  const pts: [number, number][] = [[x, y]];
  let px = x, py = y;
  for (let i = 0; i < steps; i++) {
    const { ex, ey } = fieldAt(charges, px, py);
    const mag = Math.hypot(ex, ey) || 1;
    px += (sign * ex / mag) * 4; py += (sign * ey / mag) * 4;
    if (px < 0 || py < 0 || px > W || py > H) break;
    pts.push([px, py]);
    // stop near an opposite charge
    if (charges.some((c) => Math.hypot(px - c.x, py - c.y) < 8)) break;
  }
  return pts;
}
