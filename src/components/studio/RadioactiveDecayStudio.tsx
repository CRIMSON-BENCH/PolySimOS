"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const W = 740, H = 440;

const PRESETS: Record<string, { halfLife: number }> = {
  "Fast (1)": { halfLife: 1 },
  "Carbon-like (4)": { halfLife: 4 },
  "Slow (7)": { halfLife: 7 },
  "Very slow (10)": { halfLife: 10 },
};

export function RadioactiveDecayStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const [{ halfLife }, update] = useShareableNumbers({ halfLife: 4 });
  const [running, setRunning] = useState(true);
  const t = useRef(0);
  const [remaining, setRemaining] = useState(100);

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H);
    const loop = () => {
      if (running) t.current += 0.03; if (t.current > 24) t.current = 0;
      const frac = Math.pow(0.5, t.current / halfLife);
      setRemaining(frac * 100);
      ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H); const pad = 40;
      const sx = (tt: number) => pad + (tt / 24) * (W - 2 * pad); const sy = (f: number) => H - pad - f * (H - 2 * pad);
      ctx.strokeStyle = "#1e293b"; [0.25, 0.5, 0.75, 1].forEach((f) => { ctx.beginPath(); ctx.moveTo(pad, sy(f)); ctx.lineTo(W - pad, sy(f)); ctx.stroke(); });
      // half-life markers
      ctx.strokeStyle = "rgba(163,230,53,0.4)"; ctx.setLineDash([3, 3]); for (let n = 1; n * halfLife <= 24; n++) { ctx.beginPath(); ctx.moveTo(sx(n * halfLife), pad); ctx.lineTo(sx(n * halfLife), H - pad); ctx.stroke(); } ctx.setLineDash([]);
      ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2.5; ctx.beginPath(); for (let tt = 0; tt <= 24; tt += 0.1) { const f = Math.pow(0.5, tt / halfLife); tt ? ctx.lineTo(sx(tt), sy(f)) : ctx.moveTo(sx(tt), sy(f)); } ctx.stroke();
      ctx.fillStyle = "#a3e635"; ctx.beginPath(); ctx.arc(sx(t.current), sy(frac), 6, 0, 7); ctx.fill();
      ctx.fillStyle = "#94a3b8"; ctx.font = "12px system-ui"; ctx.fillText("fraction remaining vs time (green lines = half-lives)", pad, 22);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop); return () => cancelAnimationFrame(rafRef.current);
  }, [running, halfLife]);

  const explain =
    halfLife <= 2
      ? "A short half-life means the sample decays fast — several half-lives pass in the window, so almost nothing is left by the end."
      : halfLife >= 8
      ? "A long half-life means slow decay — even after the full window only a modest fraction has disappeared."
      : "Each half-life removes half of whatever remains, so the curve falls steeply at first and then flattens into a long tail.";

  const code = `import numpy as np
half_life = ${halfLife}
t = np.linspace(0, 24, 200)
frac = 0.5 ** (t / half_life)
print("remaining at t=24:", frac[-1] * 100, "%")`;

  return (
    <StudioChrome title="Radioactive Decay" tagline="exponential decay · half-life"
      controls={<div>
        <div className="mb-3 flex gap-2"><button onClick={() => setRunning((v) => !v)} className="flex-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-cyan-700">{running ? "Pause" : "Play"}</button><button onClick={() => (t.current = 0)} className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">Restart</button></div>
        <p className="mb-3 text-xs text-slate-500">Every half-life, half the remaining atoms decay. After n half-lives, only (1/2)ⁿ is left — the basis of carbon dating and nuclear physics.</p>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Half-life" value={halfLife} min={1} max={10} step={0.5} onChange={(v) => update({ halfLife: v })} />
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Half-life" value={halfLife.toFixed(1)} /><Stat label="Time" value={t.current.toFixed(1)} /><Stat label="Remaining" value={`${remaining.toFixed(1)}%`} /><Stat label="Half-lives" value={(t.current / halfLife).toFixed(2)} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" /></StudioChrome>
  );
}
