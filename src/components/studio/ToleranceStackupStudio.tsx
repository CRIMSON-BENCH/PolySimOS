"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

export function ToleranceStackupStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nParts, setNParts] = useState(5);
  const [tol, setTol] = useState(0.1);

  const N = Math.round(nParts); const worstCase = N * tol; const rss = Math.sqrt(N) * tol;

  useEffect(() => {
    const W = 500, H = 260; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 30, cy = 90; let x = ox;
    for (let i = 0; i < N; i++) { const w = (W - 60) / N; ctx.fillStyle = "#334155"; ctx.fillRect(x, cy - 20, w - 4, 40); ctx.strokeStyle = "#22d3ee"; ctx.strokeRect(x, cy - 20, w - 4, 40); ctx.fillStyle = "#94a3b8"; ctx.font = "10px sans-serif"; ctx.fillText(`±${tol}`, x + w / 2 - 12, cy + 4); x += w; }
    ctx.fillStyle = "#e2e8f0"; ctx.font = "11px sans-serif"; ctx.fillText(`${N} stacked parts`, ox, cy - 32);
    // bars comparing worst-case vs RSS
    const by = 180; const scale = 200 / worstCase;
    ctx.fillStyle = "#f472b6"; ctx.fillRect(ox, by, worstCase * scale, 20); ctx.fillStyle = "#a3e635"; ctx.fillRect(ox, by + 30, rss * scale, 20);
    ctx.fillStyle = "#f9a8d4"; ctx.fillText(`worst case ±${worstCase.toFixed(2)}`, ox + worstCase * scale + 6, by + 15); ctx.fillStyle = "#bef264"; ctx.fillText(`statistical (RSS) ±${rss.toFixed(2)}`, ox + rss * scale + 6, by + 45);
  }, [nParts, tol]);

  return (
    <StudioChrome title="Tolerance Stack-Up" tagline="worst-case vs statistical"
      controls={<div>
        <Slider label="Number of parts" value={nParts} min={2} max={12} step={1} onChange={setNParts} />
        <Slider label="Tolerance per part (±mm)" value={tol} min={0.01} max={0.5} step={0.01} onChange={setTol} />
        <p className="mt-3 text-xs text-slate-500">When parts stack in an assembly, their tolerances accumulate. Worst-case analysis simply adds them — safe but pessimistic, since all parts rarely hit their extremes together. Statistical (root-sum-square) analysis adds them in quadrature, giving a much tighter, more realistic range. Choosing between them decides how much precision — and cost — each part really needs.</p>
      </div>}
      inspector={<div><Stat label="Worst-case total" value={`±${worstCase.toFixed(2)} mm`} /><Stat label="Statistical (RSS)" value={`±${rss.toFixed(2)} mm`} /><Stat label="RSS savings" value={`${((1 - rss / worstCase) * 100).toFixed(0)}% tighter`} /></div>}
    ><canvas ref={canvasRef} width={500} height={260} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
