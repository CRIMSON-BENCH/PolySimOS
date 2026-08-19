"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers, PALETTE } from "@/lib/studioKit";

const W = 760, H = 480;

// --- Cart-pole physical constants (used for the linearized plant) ---
const CART_M = 1.0;   // cart mass (kg)
const POLE_M = 0.2;   // pole mass (kg)
const POLE_L = 0.5;   // pole length to center of mass (m)
const GRAV = 9.81;    // gravity (m/s^2)

// Linearized inverted-pendulum-on-a-cart about the upright equilibrium.
// State x = [position, velocity, angle, angular velocity]; input u = force on cart.
//   ẍ  = -(m g / M) θ + (1/M) u
//   θ̈ = g(M+m)/(M l) θ - (1/(M l)) u
const A: number[][] = [
  [0, 1, 0, 0],
  [0, 0, -(POLE_M * GRAV) / CART_M, 0],
  [0, 0, 0, 1],
  [0, 0, (GRAV * (CART_M + POLE_M)) / (CART_M * POLE_L), 0],
];
const B: number[][] = [[0], [1 / CART_M], [0], [-1 / (CART_M * POLE_L)]];

// ---------- small dense matrix helpers (n x n) ----------
const N = 4;
const zeros = (n = N) => Array.from({ length: n }, () => new Array(n).fill(0));
const ident = (n = N) => { const m = zeros(n); for (let i = 0; i < n; i++) m[i][i] = 1; return m; };
function mul(a: number[][], b: number[][]) {
  const n = a.length, p = b[0].length, q = b.length; const r = Array.from({ length: n }, () => new Array(p).fill(0));
  for (let i = 0; i < n; i++) for (let k = 0; k < q; k++) { const aik = a[i][k]; if (aik) for (let j = 0; j < p; j++) r[i][j] += aik * b[k][j]; }
  return r;
}
const transpose = (a: number[][]) => a[0].map((_, j) => a.map((row) => row[j]));
const trace = (a: number[][]) => a.reduce((s, row, i) => s + row[i], 0);

// Solve the Lyapunov equation Aᵀ_cl P + P A_cl + W = 0 for symmetric P.
// The linear operator is assembled by applying it to each basis matrix E_{ab}
// (column a+N·b), then the n²×n² system is solved by Gauss–Jordan elimination.
function solveLyap(Acl: number[][], Wm: number[][]) {
  const At = transpose(Acl), sz = N * N, idx = (i: number, j: number) => i + N * j;
  const M = Array.from({ length: sz }, () => new Array(sz).fill(0));
  for (let b = 0; b < N; b++) for (let a = 0; a < N; a++) {
    const col = idx(a, b);
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const v = At[i][a] * (j === b ? 1 : 0) + (i === a ? 1 : 0) * Acl[b][j];
      if (v) M[idx(i, j)][col] += v;
    }
  }
  const rhs = new Array(sz);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) rhs[idx(i, j)] = -Wm[i][j];
  for (let c = 0; c < sz; c++) {
    let piv = c; for (let r = c + 1; r < sz; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
    [M[c], M[piv]] = [M[piv], M[c]]; [rhs[c], rhs[piv]] = [rhs[piv], rhs[c]];
    const d = M[c][c];
    for (let r = 0; r < sz; r++) { if (r === c) continue; const f = M[r][c] / d; if (!f) continue; for (let cc = c; cc < sz; cc++) M[r][cc] -= f * M[c][cc]; rhs[r] -= f * rhs[c]; }
  }
  const P = zeros();
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) P[i][j] = rhs[idx(i, j)] / M[idx(i, j)][idx(i, j)];
  for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) { const a = (P[i][j] + P[j][i]) / 2; P[i][j] = P[j][i] = a; }
  return P;
}

const Acl = (K: number[]) => A.map((row, i) => row.map((v, j) => v - B[i][0] * K[j]));

// ---------- Continuous-time Riccati solver (Kleinman / Newton iteration) ----------
// Each step solves a Lyapunov equation for P given the current stabilizing gain, then
// updates K = R⁻¹BᵀP. Seeded with a gain that stabilizes the (fixed) cart-pole plant,
// it converges quadratically to the stabilizing solution of the CARE for any Q, R.
function solveCARE(Q: number[][], R: number) {
  const invR = 1 / R;
  let K = [-1, -2, -30, -6]; // stabilizes A − BK for the fixed plant (verified)
  for (let it = 0; it < 200; it++) {
    const W = Q.map((row, i) => row.map((v, j) => v + R * K[i] * K[j])); // Q + KᵀRK
    const P = solveLyap(Acl(K), W);
    const BtP = mul(transpose(B), P); // 1x4
    const Kn = BtP[0].map((v) => invR * v);
    let d = 0; for (let i = 0; i < N; i++) d += Math.abs(Kn[i] - K[i]);
    K = Kn;
    if (d < 1e-10 || !Number.isFinite(K[0])) break;
  }
  return K;
}

