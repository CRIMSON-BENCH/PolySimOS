"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const W = 760, H = 460;

// Each ODE dy/dx = f(x, y) paired with a KNOWN analytic solution so we can measure true error.
type Ode = {
  f: (x: number, y: number) => number;
  exact: (x: number) => number;
  y0: number;
  xEnd: number; // sensible default x-range end
  tex: string;
  py: string; // Python expression for f(x, y)
  note: string;
};

const ODES: Record<string, Ode> = {
  "Growth  y′=y": { f: (_x, y) => y, exact: (x) => Math.exp(x), y0: 1, xEnd: 4, tex: "y' = y", py: "y", note: "exact eˣ" },
  "Decay  y′=−2y": { f: (_x, y) => -2 * y, exact: (x) => Math.exp(-2 * x), y0: 1, xEnd: 3, tex: "y' = -2y", py: "-2*y", note: "exact e^{-2x}" },
  "Sine  y′=cos x": { f: (x) => Math.cos(x), exact: (x) => Math.sin(x), y0: 0, xEnd: 6, tex: "y' = \\cos x", py: "np.cos(x)", note: "exact sin x" },
  "Classic test": { f: (x, y) => y - x * x + 1, exact: (x) => (x + 1) * (x + 1) - 0.5 * Math.exp(x), y0: 0.5, xEnd: 4, tex: "y' = y - x^2 + 1", py: "y - x**2 + 1", note: "Burden–Faires test problem" },
  "Stiff  y′=−15y": { f: (_x, y) => -15 * y, exact: (x) => Math.exp(-15 * x), y0: 1, xEnd: 2, tex: "y' = -15y", py: "-15*y", note: "Euler blows up when h > 2/15 ≈ 0.13" },
};

const STEP_PRESETS: Record<string, { h: number }> = {
  "Coarse (h=0.5)": { h: 0.5 },
  "Medium (h=0.25)": { h: 0.25 },
  "Fine (h=0.1)": { h: 0.1 },
  "Very fine (h=0.05)": { h: 0.05 },
};

const COLORS = { exact: "#e2e8f0", euler: "#f472b6", heun: "#f59e0b", rk4: "#a3e635" };

// One fixed-step integration. `step` advances (x, y) by one method step of size hh.
function integrate(ode: Ode, x0: number, xEnd: number, hh: number, step: (f: Ode["f"], x: number, y: number, h: number) => number) {
  const n = Math.max(1, Math.round((xEnd - x0) / hh));
  const pts: [number, number][] = [[x0, ode.y0]];
  let x = x0, y = ode.y0;
  for (let i = 0; i < n; i++) {
    y = step(ode.f, x, y, hh);
    x = x0 + (i + 1) * hh;
    pts.push([x, y]);
  }
  return { pts, lastX: x, finalErr: Math.abs(y - ode.exact(x)) };
}

const eulerStep = (f: Ode["f"], x: number, y: number, h: number) => y + h * f(x, y);
const heunStep = (f: Ode["f"], x: number, y: number, h: number) => {
  const k1 = f(x, y);
  const k2 = f(x + h, y + h * k1);
  return y + (h / 2) * (k1 + k2);
};
const rk4Step = (f: Ode["f"], x: number, y: number, h: number) => {
  const k1 = f(x, y);
  const k2 = f(x + h / 2, y + (h / 2) * k1);
  const k3 = f(x + h / 2, y + (h / 2) * k2);
  const k4 = f(x + h, y + h * k3);
  return y + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
};

// Observed order p ≈ log2(err(h) / err(h/2)).
function observedOrder(errH: number, errH2: number): number | null {
  if (!(errH > 0) || !(errH2 > 0)) return null;
  const o = Math.log2(errH / errH2);
  return Number.isFinite(o) ? Math.max(0, o) : null;
}

const fmtErr = (e: number) => (Number.isFinite(e) ? e.toExponential(2) : "∞ (diverged)");
const fmtOrder = (o: number | null) => (o === null ? "—" : o.toFixed(2));

