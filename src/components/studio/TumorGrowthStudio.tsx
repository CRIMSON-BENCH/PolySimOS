"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

export function TumorGrowthStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [N0, setN0] = useState(1), [K, setK] = useState(1000), [b, setB] = useState(0.05), [model, setModel] = useState(0);
  const gompertz = (t: number) => K * Math.exp(Math.log(N0 / K) * Math.exp(-b * t));
  const logistic = (t: number) => K / (1 + (K / N0 - 1) * Math.exp(-b * 4 * t));
  const f = model ? logistic : gompertz;
  const days = 200; const halfT = (() => { for (let t = 0; t < days; t++) if (f(t) >= K / 2) return t; return days; })();

  useEffect(() => {
    const ctx = c.current!.getContext("2d")!; const W = 520, H = 320; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, oy = H - 32, pw = W - 65, ph = H - 52;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    ctx.strokeStyle = "#475569"; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(ox, oy - ph * 0.95); ctx.lineTo(ox + pw, oy - ph * 0.95); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = "#f472b6"; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= pw; i++) { const t = days * i / pw; const y = oy - (f(t) / K) * ph * 0.95; i ? ctx.lineTo(ox + i, y) : ctx.moveTo(ox + i, y); } ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText(`${model ? "logistic" : "Gompertz"} tumor growth toward carrying capacity`, ox + 6, oy - ph + 12); ctx.fillText("days →", ox + pw - 44, oy + 18);
  }, [N0, K, b, model, f]);

  return (
    <StudioChrome title="Tumor Growth" tagline="Gompertz & logistic dynamics"
      controls={<div>
        <label className="mb-2 block text-xs text-slate-400">Model</label>
        <select value={model} onChange={(e) => setModel(Number(e.target.value))} className="mb-3 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"><option value={0}>Gompertz</option><option value={1}>Logistic</option></select>
        <Slider label="Initial size N₀" value={N0} min={1} max={100} step={1} onChange={setN0} />
        <Slider label="Carrying capacity K" value={K} min={100} max={5000} step={100} onChange={setK} />
        <Slider label="Growth rate b" value={b} min={0.01} max={0.2} step={0.01} onChange={setB} />
        <p className="mt-3 text-xs text-slate-500">Tumors do not grow exponentially forever — they slow as they outstrip their blood supply. Gompertz and logistic models both bend toward a carrying capacity, with growth fastest early on. This shape guides how treatments are timed. Educational tool, not medical advice.</p>
      </div>}
      inspector={<div>
        <Stat label="Size at day 100" value={`${f(100).toFixed(0)}`} />
        <Stat label="Time to half-max" value={`${halfT} days`} />
        <Stat label="Carrying capacity" value={`${K}`} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