// ---------- eigenvalues of a 4x4 real matrix (for stability check) ----------
type Cx = { re: number; im: number };
const cadd = (a: Cx, b: Cx) => ({ re: a.re + b.re, im: a.im + b.im });
const csub = (a: Cx, b: Cx) => ({ re: a.re - b.re, im: a.im - b.im });
const cmul = (a: Cx, b: Cx) => ({ re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re });
const cdiv = (a: Cx, b: Cx) => { const d = b.re * b.re + b.im * b.im || 1e-30; return { re: (a.re * b.re + a.im * b.im) / d, im: (a.im * b.re - a.re * b.im) / d }; };

// Faddeev–LeVerrier: characteristic polynomial coefficients [1, c1, c2, c3, c4].
function charPoly(M: number[][]) {
  const n = M.length; let Mk = ident(n); const c = [1];
  for (let k = 1; k <= n; k++) {
    if (k > 1) { const AM = mul(M, Mk); for (let i = 0; i < n; i++) AM[i][i] += c[k - 1]; Mk = AM; }
    const ck = -trace(mul(M, Mk)) / k; c.push(ck);
  }
  return c;
}

// Durand–Kerner root finder for the monic polynomial.
function polyRoots(coeffs: number[]): Cx[] {
  const n = coeffs.length - 1;
  const evalP = (z: Cx) => { let r: Cx = { re: coeffs[0], im: 0 }; for (let i = 1; i <= n; i++) r = cadd(cmul(r, z), { re: coeffs[i], im: 0 }); return r; };
  const seed: Cx = { re: 0.4, im: 0.9 };
  const z: Cx[] = []; let cur: Cx = { re: 1, im: 0 };
  for (let i = 0; i < n; i++) { z.push(cur); cur = cmul(cur, seed); }
  for (let iter = 0; iter < 200; iter++) {
    let maxDelta = 0;
    for (let i = 0; i < n; i++) {
      let den: Cx = { re: 1, im: 0 };
      for (let j = 0; j < n; j++) if (j !== i) den = cmul(den, csub(z[i], z[j]));
      const delta = cdiv(evalP(z[i]), den);
      z[i] = csub(z[i], delta);
      maxDelta = Math.max(maxDelta, Math.hypot(delta.re, delta.im));
    }
    if (maxDelta < 1e-11) break;
  }
  return z;
}

const fmtCx = (c: Cx) => Math.abs(c.im) < 1e-4
  ? c.re.toFixed(2)
  : `${c.re.toFixed(2)}${c.im >= 0 ? "+" : "−"}${Math.abs(c.im).toFixed(2)}i`;

const PRESETS: Record<string, { qPos: number; qAng: number; r: number; dist: number }> = {
  "Cheap control (aggressive)": { qPos: 1, qAng: 60, r: 0.02, dist: 25 },
  "Expensive control (gentle)": { qPos: 1, qAng: 40, r: 6, dist: 25 },
  Balanced: { qPos: 1, qAng: 50, r: 0.3, dist: 20 },
  "Big disturbance": { qPos: 2, qAng: 80, r: 0.1, dist: 40 },
};

