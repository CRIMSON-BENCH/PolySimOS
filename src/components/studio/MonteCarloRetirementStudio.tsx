"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

export function MonteCarloRetirementStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [start, setStart] = useState(500), [contrib, setContrib] = useState(20), [ret, setRet] = useState(6), [vol, setVol] = useState(12), [years, setYears] = useState(30);
  // deterministic percentile bands (lognormal approx) — no RNG
  const r = ret / 100, s = vol / 100;
  const band = (z: number, t: number) => { let v = start; for (let i = 0; i < t; i++) v = v * (1 + r + z * s / Math.sqrt(1)) + contrib; return v; };
  const median = band(0, years), p10 = band(-1.28, years), p90 = band(1.28, years);

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 50, oy = H - 32, pw = W - 70, ph = H - 52, ymax = band(1.28, years) * 1.1;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    const line = (z: number, col: string, w: number) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); for (let t = 0; t <= years; t++) { const x = ox + t / years * pw, y = oy - (band(z, t) / ymax) * ph; t ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); };
    line(1.28, "#334155", 1); line(-1.28, "#334155", 1); line(0.52, "#0e7490", 1); line(-0.52, "#0e7490", 1); line(0, "#22d3ee", 2);
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("portfolio value — median (cyan) with 10th–90th percentile band", ox + 6, oy - ph + 12); ctx.fillText("years →", ox + pw - 44, oy + 18);
  }, [start, contrib, ret, vol, years]);

  return (
    <StudioChrome title="Retirement Monte Carlo" tagline="range of outcomes, not one line"
      controls={<div>
        <Slider label="Starting savings ($k)" value={start} min={0} max={2000} step={25} onChange={setStart} />
        <Slider label="Annual contribution ($k)" value={contrib} min={0} max={100} step={1} onChange={setContrib} />
        <Slider label="Expected return (%)" value={ret} min={2} max={12} step={0.5} onChange={setRet} />
        <Slider label="Volatility (%)" value={vol} min={2} max={25} step={1} onChange={setVol} />
        <Slider label="Years" value={years} min={5} max={45} step={1} onChange={setYears} />
        <p className="mt-3 text-xs text-slate-500">Markets are uncertain, so a single projection lies. This shows a band of outcomes: even with the same average return, higher volatility widens the gap between a great result and a disappointing one. Educational tool, not financial advice.</p>
      </div>}
      inspector={<div>
        <Stat label="Median outcome" value={`$${median.toFixed(0)}k`} />
        <Stat label="10th percentile" value={`$${p10.toFixed(0)}k`} />
        <Stat label="90th percentile" value={`$${p90.toFixed(0)}k`} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