export function ODEMethodsStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [odeKey, setOdeKey] = useState("Growth  y′=y");
  const [{ h, xEnd }, update] = useShareableNumbers({ h: 0.5, xEnd: 4 });
  const [show, setShow] = useState({ euler: true, heun: true, rk4: true });

  const ode = ODES[odeKey];
  const x0 = 0;

  const sim = useMemo(() => {
    const euler = integrate(ode, x0, xEnd, h, eulerStep);
    const heun = integrate(ode, x0, xEnd, h, heunStep);
    const rk4 = integrate(ode, x0, xEnd, h, rk4Step);
    // Half-step runs for observed-order estimates.
    const eulerH2 = integrate(ode, x0, xEnd, h / 2, eulerStep).finalErr;
    const heunH2 = integrate(ode, x0, xEnd, h / 2, heunStep).finalErr;
    const rk4H2 = integrate(ode, x0, xEnd, h / 2, rk4Step).finalErr;
    return {
      euler, heun, rk4,
      order: {
        euler: observedOrder(euler.finalErr, eulerH2),
        heun: observedOrder(heun.finalErr, heunH2),
        rk4: observedOrder(rk4.finalErr, rk4H2),
      },
    };
  }, [ode, xEnd, h]);

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H);
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const pad = 46;

    // Y-range from the analytic solution (so a diverging Euler shoots off-canvas instead of squashing the plot).
    let ymin = Infinity, ymax = -Infinity;
    for (let x = x0; x <= xEnd + 1e-9; x += (xEnd - x0) / 240) {
      const v = ode.exact(x); if (v < ymin) ymin = v; if (v > ymax) ymax = v;
    }
    ymin = Math.min(ymin, ode.y0); ymax = Math.max(ymax, ode.y0);
    const span = ymax - ymin || 1; ymin -= span * 0.15; ymax += span * 0.15;

    const sx = (x: number) => pad + ((x - x0) / (xEnd - x0)) * (W - 2 * pad);
    const sy = (y: number) => H - pad - ((y - ymin) / (ymax - ymin)) * (H - 2 * pad);

    // Grid.
    ctx.strokeStyle = "#1e293b"; ctx.lineWidth = 1; ctx.font = "11px system-ui"; ctx.fillStyle = "#64748b";
    for (let i = 0; i <= 5; i++) {
      const gx = pad + (i / 5) * (W - 2 * pad);
      ctx.beginPath(); ctx.moveTo(gx, pad); ctx.lineTo(gx, H - pad); ctx.stroke();
      ctx.fillText((x0 + (i / 5) * (xEnd - x0)).toFixed(1), gx - 8, H - pad + 16);
    }
    for (let i = 0; i <= 4; i++) {
      const gy = pad + (i / 4) * (H - 2 * pad);
      ctx.beginPath(); ctx.moveTo(pad, gy); ctx.lineTo(W - pad, gy); ctx.stroke();
      ctx.fillText((ymax - (i / 4) * (ymax - ymin)).toFixed(1), 6, gy + 4);
    }
    // Axes (x=x0 and y=0 when in view).
    ctx.strokeStyle = "#334155"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(pad, pad); ctx.lineTo(pad, H - pad); ctx.stroke();
    if (0 >= ymin && 0 <= ymax) { ctx.beginPath(); ctx.moveTo(pad, sy(0)); ctx.lineTo(W - pad, sy(0)); ctx.stroke(); }

    // Clip to the plot rect so a blowing-up polyline doesn't scribble over labels/legend.
    ctx.save();
    ctx.beginPath(); ctx.rect(pad, pad, W - 2 * pad, H - 2 * pad); ctx.clip();

    // Analytic reference curve (smooth, thick).
    ctx.strokeStyle = COLORS.exact; ctx.lineWidth = 2.5; ctx.beginPath();
    for (let i = 0; i <= 300; i++) { const x = x0 + (i / 300) * (xEnd - x0); const px = sx(x), py = sy(ode.exact(x)); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.stroke();

    const drawMethod = (pts: [number, number][], color: string) => {
      ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath();
      pts.forEach((p, i) => (i ? ctx.lineTo(sx(p[0]), sy(p[1])) : ctx.moveTo(sx(p[0]), sy(p[1]))));
      ctx.stroke();
      if (pts.length <= 45) pts.forEach((p) => { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(sx(p[0]), sy(p[1]), 2.8, 0, 7); ctx.fill(); });
    };
    if (show.euler) drawMethod(sim.euler.pts, COLORS.euler);
    if (show.heun) drawMethod(sim.heun.pts, COLORS.heun);
    if (show.rk4) drawMethod(sim.rk4.pts, COLORS.rk4);
    ctx.restore();

    // Legend.
    ctx.font = "12px system-ui"; let lx = pad + 4; const ly = pad - 14 < 14 ? 18 : pad - 14;
    const legend: [boolean, string, string][] = [[true, COLORS.exact, "analytic"], [show.euler, COLORS.euler, "Euler"], [show.heun, COLORS.heun, "Heun (RK2)"], [show.rk4, COLORS.rk4, "RK4"]];
    for (const [on, color, name] of legend) {
      if (!on) continue;
      ctx.fillStyle = color; ctx.fillRect(lx, ly - 8, 12, 4); lx += 16;
      ctx.fillStyle = "#cbd5e1"; ctx.fillText(name, lx, ly - 2); lx += ctx.measureText(name).width + 18;
    }
  }, [ode, sim, show, xEnd, h]);

  const worst = sim.euler.finalErr;
  const explain = !Number.isFinite(worst)
    ? `At h = ${h.toFixed(2)} Euler is unstable for this ODE: its amplification factor exceeds 1, so the local error compounds each step and the solution diverges. RK4's much smaller local truncation error (O(h⁵) per step) keeps it stable and on top of the analytic curve at the same step size.`
    : `Each step commits a local truncation error — O(h²) for Euler, O(h³) for Heun, O(h⁵) for RK4 — and those accumulate over ~${Math.round((xEnd - x0) / h)} steps into the global error shown (one order lower: O(h), O(h²), O(h⁴)). That extra power of h is why halving the step cuts Euler's error ~2×, Heun's ~4×, and RK4's ~16×, so RK4 hugs the true y(x) far more tightly for the same work.`;

  const code = `import numpy as np

# dy/dx = f(x, y) with known analytic solution; compare Euler & RK4.
def f(x, y):
    return ${ode.py}

x0, y0, x_end, h = ${x0}, ${ode.y0}, ${xEnd}, ${h}
n = max(1, round((x_end - x0) / h))

def euler(f, x0, y0, h, n):
    xs = x0 + h * np.arange(n + 1); y = y0; ys = [y]
    for i in range(n):
        y = y + h * f(xs[i], y); ys.append(y)
    return xs, np.array(ys)

def rk4(f, x0, y0, h, n):
    xs = x0 + h * np.arange(n + 1); y = y0; ys = [y]
    for i in range(n):
        x = xs[i]
        k1 = f(x, y)
        k2 = f(x + h/2, y + h/2 * k1)
        k3 = f(x + h/2, y + h/2 * k2)
        k4 = f(x + h,   y + h   * k3)
        y = y + h/6 * (k1 + 2*k2 + 2*k3 + k4); ys.append(y)
    return xs, np.array(ys)

xs, ye = euler(f, x0, y0, h, n)
_,  yr = rk4(f, x0, y0, h, n)
exact = ${odeKey === "Growth  y′=y" ? "np.exp(xs)" : odeKey === "Decay  y′=−2y" ? "np.exp(-2*xs)" : odeKey === "Sine  y′=cos x" ? "np.sin(xs)" : odeKey === "Classic test" ? "(xs + 1)**2 - 0.5*np.exp(xs)" : "np.exp(-15*xs)"}
print("Euler global error:", abs(ye[-1] - exact[-1]))
print("RK4   global error:", abs(yr[-1] - exact[-1]))`;

  const toggleBtn = (key: keyof typeof show, label: string, color: string) => (
    <button
      onClick={() => setShow((s) => ({ ...s, [key]: !s[key] }))}
      className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold ${show[key] ? "bg-slate-800 text-white dark:bg-slate-700" : "border border-slate-300 text-slate-500 opacity-60 dark:border-slate-700 dark:text-slate-400"}`}
    >
      <span className="inline-block h-2 w-3 rounded-sm" style={{ background: color }} />
      {label}
    </button>
  );

  return (
    <StudioChrome title="ODE Solver Methods" tagline="Euler vs Heun vs RK4"
      controls={<div>
        <div className="mb-3 grid grid-cols-1 gap-1.5">{Object.keys(ODES).map((k) => <button key={k} onClick={() => { setOdeKey(k); update({ xEnd: ODES[k].xEnd }); }} className={`rounded-lg px-2 py-1 text-xs font-semibold ${odeKey === k ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{k}</button>)}</div>
        <p className="mb-3 text-xs text-slate-500">Integrate {ode.note}. Raise the step size to watch Euler drift (or, on the stiff ODE, blow up) while RK4 stays glued to the analytic curve.</p>
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">Show methods</p>
        <div className="mb-3 flex flex-wrap gap-1.5">{toggleBtn("euler", "Euler", COLORS.euler)}{toggleBtn("heun", "Heun", COLORS.heun)}{toggleBtn("rk4", "RK4", COLORS.rk4)}</div>
        <Presets presets={Object.keys(STEP_PRESETS).map((label) => ({ label }))} onApply={(label) => update(STEP_PRESETS[label])} />
        <Slider label="Step size h" value={h} min={0.05} max={1} step={0.05} onChange={(v) => update({ h: v })} />
        <Slider label="x-range end" value={xEnd} min={1} max={8} step={0.5} onChange={(v) => update({ xEnd: v })} />
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="ODE" value={ode.tex.replace(/\\/g, "")} />
        <Stat label="Steps" value={`${Math.round((xEnd - x0) / h)}`} />
        <Stat label="Euler error" value={fmtErr(sim.euler.finalErr)} />
        <Stat label="Heun error" value={fmtErr(sim.heun.finalErr)} />
        <Stat label="RK4 error" value={fmtErr(sim.rk4.finalErr)} />
        <Stat label="Order (E / H / RK4)" value={`${fmtOrder(sim.order.euler)} / ${fmtOrder(sim.order.heun)} / ${fmtOrder(sim.order.rk4)}`} />
        <Equation tex={`\\begin{aligned}k_1&=f(x_n,y_n)\\\\ k_2&=f\\!\\left(x_n+\\tfrac h2,\\,y_n+\\tfrac h2 k_1\\right)\\\\ k_3&=f\\!\\left(x_n+\\tfrac h2,\\,y_n+\\tfrac h2 k_2\\right)\\\\ k_4&=f\\!\\left(x_n+h,\\,y_n+h\\,k_3\\right)\\\\ y_{n+1}&=y_n+\\tfrac h6\\,(k_1+2k_2+2k_3+k_4)\\\\[2pt] \\text{Euler:}&\\ \\ y_{n+1}=y_n+h\\,f(x_n,y_n),\\ h=${h.toFixed(2)}\\end{aligned}`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" /></StudioChrome>
  );
}
