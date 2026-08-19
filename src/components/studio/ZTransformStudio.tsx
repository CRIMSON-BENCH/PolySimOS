"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useCanvasDrag, PALETTE } from "@/lib/studioKit";

const W = 820, H = 560;

// z-plane (draggable), impulse response, magnitude, phase — a 2-column dashboard on one canvas.
const ZR = { x: 24, y: 26, w: 336, h: 336 };          // z-plane (square)
const IR = { x: 24, y: 392, w: 336, h: 150 };         // impulse response
const MR = { x: 404, y: 26, w: 392, h: 248 };         // |H| magnitude (dB)
const PR = { x: 404, y: 300, w: 392, h: 242 };        // phase
const CX = ZR.x + ZR.w / 2, CY = ZR.y + ZR.h / 2, RAD = 132; // unit-circle radius in px

// ---- complex arithmetic (a point is [re, im]) --------------------------------
type C = [number, number];
const cadd = (a: C, b: C): C => [a[0] + b[0], a[1] + b[1]];
const csub = (a: C, b: C): C => [a[0] - b[0], a[1] - b[1]];
const cmul = (a: C, b: C): C => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cdiv = (a: C, b: C): C => { const d = b[0] * b[0] + b[1] * b[1] || 1e-30; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
const cabs = (a: C): number => Math.hypot(a[0], a[1]);
const carg = (a: C): number => Math.atan2(a[1], a[0]);

type Pt = { re: number; im: number };
// Each stored point is a REPRESENTATIVE in the upper half-plane; a non-real one implies its conjugate.
const expand = (pts: Pt[]): C[] => pts.flatMap((p) => (Math.abs(p.im) > 1e-9 ? [[p.re, p.im], [p.re, -p.im]] as C[] : [[p.re, 0]] as C[]));

// Expand H(z) = ∏(z - r_i) into descending-power polynomial coefficients (complex).
function polyFromRoots(roots: C[]): C[] {
  let c: C[] = [[1, 0]];
  for (const r of roots) {
    const next: C[] = new Array(c.length + 1).fill(0).map(() => [0, 0] as C);
    for (let i = 0; i < c.length; i++) { next[i] = cadd(next[i], c[i]); next[i + 1] = cadd(next[i + 1], cmul(c[i], [-r[0], -r[1]])); }
    c = next;
  }
  return c;
}

// H(e^{jω}) evaluated directly from zpk — always consistent with the z-plane picture.
const evalH = (z: C, zeros: C[], poles: C[]): C => {
  let num: C = [1, 0], den: C = [1, 0];
  for (const q of zeros) num = cmul(num, csub(z, q));
  for (const p of poles) den = cmul(den, csub(z, p));
  return cdiv(num, den);
};

const P2C = (re: number, im: number): C => [CX + re * RAD, CY - im * RAD];
const C2P = (px: number, py: number): Pt => ({ re: (px - CX) / RAD, im: (CY - py) / RAD });

// ---- presets (representative upper-half points) ------------------------------
const ang = (deg: number, r: number): Pt => ({ re: r * Math.cos((deg * Math.PI) / 180), im: r * Math.sin((deg * Math.PI) / 180) });
const PRESETS: Record<string, { zeros: Pt[]; poles: Pt[]; radius: number }> = {
  "Low-pass": { zeros: [{ re: -1, im: 0 }], poles: [{ re: 0.82, im: 0 }], radius: 0.82 },
  "High-pass": { zeros: [{ re: 1, im: 0 }], poles: [{ re: -0.82, im: 0 }], radius: 0.82 },
  Notch: { zeros: [ang(55, 1)], poles: [ang(55, 0.9)], radius: 0.9 },
  Resonator: { zeros: [{ re: 1, im: 0 }, { re: -1, im: 0 }], poles: [ang(48, 0.94)], radius: 0.94 },
  "Butterworth-ish": { zeros: [{ re: -1, im: 0 }, { re: -1, im: 0 }], poles: [ang(58, 0.6)], radius: 0.6 },
};

const NW = 400;   // frequency-response resolution
const NIMP = 40;  // impulse-response length

export function ZTransformStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zeros, setZeros] = useState<Pt[]>(PRESETS["Low-pass"].zeros);
  const [poles, setPoles] = useState<Pt[]>(PRESETS["Low-pass"].poles);
  const [radius, setRadius] = useState(0.82);
  const drag = useRef<{ kind: "z" | "p"; i: number } | null>(null);

  useCanvasDrag(canvasRef, W, H, {
    pick: (x, y) => {
      const test = (arr: Pt[]): number => arr.findIndex((p) => {
        const [ux, uy] = P2C(p.re, p.im); const [lx, ly] = P2C(p.re, -p.im);
        return Math.hypot(ux - x, uy - y) < 15 || Math.hypot(lx - x, ly - y) < 15;
      });
      const zi = test(zeros); if (zi >= 0) { drag.current = { kind: "z", i: zi }; return true; }
      const pi = test(poles); if (pi >= 0) { drag.current = { kind: "p", i: pi }; return true; }
      return false;
    },
    move: (x, y) => {
      const d = drag.current; if (!d) return;
      // Only respond to drags that stay inside the z-plane panel.
      if (x < ZR.x || x > ZR.x + ZR.w || y < ZR.y || y > ZR.y + ZR.h) return;
      const { re } = C2P(x, y);
      let im = Math.abs(C2P(x, y).im); if (im < 0.04) im = 0; // snap near-real points onto the real axis
      const setFn = d.kind === "z" ? setZeros : setPoles;
      setFn((prev) => prev.map((p, i) => (i === d.i ? { re, im } : p)));
    },
    up: () => { drag.current = null; },
  });

  const applyPreset = (label: string) => { const p = PRESETS[label]; setZeros(p.zeros); setPoles(p.poles); setRadius(p.radius); };
  const applyRadius = (r: number) => { setRadius(r); setPoles((prev) => prev.map((p) => { const mag = Math.hypot(p.re, p.im) || 1e-9; return { re: (p.re / mag) * r, im: (p.im / mag) * r }; })); };

  // Filter response computed from the current zpk.
  const resp = useMemo(() => {
    const Z = expand(zeros), P = expand(poles);
    const w = new Float64Array(NW), db = new Float64Array(NW), ph = new Float64Array(NW);
    let maxDb = -Infinity, wPeak = 0, prev = 0;
    for (let i = 0; i < NW; i++) {
      const om = (Math.PI * i) / (NW - 1);
      const h = evalH([Math.cos(om), Math.sin(om)], Z, P);
      const m = cabs(h); const d = 20 * Math.log10(m + 1e-12);
      let a = carg(h);
      // unwrap
      if (i > 0) { while (a - prev > Math.PI) a -= 2 * Math.PI; while (a - prev < -Math.PI) a += 2 * Math.PI; }
      prev = a;
      w[i] = om; db[i] = d; ph[i] = a;
      if (d > maxDb) { maxDb = d; wPeak = om; }
    }
    // impulse response via the difference equation (bb, aa in z^{-1}), from zpk polynomials.
    const bC = polyFromRoots(Z), aC = polyFromRoots(P);
    const np = P.length, nz = Z.length;
    const aa = aC.map((c) => c[0]);                          // real (conjugate pairs cancel imag)
    const bb = new Array(np + 1).fill(0);
    for (let i = 0; i <= nz && np - nz + i <= np; i++) if (np - nz + i >= 0) bb[np - nz + i] = bC[i][0];
    const a0 = aa[0] || 1;
    const imp = new Float64Array(NIMP);
    for (let n = 0; n < NIMP; n++) {
      let ff = n < bb.length ? bb[n] : 0;
      for (let d = 1; d <= np; d++) if (n - d >= 0) ff -= aa[d] * imp[n - d];
      imp[n] = ff / a0;
    }
    const maxPoleR = P.reduce((m, p) => Math.max(m, cabs(p)), 0);
    const minZeroToCircle = Z.length ? Z.reduce((m, q) => Math.min(m, Math.abs(cabs(q) - 1)), Infinity) : Infinity;
    return { w, db, ph, maxDb, wPeak, imp, np, nz, maxPoleR, minZeroToCircle };
  }, [zeros, poles]);

  const stable = resp.maxPoleR < 1 - 1e-9;

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H);
    ctx.fillStyle = PALETTE.bg; ctx.fillRect(0, 0, W, H);

    // ---- z-plane panel ----
    ctx.save();
    ctx.fillStyle = stable ? "rgba(34,211,238,0.04)" : "rgba(244,63,94,0.10)";
    ctx.fillRect(ZR.x, ZR.y, ZR.w, ZR.h);
    ctx.strokeStyle = PALETTE.grid; ctx.lineWidth = 1;
    ctx.strokeRect(ZR.x, ZR.y, ZR.w, ZR.h);
    // axes
    ctx.strokeStyle = PALETTE.axis; ctx.beginPath();
    ctx.moveTo(ZR.x, CY); ctx.lineTo(ZR.x + ZR.w, CY); ctx.moveTo(CX, ZR.y); ctx.lineTo(CX, ZR.y + ZR.h); ctx.stroke();
    // unit circle
    ctx.strokeStyle = stable ? "#64748b" : "#f43f5e"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(CX, CY, RAD, 0, 7); ctx.stroke();
    ctx.fillStyle = PALETTE.text; ctx.font = "11px ui-sans-serif, sans-serif";
    ctx.fillText("Re", ZR.x + ZR.w - 18, CY - 6); ctx.fillText("Im", CX + 6, ZR.y + 12);
    ctx.fillText("|z| = 1", CX + RAD - 34, CY - 6);
    // zeros (○) then poles (×), with conjugates
    const drawZero = (re: number, im: number) => { const [px, py] = P2C(re, im); ctx.strokeStyle = PALETTE.accent; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px, py, 7, 0, 7); ctx.stroke(); };
    const drawPole = (re: number, im: number, bad: boolean) => { const [px, py] = P2C(re, im); ctx.strokeStyle = bad ? "#f43f5e" : "#22d3ee"; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(px - 6, py - 6); ctx.lineTo(px + 6, py + 6); ctx.moveTo(px + 6, py - 6); ctx.lineTo(px - 6, py + 6); ctx.stroke(); };
    for (const q of zeros) { drawZero(q.re, q.im); if (Math.abs(q.im) > 1e-9) drawZero(q.re, -q.im); }
    for (const p of poles) { const bad = Math.hypot(p.re, p.im) > 1; drawPole(p.re, p.im, bad); if (Math.abs(p.im) > 1e-9) drawPole(p.re, -p.im, bad); }
    ctx.fillStyle = PALETTE.text; ctx.font = "10px ui-sans-serif, sans-serif";
    ctx.fillText("drag poles (×) and zeros (○) — conjugates mirror", ZR.x + 4, ZR.y + ZR.h - 6);
    if (!stable) { ctx.fillStyle = "#f43f5e"; ctx.font = "bold 12px ui-sans-serif, sans-serif"; ctx.fillText("⚠ UNSTABLE — pole outside unit circle", ZR.x + 4, ZR.y - 8); }
    ctx.restore();

    // ---- generic line-plot helper ----
    const axesBox = (r: typeof MR, title: string) => {
      ctx.strokeStyle = PALETTE.grid; ctx.lineWidth = 1; ctx.strokeRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = PALETTE.text; ctx.font = "11px ui-sans-serif, sans-serif"; ctx.fillText(title, r.x + 4, r.y - 6);
    };

    // ---- magnitude (dB) ----
    axesBox(MR, "|H(e^{jω})|  (dB)");
    const dbMax = Math.max(resp.maxDb + 3, 3), dbMin = resp.maxDb - 60;
    const toY = (d: number) => MR.y + MR.h - ((Math.max(dbMin, Math.min(dbMax, d)) - dbMin) / (dbMax - dbMin)) * MR.h;
    // 0 dB reference line
    if (0 <= dbMax && 0 >= dbMin) { ctx.strokeStyle = PALETTE.axis; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(MR.x, toY(0)); ctx.lineTo(MR.x + MR.w, toY(0)); ctx.stroke(); ctx.setLineDash([]); }
    ctx.strokeStyle = PALETTE.primary; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i < NW; i++) { const px = MR.x + (i / (NW - 1)) * MR.w; const py = toY(resp.db[i]); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.stroke();
    // resonant-freq marker
    const rx = MR.x + (resp.wPeak / Math.PI) * MR.w;
    ctx.strokeStyle = "rgba(245,158,11,0.7)"; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(rx, MR.y); ctx.lineTo(rx, MR.y + MR.h); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = PALETTE.text; ctx.font = "10px ui-sans-serif, sans-serif";
    ctx.fillText("0", MR.x - 8, MR.y + MR.h + 12); ctx.fillText("ω → π", MR.x + MR.w - 30, MR.y + MR.h + 12);

    // ---- phase ----
    axesBox(PR, "∠H(e^{jω})  (rad, unwrapped)");
    let pMin = Infinity, pMax = -Infinity; for (let i = 0; i < NW; i++) { pMin = Math.min(pMin, resp.ph[i]); pMax = Math.max(pMax, resp.ph[i]); }
    if (pMax - pMin < 1e-6) { pMax += 1; pMin -= 1; }
    const toYp = (v: number) => PR.y + PR.h - ((v - pMin) / (pMax - pMin)) * PR.h;
    ctx.strokeStyle = PALETTE.series[3]; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i < NW; i++) { const px = PR.x + (i / (NW - 1)) * PR.w; const py = toYp(resp.ph[i]); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.stroke();
    ctx.fillStyle = PALETTE.text; ctx.font = "10px ui-sans-serif, sans-serif";
    ctx.fillText("0", PR.x - 8, PR.y + PR.h + 12); ctx.fillText("ω → π", PR.x + PR.w - 30, PR.y + PR.h + 12);

    // ---- impulse response (stem) ----
    axesBox(IR, "impulse response  h[n]");
    let hMax = 1e-6; for (let n = 0; n < NIMP; n++) hMax = Math.max(hMax, Math.abs(resp.imp[n]));
    const base = IR.y + IR.h / 2;
    ctx.strokeStyle = PALETTE.axis; ctx.beginPath(); ctx.moveTo(IR.x, base); ctx.lineTo(IR.x + IR.w, base); ctx.stroke();
    for (let n = 0; n < NIMP; n++) {
      const px = IR.x + 6 + (n / (NIMP - 1)) * (IR.w - 12);
      const py = base - (resp.imp[n] / hMax) * (IR.h / 2 - 8);
      ctx.strokeStyle = "rgba(163,230,53,0.55)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(px, base); ctx.lineTo(px, py); ctx.stroke();
      ctx.fillStyle = PALETTE.accent; ctx.beginPath(); ctx.arc(px, py, 2.2, 0, 7); ctx.fill();
    }
    ctx.fillStyle = PALETTE.text; ctx.font = "10px ui-sans-serif, sans-serif";
    ctx.fillText("n = 0", IR.x + 2, IR.y + IR.h + 12); ctx.fillText(`n = ${NIMP - 1}`, IR.x + IR.w - 30, IR.y + IR.h + 12);
  }, [zeros, poles, resp, stable]);

  const wPeakStr = `${(resp.wPeak / Math.PI).toFixed(2)}π`;
  const explain = !stable
    ? `A pole lies on or outside the unit circle (|p| = ${resp.maxPoleR.toFixed(2)} ≥ 1), so the impulse response grows without bound — the filter is unstable. Drag every pole strictly inside the circle to stabilize it.`
    : resp.maxPoleR > 0.9
    ? `A pole sits very close to the unit circle (|p| = ${resp.maxPoleR.toFixed(2)}), producing a sharp resonant peak in |H| near ω = ${wPeakStr}. The closer a pole is to the circle, the taller and narrower the peak — and the longer the impulse response rings.`
    : resp.minZeroToCircle < 0.05
    ? `A zero lies essentially on the unit circle, so |H| drops to a deep null at that frequency — this is how notch and band-reject filters kill a specific tone. The response peaks near ω = ${wPeakStr}.`
    : `Poles pull the magnitude response up (peaks) and zeros push it down (nulls); with the poles comfortably inside the circle (|p| = ${resp.maxPoleR.toFixed(2)}) the filter is stable and its impulse response decays. The response peaks near ω = ${wPeakStr}.`;

  const zList = expand(zeros).map((z) => `complex(${z[0].toFixed(3)}, ${z[1].toFixed(3)})`).join(", ");
  const pList = expand(poles).map((p) => `complex(${p[0].toFixed(3)}, ${p[1].toFixed(3)})`).join(", ");
  const code = `import numpy as np
from scipy import signal

# zeros and poles (conjugate pairs included) in the z-plane
zeros = [${zList}]
poles = [${pList}]
k = 1.0

# H(z) = k * prod(z - z_i) / prod(z - p_i)
b, a = signal.zpk2tf(zeros, poles, k)

w, h = signal.freqz(b, a, worN=512)
mag_db = 20 * np.log10(np.abs(h) + 1e-12)
phase = np.unwrap(np.angle(h))

# impulse response
_, imp = signal.dimpulse((b, a, 1.0), n=${NIMP})
imp = np.squeeze(imp)

stable = np.all(np.abs(poles) < 1.0)
print("stable:", stable, "| peak at w =", w[np.argmax(mag_db)])`;

  return (
    <StudioChrome title="Z-Transform Studio" tagline="pole–zero design of digital filters"
      controls={<div>
        <p className="mb-3 text-xs text-slate-500">Drag poles (×) and zeros (○) around the z-plane and watch the digital filter&apos;s frequency response, phase, and impulse response update live. Poles/zeros move as conjugate pairs. A filter is stable only while every pole stays inside the unit circle.</p>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={applyPreset} />
        <Slider label="Pole radius |p|" value={radius} min={0.3} max={0.995} step={0.005} onChange={applyRadius} />
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Poles" value={String(resp.np)} />
        <Stat label="Zeros" value={String(resp.nz)} />
        <Stat label="Stability" value={stable ? "stable" : "UNSTABLE"} />
        <Stat label="Max |pole|" value={resp.maxPoleR.toFixed(3)} />
        <Stat label="Resonant ω" value={wPeakStr} />
        <Stat label="Peak gain" value={`${resp.maxDb.toFixed(1)} dB`} />
        <Equation tex={`H(z)=\\frac{\\prod(z-z_i)}{\\prod(z-p_i)}`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" /></StudioChrome>
  );
}
