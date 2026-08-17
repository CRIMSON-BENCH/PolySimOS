"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

export function LogisticGrowthStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [r, setR] = useState(0.5);
  const [K, setK] = useState(1000);
  const [N0, setN0] = useState(20);

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const W = 540, H = 340; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, oy = H - 30, pw = W - 65, ph = H - 50; const days = 40; const dt = 0.05;
    let Nl = N0, Ne = N0; const log: number[] = [Nl], exp: number[] = [Ne];
    for (let t = 0; t < days / dt; t++) { Nl += r * Nl * (1 - Nl / K) * dt; Ne += r * Ne * dt; if (t % 4 === 0) { log.push(Nl); exp.push(Math.min(Ne, K * 2)); } }
    const yMax = K * 1.3;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    // carrying capacity line
    ctx.strokeStyle = "#475569"; ctx.setLineDash([5, 4]); const ky = oy - (K / yMax) * ph; ctx.beginPath(); ctx.moveTo(ox, ky); ctx.lineTo(ox + pw, ky); ctx.stroke(); ctx.setLineDash([]);
    const plot = (arr: number[], col: string) => { ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); arr.forEach((v, i) => { const x = ox + (i / arr.length) * pw; const y = oy - (Math.min(v, yMax) / yMax) * ph; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke(); };
    plot(exp, "#f472b6"); plot(log, "#22d3ee");
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("K (carrying capacity)", ox + pw - 130, ky - 5); ctx.fillStyle = "#22d3ee"; ctx.fillText("logistic", ox + 8, oy - ph + 14); ctx.fillStyle = "#f472b6"; ctx.fillText("exponential", ox + 60, oy - ph + 14);
  }, [r, K, N0]);

  return (
    <StudioChrome title="Logistic Population Growth" tagline="growth with a ceiling"
      controls={<div>
        <Slider label="Growth rate r" value={r} min={0.05} max={2} step={0.05} onChange={setR} />
        <Slider label="Carrying capacity K" value={K} min={100} max={2000} step={50} onChange={setK} />
        <Slider label="Initial population N₀" value={N0} min={1} max={500} step={1} onChange={setN0} />
        <p className="mt-3 text-xs text-slate-500">Exponential growth assumes unlimited resources and explodes without bound. Logistic growth adds a carrying capacity K: as the population nears K, growth slows and levels off in a characteristic S-curve. It is the foundation of ecology, epidemiology, and resource management.</p>
      </div>}
      inspector={<div><Stat label="Carrying capacity" value={String(K)} /><Stat label="Max growth at" value={`N = ${(K / 2).toFixed(0)}`} /><Stat label="Growth rate r" value={r.toFixed(2)} /></div>}
    ><canvas ref={canvasRef} width={540} height={340} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
