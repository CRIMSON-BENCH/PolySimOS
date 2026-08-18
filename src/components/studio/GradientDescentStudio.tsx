"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const W = 760, H = 480;

const SURFACES: Record<string, (x: number, y: number) => number> = {
  bowl: (x, y) => 0.04 * (x * x + y * y),
  saddle: (x, y) => 0.03 * (x * x - y * y) + 20,
  rosenbrock: (x, y) => 0.0006 * ((1 - x / 10) ** 2 + 100 * (y / 10 - (x / 10) ** 2) ** 2) * 100,
  ripple: (x, y) => 10 + 6 * Math.sin(x / 12) * Math.cos(y / 12) + 0.01 * (x * x + y * y),
};

// Python expression for f(x, y) matching each SURFACES entry, for the exportable snippet.
const SURFACE_PY: Record<string, string> = {
  bowl: "0.04*(x*x + y*y)",
  saddle: "0.03*(x*x - y*y) + 20",
  rosenbrock: "0.0006*((1 - x/10)**2 + 100*(y/10 - (x/10)**2)**2)*100",
  ripple: "10 + 6*np.sin(x/12)*np.cos(y/12) + 0.01*(x*x + y*y)",
};

const PRESETS: Record<string, { lr: number; momentum: number }> = {
  "Too-high LR (diverges)": { lr: 8, momentum: 0.9 },
  "Tiny LR (crawls)": { lr: 0.5, momentum: 0 },
  "Well-tuned": { lr: 3, momentum: 0.8 },
  "Overshoot & oscillate": { lr: 6.5, momentum: 0.5 },
};

export function GradientDescentStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [surface, setSurface] = useState("ripple");
  const [{ lr, momentum }, update] = useShareableNumbers({ lr: 3, momentum: 0.8 });
  const [tick, setTick] = useState(0);

  const path = useMemo(() => {
    const f = SURFACES[surface]; const h = 0.5;
    let x = -120, y = 90, vx = 0, vy = 0; const pts: [number, number][] = [[x, y]];
    for (let i = 0; i < 200; i++) {
      const gx = (f(x + h, y) - f(x - h, y)) / (2 * h), gy = (f(x, y + h) - f(x, y - h)) / (2 * h);
      vx = momentum * vx - lr * gx; vy = momentum * vy - lr * gy; x += vx; y += vy;
      x = Math.max(-W / 2 + 20, Math.min(W / 2 - 20, x)); y = Math.max(-H / 2 + 20, Math.min(H / 2 - 20, y));
      pts.push([x, y]);
    }
    return pts;
  }, [surface, lr, momentum]);

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H); const f = SURFACES[surface];
    const img = ctx.createImageData(W, H); let min = Infinity, max = -Infinity; const vals = new Float32Array(W * H);
    for (let py = 0; py < H; py += 1) for (let px = 0; px < W; px += 1) { const v = f(px - W / 2, py - H / 2); vals[py * W + px] = v; if (v < min) min = v; if (v > max) max = v; }
    for (let i = 0; i < W * H; i++) { const t = (vals[i] - min) / (max - min || 1); img.data[i * 4] = 20 + t * 60; img.data[i * 4 + 1] = 30 + (1 - t) * 120; img.data[i * 4 + 2] = 60 + (1 - t) * 160; img.data[i * 4 + 3] = 255; }
    ctx.putImageData(img, 0, 0);
    // path
    const n = Math.min(path.length, 2 + tick);
    ctx.strokeStyle = "#fbbf24"; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i < n; i++) { const [x, y] = path[i]; i ? ctx.lineTo(x + W / 2, y + H / 2) : ctx.moveTo(x + W / 2, y + H / 2); } ctx.stroke();
    const [lx, ly] = path[n - 1]; ctx.fillStyle = "#a3e635"; ctx.beginPath(); ctx.arc(lx + W / 2, ly + H / 2, 6, 0, 7); ctx.fill();
  }, [surface, path, tick]);

  useEffect(() => { setTick(0); const id = setInterval(() => setTick((t) => (t < 200 ? t + 2 : t)), 40); return () => clearInterval(id); }, [surface, lr, momentum]);

  const explain =
    lr >= 6
      ? `A learning rate of ${lr} is large relative to this landscape's curvature: each step overshoots the minimum, so the path diverges or bounces around instead of settling.`
      : lr <= 1
      ? `A learning rate of ${lr} is tiny, so descent crawls — steps are stable but so short that 200 iterations barely reach the basin.`
      : `A learning rate of ${lr} is well matched to the curvature here: steps are large enough to make progress yet small enough to avoid overshoot, giving a smooth, roughly quadratic descent toward the minimum.`;

  const code = `import numpy as np

lr, momentum = ${lr}, ${momentum}
h = 0.5

def f(x, y):
    return ${SURFACE_PY[surface]}

x, y, vx, vy = -120.0, 90.0, 0.0, 0.0
path = [(x, y)]
for _ in range(200):
    gx = (f(x + h, y) - f(x - h, y)) / (2 * h)
    gy = (f(x, y + h) - f(x, y - h)) / (2 * h)
    vx = momentum * vx - lr * gx
    vy = momentum * vy - lr * gy
    x += vx; y += vy
    path.append((x, y))
print("final", path[-1], "loss", f(x, y))`;

  return (
    <StudioChrome title="Gradient Descent Studio" tagline="optimization on a loss landscape"
      controls={<div>
        <div className="mb-3 grid grid-cols-2 gap-1.5">{Object.keys(SURFACES).map((s) => <button key={s} onClick={() => setSurface(s)} className={`rounded-lg px-2 py-1 text-xs font-semibold capitalize ${surface === s ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{s}</button>)}</div>
        <p className="mb-3 text-xs text-slate-500">Watch gradient descent (with momentum) roll downhill on different loss landscapes. Too high a learning rate overshoots.</p>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="Learning rate" value={lr} min={0.5} max={8} step={0.5} onChange={(v) => update({ lr: v })} />
        <Slider label="Momentum" value={momentum} min={0} max={0.95} step={0.05} onChange={(v) => update({ momentum: v })} />
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Surface" value={surface} /><Stat label="Step" value={`${Math.min(tick, 200)}/200`} /><Stat label="Optimizer" value="momentum GD" /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" /></StudioChrome>
  );
}