export function LQRStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ qPos, qAng, r, dist }, update] = useShareableNumbers({ qPos: 1, qAng: 50, r: 0.3, dist: 20 });
  const [tick, setTick] = useState(0);

  // Solve LQR + simulate the closed loop. Recomputed only when weights change.
  const sim = useMemo(() => {
    const Q = zeros();
    Q[0][0] = qPos;   // position error
    Q[1][1] = 0.1;    // velocity (small)
    Q[2][2] = qAng;   // angle error
    Q[3][3] = 0.1;    // angular velocity (small)
    const K = solveCARE(Q, Math.max(r, 1e-4));

    // Closed-loop A − BK
    const AclM = Acl(K);
    const eig = polyRoots(charPoly(AclM)).sort((a, b) => b.re - a.re);
    const maxRe = eig[0]?.re ?? 0;

    // Simulate ẋ = Acl x from a disturbed initial state (pole knocked by `dist` degrees).
    const dt = 0.02, steps = 400;
    const x0 = [0, 0, (dist * Math.PI) / 180, 0];
    const states: number[][] = [x0.slice()];
    const controls: number[] = [-(K[0] * x0[0] + K[1] * x0[1] + K[2] * x0[2] + K[3] * x0[3])];
    const deriv = (x: number[]) => AclM.map((row) => row[0] * x[0] + row[1] * x[1] + row[2] * x[2] + row[3] * x[3]);
    let x = x0.slice();
    for (let s = 0; s < steps; s++) {
      // RK4
      const k1 = deriv(x);
      const k2 = deriv(x.map((v, i) => v + (dt / 2) * k1[i]));
      const k3 = deriv(x.map((v, i) => v + (dt / 2) * k2[i]));
      const k4 = deriv(x.map((v, i) => v + dt * k3[i]));
      x = x.map((v, i) => v + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
      states.push(x.slice());
      controls.push(-(K[0] * x[0] + K[1] * x[1] + K[2] * x[2] + K[3] * x[3]));
    }

    // Settling time: last time |angle| leaves a 1° band or |pos| leaves 2 cm.
    let settle = 0;
    for (let s = states.length - 1; s >= 0; s--) {
      if (Math.abs(states[s][2]) > 0.0175 || Math.abs(states[s][0]) > 0.02) { settle = (s + 1) * dt; break; }
    }
    const peakU = controls.reduce((m, u) => Math.max(m, Math.abs(u)), 0);
    return { K, eig, maxRe, states, controls, settle, peakU, dt };
  }, [qPos, qAng, r, dist]);

  // Draw current frame.
  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H);
    ctx.fillStyle = PALETTE.bg; ctx.fillRect(0, 0, W, H);

    const i = Math.min(tick, sim.states.length - 1);
    const s = sim.states[i];
    const pos = s[0], th = s[2];

    // Scene geometry (top region).
    const trackY = H * 0.5;
    const pxPerM = 150;
    const cx = Math.max(70, Math.min(W - 70, W / 2 + pos * pxPerM));
    const cartW = 76, cartH = 34;
    const poleLen = 150;

    // track
    ctx.strokeStyle = PALETTE.axis; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(20, trackY + cartH / 2 + 4); ctx.lineTo(W - 20, trackY + cartH / 2 + 4); ctx.stroke();
    // center reference tick
    ctx.strokeStyle = "#1e293b"; ctx.setLineDash([4, 6]);
    ctx.beginPath(); ctx.moveTo(W / 2, 30); ctx.lineTo(W / 2, trackY + cartH / 2 + 4); ctx.stroke();
    ctx.setLineDash([]);

    // cart
    ctx.fillStyle = PALETTE.primary;
    ctx.fillRect(cx - cartW / 2, trackY - cartH / 2, cartW, cartH);
    ctx.fillStyle = "#0e7490";
    ctx.beginPath(); ctx.arc(cx - cartW / 4, trackY + cartH / 2, 6, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + cartW / 4, trackY + cartH / 2, 6, 0, 7); ctx.fill();

    // pole (upright = straight up); angle grows toward the +x side
    const px = cx + Math.sin(th) * poleLen;
    const py = trackY - Math.cos(th) * poleLen;
    const upright = Math.abs(th) < 0.05;
    ctx.strokeStyle = upright ? PALETTE.accent : "#f59e0b";
    ctx.lineWidth = 7; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(cx, trackY); ctx.lineTo(px, py); ctx.stroke();
    ctx.fillStyle = "#f472b6"; ctx.beginPath(); ctx.arc(px, py, 12, 0, 7); ctx.fill();
    ctx.fillStyle = "#334155"; ctx.beginPath(); ctx.arc(cx, trackY, 4, 0, 7); ctx.fill();

    // ---- trajectory plot (bottom strip) ----
    const plotTop = H * 0.68, plotH = H - plotTop - 22, plotBot = plotTop + plotH, mid = plotTop + plotH / 2;
    ctx.strokeStyle = PALETTE.grid; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(40, mid); ctx.lineTo(W - 14, mid); ctx.stroke();
    ctx.fillStyle = PALETTE.text; ctx.font = "11px ui-sans-serif, system-ui";
    ctx.fillText("state trajectories", 40, plotTop - 6);

    const n = sim.states.length;
    const xOf = (k: number) => 40 + (k / (n - 1)) * (W - 54);
    // scale angle (rad) and position (m) to the strip
    let maxAbs = 1e-6;
    for (const st of sim.states) maxAbs = Math.max(maxAbs, Math.abs(st[2]), Math.abs(st[0]));
    const yOf = (v: number) => mid - (v / maxAbs) * (plotH / 2 - 6);

    const drawSeries = (idx: number, color: string) => {
      ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath();
      for (let k = 0; k <= i; k++) { const X = xOf(k), Y = yOf(sim.states[k][idx]); k ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
      ctx.stroke();
    };
    drawSeries(2, PALETTE.series[0]); // angle
    drawSeries(0, PALETTE.series[1]); // position
    // playhead
    ctx.strokeStyle = "#475569"; ctx.setLineDash([2, 4]);
    ctx.beginPath(); ctx.moveTo(xOf(i), plotTop + 4); ctx.lineTo(xOf(i), plotBot); ctx.stroke(); ctx.setLineDash([]);
    // legend
    ctx.fillStyle = PALETTE.series[0]; ctx.fillRect(W - 150, plotTop - 12, 10, 3);
    ctx.fillStyle = PALETTE.text; ctx.fillText("angle", W - 136, plotTop - 6);
    ctx.fillStyle = PALETTE.series[1]; ctx.fillRect(W - 90, plotTop - 12, 10, 3);
    ctx.fillStyle = PALETTE.text; ctx.fillText("position", W - 76, plotTop - 6);

    // status badge
    ctx.font = "600 13px ui-sans-serif, system-ui";
    ctx.fillStyle = sim.maxRe < 0 ? PALETTE.accent : "#ef4444";
    ctx.fillText(sim.maxRe < 0 ? "closed loop STABLE" : "UNSTABLE", 24, 30);
  }, [sim, tick]);

  // Animation loop (restarts when the scenario changes).
  useEffect(() => {
    setTick(0);
    const id = setInterval(() => setTick((t) => (t < 402 ? t + 3 : 0)), 33);
    return () => clearInterval(id);
  }, [sim]);

  const explain =
    r <= 0.05
      ? `With control effort cheap (R = ${r}), the LQR gain is large: the controller slams the cart to yank the pole upright fast — quick settling (~${sim.settle.toFixed(1)} s) but peak force near ${sim.peakU.toFixed(0)} N.`
      : r >= 3
      ? `Expensive control (R = ${r}) penalizes force heavily, so the gain is small and gentle: the pole is nursed back slowly (settling ~${sim.settle.toFixed(1)} s) with a modest peak force of ${sim.peakU.toFixed(0)} N.`
      : `LQR balances state error against control effort here (R = ${r}): the pole recovers in about ${sim.settle.toFixed(1)} s with a peak force near ${sim.peakU.toFixed(0)} N. Lower R to react harder, raise it to act gentler.`;

  const code = `import numpy as np
from scipy.linalg import solve_continuous_are

# Cart-pole linearized about the upright equilibrium
M, m, l, g = ${CART_M}, ${POLE_M}, ${POLE_L}, ${GRAV}
A = np.array([
    [0, 1, 0, 0],
    [0, 0, -m*g/M, 0],
    [0, 0, 0, 1],
    [0, 0, g*(M + m)/(M*l), 0],
])
B = np.array([[0.0], [1/M], [0.0], [-1/(M*l)]])

# LQR weights
Q = np.diag([${qPos}, 0.1, ${qAng}, 0.1])   # penalize [pos, vel, angle, ang.vel]
R = np.array([[${r}]])                        # penalize control effort

# Solve the continuous-time algebraic Riccati equation, then form the gain
P = solve_continuous_are(A, B, Q, R)
K = np.linalg.inv(R) @ B.T @ P
print("K =", K)
print("closed-loop eigenvalues =", np.linalg.eigvals(A - B @ K))`;

  const kStr = `[${sim.K.map((v) => v.toFixed(1)).join(", ")}]`;
  const eigStr = sim.eig.map(fmtCx).join(", ");

  return (
    <StudioChrome title="LQR Control Studio" tagline="optimal state-feedback stabilization"
      controls={<div>
        <p className="mb-3 text-xs text-slate-500">Balance an inverted pendulum with an <b>optimal</b> controller. The gain K is computed by solving the Riccati equation for your Q/R weights — not hand-tuned. Cheap control (low R) reacts hard; expensive control (high R) acts gently.</p>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="Q — position weight" value={qPos} min={0.1} max={20} step={0.1} onChange={(v) => update({ qPos: v })} />
        <Slider label="Q — angle weight" value={qAng} min={1} max={150} step={1} onChange={(v) => update({ qAng: v })} />
        <Slider label="R — control effort" value={r} min={0.02} max={8} step={0.02} onChange={(v) => update({ r: v })} />
        <Slider label="Initial disturbance (°)" value={dist} min={2} max={45} step={1} onChange={(v) => update({ dist: v })} />
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Gain K" value={kStr} />
        <Stat label="Closed-loop poles" value={sim.eig.length ? fmtCx(sim.eig[0]) : "—"} />
        <Stat label="Max Re(λ)" value={sim.maxRe.toFixed(2)} />
        <Stat label="Stability" value={sim.maxRe < 0 ? "stable ✓" : "unstable"} />
        <Stat label="Settling time" value={`${sim.settle.toFixed(1)} s`} />
        <Stat label="Peak force" value={`${sim.peakU.toFixed(0)} N`} />
        <div className="mt-1 break-words text-[10px] leading-relaxed text-slate-500">λ = {eigStr}</div>
        <Equation tex={`J=\\int_0^\\infty (x^{\\top}Qx+u^{\\top}Ru)\\,dt,\\quad K=R^{-1}B^{\\top}P`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" /></StudioChrome>
  );
}
